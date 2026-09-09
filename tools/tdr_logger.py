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
    p.add_argument("--max-age", type=float, default=120.0,
                   help="Blank wide readings older than this many seconds (default 120)")
    args = p.parse_args()
    if not __import__('math').isfinite(args.interval) or args.interval <= 0:
        p.error("--interval must be a finite positive number")
    if not __import__('math').isfinite(args.max_age) or args.max_age <= 0:
        p.error("--max-age must be a finite positive number")
    return args


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def iter_events(url: str, on_disconnect=None):
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
            # A clean EOF is still a disconnected stream.
            if on_disconnect:
                on_disconnect()
            time.sleep(5)
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError) as err:
            if on_disconnect:
                on_disconnect()
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


class ReadingBuffer:
    """Values retain observation times; a broken stream cannot look live."""
    def __init__(self):
        self.latest = {}
        self.online = False

    def update(self, key, value, received):
        self.latest[key] = (value, received)
        self.online = True

    def disconnect(self):
        self.online = False

    def snapshot(self, columns, now, max_age):
        row = []
        for key in columns:
            value, received = self.latest.get(key, ("", None))
            age = None if received is None else max(0.0, now - received)
            valid = self.online and age is not None and age <= max_age
            row.extend([value if valid else "", round(age, 1) if age is not None else ""])
        return row


def wide_header(columns):
    return ["timestamp", "stream_connected"] + [item for c in columns for item in (c, c + "__age_s")]


def validate_append_header(path, header):
    """Do not append a different column order/meaning to an existing CSV."""
    import os
    if os.path.exists(path) and os.path.getsize(path):
        with open(path, newline="", encoding="utf-8") as fh:
            if next(csv.reader(fh), None) != header:
                raise ValueError("Existing CSV header differs. Choose a new --out file.")


def run_wide(url: str, out_path: str, interval: float, max_age: float = 120.0) -> None:
    import os
    import threading

    readings = ReadingBuffer()
    lock = threading.Lock()

    def disconnected():
        with lock:
            readings.disconnect()

    def reader() -> None:
        for event, data in iter_events(url, on_disconnect=disconnected):
            if event not in ("state", "message"):
                continue
            key = sensor_key(data)
            if key is not None:
                with lock:
                    readings.update(key, numeric_value(data), time.monotonic())

    threading.Thread(target=reader, daemon=True).start()
    print(f"[{now_iso()}] collecting sensors for {min(interval, 15):.0f}s...")
    time.sleep(min(interval, 15))
    with lock:
        columns = sorted(readings.latest)
    if not columns:
        raise RuntimeError("No sensor events received. Check the host/connection and retry; no CSV was created.")
    header = wide_header(columns)
    validate_append_header(out_path, header)
    new_file = not os.path.exists(out_path) or os.path.getsize(out_path) == 0
    reported_new = set()
    with open(out_path, "a", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        if new_file:
            writer.writerow(header)
            fh.flush()
        print(f"[{now_iso()}] logging (wide) to {out_path}; readings older than {max_age:g}s are blank")
        while True:
            time.sleep(interval)
            with lock:
                new_columns = set(readings.latest) - set(columns) - reported_new
                connected = readings.online
                row = readings.snapshot(columns, time.monotonic(), max_age)
            if new_columns:
                print("New entities are outside the fixed CSV header: " + ", ".join(sorted(new_columns)) +
                      ". Restart with a new file or use long format to include them.", file=sys.stderr)
                reported_new.update(new_columns)
            writer.writerow([now_iso(), int(connected)] + row)
            fh.flush()


def main() -> int:
    args = parse_args()
    url = f"http://{args.host}:{args.port}/events"

    def handle_sigint(_sig, _frame):
        print(f"\n[{now_iso()}] stopped")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_sigint)

    if args.wide:
        run_wide(url, args.out, args.interval, args.max_age)
    else:
        run_long(url, args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
