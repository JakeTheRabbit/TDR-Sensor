#!/usr/bin/env python3
"""Log a TDR Sensor node to CSV straight off its web server.

The ESPHome web server streams every reading over a Server-Sent
Events endpoint at http://<device>/events. This script subscribes to
it and writes a CSV. No Home Assistant, no MQTT, no database. Standard
library only, so there is nothing to install.

Examples
--------
Long format, one row per reading as it arrives:
    python tdr_logger.py 192.168.1.50

Wide format, one row every 60 seconds with a column per sensor:
    python tdr_logger.py tdr-sensor.local --wide --interval 60 --out grow.csv

Stop it with Ctrl-C. It reconnects on its own if the device reboots.
"""

from __future__ import annotations

import argparse
import csv
import json
import signal
import sys
import time
import urllib.request
from datetime import datetime, timezone


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Log a TDR Sensor node to CSV.")
    p.add_argument(
        "host",
        help="Device IP or hostname, for example 192.168.1.50 or tdr-sensor.local",
    )
    p.add_argument(
        "--out",
        default="tdr_log.csv",
        help="CSV file to write or append to (default tdr_log.csv)",
    )
    p.add_argument(
        "--wide",
        action="store_true",
        help="One row every --interval seconds with a column per sensor. "
        "Default is long format, one row per reading.",
    )
    p.add_argument(
        "--interval",
        type=float,
        default=60.0,
        help="Seconds between rows in wide mode (default 60)",
    )
    p.add_argument(
        "--port", type=int, default=80, help="Web server port (default 80)"
    )
    return p.parse_args()


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def iter_events(url: str):
    """Yield (event_name, data_dict) from an SSE stream.

    Reconnects on its own if the connection drops.
    """
    while True:
        try:
            with urllib.request.urlopen(url, timeout=30) as stream:
                event = "message"
                for raw in stream:
                    line = raw.decode("utf-8", "replace").rstrip("\n").rstrip("\r")
                    if line == "":
                        event = "message"
                        continue
                    if line.startswith(":"):
                        continue
                    if line.startswith("event:"):
                        event = line[6:].strip()
                    elif line.startswith("data:"):
                        payload = line[5:].strip()
                        try:
                            data = json.loads(payload)
                        except json.JSONDecodeError:
                            continue
                        yield event, data
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError) as err:
            print(f"[{now_iso()}] connection lost ({err}), retrying in 5s",
                  file=sys.stderr)
            time.sleep(5)


def sensor_key(data: dict) -> str | None:
    """A stable column name from an ESPHome state event."""
    ident = data.get("id")
    if not ident:
        return None
    # ids look like "sensor-vwc" or "binary_sensor-irrigating"
    return ident


def numeric_value(data: dict):
    """Prefer the raw numeric value, fall back to the formatted state."""
    if "value" in data and data["value"] not in (None, ""):
        return data["value"]
    return data.get("state")


def run_long(url: str, out_path: str) -> None:
    import os

    new_file = not os.path.exists(out_path) or os.path.getsize(out_path) == 0
    with open(out_path, "a", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        if new_file:
            writer.writerow(["timestamp", "sensor", "value", "state"])
            fh.flush()
        print(f"[{now_iso()}] logging (long) to {out_path}, Ctrl-C to stop")
        for event, data in iter_events(url):
            if event not in ("state", "message"):
                continue
            key = sensor_key(data)
            if key is None:
                continue
            writer.writerow([now_iso(), key, numeric_value(data), data.get("state")])
            fh.flush()


def run_wide(url: str, out_path: str, interval: float) -> None:
    import os
    import threading

    latest: dict[str, object] = {}
    lock = threading.Lock()

    def reader() -> None:
        for event, data in iter_events(url):
            if event not in ("state", "message"):
                continue
            key = sensor_key(data)
            if key is None:
                continue
            with lock:
                latest[key] = numeric_value(data)

    t = threading.Thread(target=reader, daemon=True)
    t.start()

    # Wait for the first sweep of sensors so the header is complete.
    print(f"[{now_iso()}] collecting sensors for {min(interval, 15):.0f}s...")
    time.sleep(min(interval, 15))

    with lock:
        columns = sorted(latest.keys())
    if not columns:
        print("No sensors seen yet. Is the host right and the device up?",
              file=sys.stderr)

    new_file = not os.path.exists(out_path) or os.path.getsize(out_path) == 0
    with open(out_path, "a", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        if new_file:
            writer.writerow(["timestamp"] + columns)
            fh.flush()
        print(f"[{now_iso()}] logging (wide) to {out_path} every {interval:.0f}s, "
              f"Ctrl-C to stop")
        while True:
            time.sleep(interval)
            with lock:
                row = [latest.get(c, "") for c in columns]
            writer.writerow([now_iso()] + row)
            fh.flush()


def main() -> int:
    args = parse_args()
    url = f"http://{args.host}:{args.port}/events"

    def handle_sigint(_sig, _frame):
        print(f"\n[{now_iso()}] stopped")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_sigint)

    if args.wide:
        run_wide(url, args.out, args.interval)
    else:
        run_long(url, args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
