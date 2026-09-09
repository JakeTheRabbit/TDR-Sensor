"""Validate all configurations without reading or overwriting deployment secrets."""
from pathlib import Path
import base64, shutil, subprocess, sys, tempfile

ROOT=Path(__file__).resolve().parents[1]
def main():
    with tempfile.TemporaryDirectory(prefix='tdr-configs-') as folder:
        dest=Path(folder)/'esphome'
        shutil.copytree(ROOT/'esphome',dest,ignore=shutil.ignore_patterns('.esphome','secrets.yaml'))
        key=base64.b64encode(bytes(32)).decode()
        (dest/'secrets.yaml').write_text(f'''wifi_ssid: validation-only
wifi_password: validation-only-password
mqtt_broker: 127.0.0.1
mqtt_username: validation-only
mqtt_password: validation-only-password
api_encryption_key: "{key}"
ota_password: validation-only-password
web_username: validation-only
web_password: validation-only-password
fallback_ap_password: validation-only-password
''')
        configs=sorted(dest.glob('tdr-sensor-*.yaml'))+sorted((dest/'factory').glob('*-factory.yaml'))
        private=dest/'validation-private.yaml'
        private.write_text('''packages:
  base: !include tdr-sensor-atom-lite.yaml
  mqtt: !include packages/tdr_mqtt.yaml
api:
  encryption:
    key: !secret api_encryption_key
ota:
  - platform: esphome
    password: !secret ota_password
web_server:
  auth:
    username: !secret web_username
    password: !secret web_password
wifi:
  ap:
    password: !secret fallback_ap_password
''')
        configs.append(private)
        for config in configs:
            result=subprocess.run([sys.executable,'-m','esphome','config',str(config)],capture_output=True,text=True,encoding='utf-8',errors='replace')
            if result.returncode:
                print(result.stdout);print(result.stderr);raise SystemExit(result.returncode)
            print(f'Validated {config.relative_to(dest)}',flush=True)
        print(f'{len(configs)} configurations validated; temporary dummy secrets removed.')
if __name__=='__main__':main()
