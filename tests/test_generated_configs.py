"""Validate actual browser-generated YAML against ESPHome; optionally compile one export.

Uses only temporary artificial credentials and the generator's pinned remote packages.
No installed node or deployment secrets are accessed. ESPHome 2026.8.2 is required.
"""
from pathlib import Path
import argparse
import base64
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def run(command, label, cwd):
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if result.returncode:
        print(result.stdout)
        print(result.stderr)
        raise SystemExit(result.returncode)
    print(label, flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--node', default='node')
    parser.add_argument('--compile', action='store_true', help='Also build the Atom Lite export with weighed-reference import.')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='tdr-export-') as folder:
        dest = Path(folder)
        run([args.node, str(ROOT/'tests/export_fixtures.js'), str(dest)], 'Generated 15 export variants.', ROOT)
        key = base64.b64encode(bytes(32)).decode()
        (dest/'secrets.yaml').write_text(f'''wifi_ssid: validation-only
wifi_password: validation-only-password
api_encryption_key: "{key}"
ota_password: validation-only-password
web_username: validation-only
web_password: validation-only-password
fallback_ap_password: validation-only-password
''', encoding='utf-8')
        for config in sorted(dest.glob('*.yaml')):
            if config.name == 'secrets.yaml':
                continue
            run([sys.executable, '-m', 'esphome', 'config', str(config)], 'Validated '+config.name, dest)
        if args.compile:
            run([sys.executable, '-m', 'esphome', 'compile', str(dest/'atom-lite-weighed.yaml')], 'Compiled Atom Lite with the generated import button.', dest)
        print('All generated configurations passed; temporary credentials removed on exit.')


if __name__ == '__main__':
    main()
