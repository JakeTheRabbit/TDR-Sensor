"""Repository contracts that protect calibration/automation meaning."""
from pathlib import Path
import re, unittest, yaml

ROOT=Path(__file__).resolve().parents[1]
class RepoTests(unittest.TestCase):
    def test_local_document_links(self):
        for path in [ROOT/'README.md',*(ROOT/'docs').glob('*.md')]:
            for link in re.findall(r'\]\(([^)]+)\)',path.read_text(encoding='utf-8')):
                link=link.split('#')[0]
                if not link or '://' in link or link.startswith('mailto:'):continue
                self.assertTrue((path.parent/link).exists(),f'{path.relative_to(ROOT)} -> {link}')
    def test_no_direct_valve_blueprint(self):
        doc=yaml.load((ROOT/'blueprints/automation/tdr_dryback_irrigation.yaml').read_text(),Loader=yaml.BaseLoader)
        self.assertEqual(doc['action'][0]['action'],'button.press')
        for input in ['enable_helper','vwc_ready','data_fresh','shot_button','max_age']:
            self.assertIn(input,doc['blueprint']['input'])
        self.assertEqual(doc['blueprint']['input']['shot_button']['selector']['entity']['filter']['domain'],'button')
        self.assertNotIn('default',doc['blueprint']['input']['dryback_threshold'])
    def test_core_contract(self):
        core=yaml.safe_load((ROOT/'esphome/packages/tdr_sdi12_core.yaml').read_text(encoding='utf-8'))
        self.assertEqual(core['substitutions']['sample_interval'],'30s')
        self.assertEqual(core['substitutions']['sample_timeout'],'90s')
        self.assertEqual(core['substitutions']['sample_timeout_ms'],'90000')
        for component in core['external_components']:
            self.assertRegex(component['source'],r'@[a-f0-9]{40}$')
        switches={s['id']:s for s in core['switch']}
        self.assertEqual(switches['enable_pwec']['restore_mode'],'ALWAYS_OFF')
        self.assertEqual(switches['calibration_mode']['restore_mode'],'ALWAYS_OFF')
        ids={s.get('id') for s in core['sensor']}
        self.assertTrue({'vwc','wet_index','vwc_poly','vwc_weighed'}.issubset(ids))
        self.assertNotIn('ec_mass_diag',ids)
        self.assertNotIn('sat_reference',{n['id'] for n in core['number']})
    def test_all_factory_boards_use_local_packages(self):
        configs=list((ROOT/'esphome/factory').glob('*-factory.yaml'))
        self.assertEqual(len(configs),5)
        for path in configs:
            data=yaml.load(path.read_text(),Loader=yaml.BaseLoader)
            self.assertEqual(data['substitutions']['sample_interval'],'30s')
            self.assertIn('core',data['packages']);self.assertIn('analytics',data['packages'])
    def test_offline_ui_assets(self):
        html=(ROOT/'tools/setup/index.html').read_text(encoding='utf-8')
        for path in re.findall(r'(?:src|href)="([^"]+)"',html):
            if path.startswith(('http','#')):continue
            self.assertTrue((ROOT/'tools/setup'/path.split('#')[0]).exists(),path)
        self.assertNotRegex(html,r'<script[^>]*src="https?://')
if __name__=='__main__':unittest.main()
