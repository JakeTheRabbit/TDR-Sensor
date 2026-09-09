"""Compile and execute the actual firmware lambdas on the host.

No copied calibration/analytics implementation: YAML is the source under test.
Usage: python tests/test_firmware.py [--cxx /path/to/zig.exe]
Requires PyYAML and a C++17 compiler (g++ or clang++; zig c++ on Windows).
"""
from pathlib import Path
import argparse, re, subprocess, tempfile, yaml

ROOT=Path(__file__).resolve().parents[1]
def script(doc, name):
    return next(x for x in doc['script'] if x['id']==name)['then'][-1]['lambda']

def source():
    core=yaml.safe_load((ROOT/'esphome/packages/tdr_sdi12_core.yaml').read_text(encoding='utf-8'))
    analytics=yaml.safe_load((ROOT/'esphome/packages/tdr_analytics.yaml').read_text(encoding='utf-8'))
    body=script(core,'publish_readings')
    math=body.split('// BEGIN TESTABLE MATH\n')[1].split('// END TESTABLE MATH')[0]
    process=script(analytics,'tdr_process')
    raw=core['sensor'][0]['sensors'][0]['on_value'][0]['lambda'].replace('${sample_timeout_ms}','90000')
    publish=body.replace('${sample_timeout_ms}','90000')
    capture=next(x for x in core['script'] if x['id']=='capture_reference')['then'][0]['lambda'].replace('${sample_timeout_ms}','90000')
    declarations=[]
    for n in core['number']:
        declarations.append(f"Sensor {n['id']}{{{float(n['initial_value'])}f}};")
    for n in core['sensor'][1:]:
        if n.get('id') and n['id']!='vwc': declarations.append(f"Sensor {n['id']};")
    declarations.extend(['Sensor raw_counts, bulk_ec_25;', 'Binary calibration_mode, enable_pwec, sensor_fresh, capture_ready;', 'Text substrate_profile, calibration_status, last_action;'])
    for g in analytics['globals']+core['globals']:
        declarations.append(f"{g['type']} {g['id']} = {g['initial_value']};")
    return r'''
#include <algorithm>
#include <array>
#include <cassert>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <limits>
#include <vector>
using std::isnan;
#define id(x) x
uint32_t now_ms=0;
uint32_t millis(){return now_ms;}
struct Sensor {float state=NAN;void publish_state(float s){state=s;}
  struct Call{Sensor* sensor;float value=0;Call& set_value(float v){value=v;return *this;}void perform(){sensor->state=value;}};
  Call make_call(){return {this};}
};
struct Text {std::string state="Rockwool cube on slab";void publish_state(const char* v){state=v;} std::string current_option(){return state;}};
struct Binary {bool state=false;void publish_state(bool s){state=s;}};
struct Time {struct Stamp {bool is_valid(){return true;}}; Stamp now(){return {};}};
Sensor vwc, rise_threshold{1.5f}, fall_confirm{.8f}, peak_confirm_min{10}, irr_window_min{20};
Binary vwc_ready;
Time tdr_time;
'''+'\n'.join(declarations)+'\nvoid publish(){\n'+publish+'\n}\nvoid capture(int kind){\n'+capture+'\n}\nvoid process(){\n'+process+'\n}\nvoid receive(float x){\n'+raw+'\n}\nint main(){\n'+math+r'''
auto near=[](double a,double b){assert(std::abs(a-b)<1e-6);};
assert(std::isnan(generic(NAN,false))); assert(std::isnan(generic(4096,false)));
near(fit(2800,2800,40,3200,80,false),40);
near(fit(3200,2800,40,3200,80,false),80);
near(fit(3000,2800,40,3200,80,false),fit(3000,3200,80,2800,40,false));
assert(std::isnan(fit(2700,2800,40,3200,80,false)));
assert(std::isnan(fit(3250,2800,40,3200,80,false)));
assert(std::isnan(fit(3000,2800,80,3200,40,false)));
assert(std::isnan(fit(2820,2800,40,2850,80,false)));
assert(std::isnan(fit(3000,2800,40,3200,45,false)));
assert(std::isnan(fit(3000,2800,0,3200,80,false)));
assert(std::isnan(fit(3000,NAN,40,3200,80,false)));
const auto middle=fit(3000,2800,40,3200,80,false);
near(check(2800,40,3200,80,3000,middle,3,false),0);
near(check(2800,40,3200,80,3000,middle+5,3,false),-5);
assert(std::isnan(check(2800,40,3200,80,2800,40,3,false)));
assert(std::isnan(check(2800,40,3200,80,2839,45,3,false)));
assert(std::isnan(check(2800,40,3200,80,3000,middle,0,false)));
near(fit(3000,2800,40,3200,80,true),60);
// Identical but freshly delivered RAW samples remain live and accumulate.
for(int i=0;i<10;i++){now_ms+=30000;receive(3000);}
assert(raw_seen && raw_count==10 && raw_window[0]==3000);
now_ms+=100000; receive(3000); assert(raw_count==1);
receive(NAN);assert(!raw_seen && raw_count==0);
now_ms=std::numeric_limits<uint32_t>::max()-10000;receive(3000);
now_ms=20000;receive(3000);assert(raw_count==2); // unsigned rollover
// Full publication rejects uncalibrated RAW despite a plausible generic result.
now_ms=1000;raw_counts.state=3000;receive(3000);publish();assert(!vwc_ready.state && std::isnan(vwc.state));
// Capture requires an enabled calibration mode, a full fresh window, stability and a weighed input.
weighed_input.state=40;capture(1);assert(std::isnan(a_raw));
calibration_mode.state=true;capture(1);assert(std::isnan(a_raw));
for(int i=0;i<10;i++){now_ms+=30000;raw_counts.state=2800;receive(2800);}capture(1);near(a_raw,2800);near(a_vwc,40);near(weighed_input.state,0);
weighed_input.state=80;for(int i=0;i<10;i++){now_ms+=30000;raw_counts.state=3200;receive(3200);}capture(2);near(b_raw,3200);
publish();assert(std::isnan(vwc.state));
weighed_input.state=middle;for(int i=0;i<10;i++){now_ms+=30000;raw_counts.state=3000;receive(3000);}capture(3);publish();assert(std::isnan(vwc.state));
calibration_mode.state=false;publish();assert(vwc_ready.state);near(vwc.state,middle);assert(std::isnan(pwec.state));
now_ms+=90001;publish();assert(!vwc_ready.state && !sensor_fresh.state && std::isnan(vwc.state));
now_ms+=30000;raw_counts.state=3300;receive(3300);publish();assert(std::isnan(vwc.state));
// Recapturing an endpoint invalidates the independent check.
calibration_mode.state=true;weighed_input.state=40;
for(int i=0;i<10;i++){now_ms+=30000;raw_counts.state=2800;receive(2800);}capture(1);assert(std::isnan(c_raw));
// Discard the calibration-session revision before the independent analytics tests.
g_analytics_revision=cal_revision;
// Startup has no fabricated irrigation peak.
now_ms=1000;vwc_ready.state=true;vwc.state=50;process();assert(std::isnan(g_peak));
// Rising VWC starts wetting, an exactly flat plateau completes it.
now_ms+=30000;vwc.state=52;process();assert(g_phase==1 && g_shots_today==1);
for(int i=0;i<21;i++){now_ms+=30000;process();}
assert(g_phase==0);near(g_peak,52);near(g_last_shot,2);
vwc.state=49;now_ms+=30000;process();near(g_max_dryback_today,3);
// Calibration scale changes and outages cannot be mistaken for wetting events.
cal_revision++;vwc.state=90;process();assert(std::isnan(g_peak) && g_shots_today==0);
vwc_ready.state=false;process();assert(g_phase==0 && std::isnan(g_trough));
// Wetting timer also survives the millisecond counter wrap.
vwc_ready.state=true;now_ms=std::numeric_limits<uint32_t>::max()-40000;
vwc.state=50;process();now_ms+=30000;vwc.state=53;process();assert(g_phase==1);
now_ms+=660000;process();assert(g_phase==0);near(g_peak,53);
std::cout << "Firmware calibration, RAW freshness, plateau, reset and rollover assertions passed.\n";
}
'''

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--cxx',default='g++');args=parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='tdr-tests-') as temp:
        cpp=Path(temp)/'firmware_test.cpp';out=Path(temp)/('firmware_test.exe' if __import__('os').name=='nt' else 'firmware_test')
        cpp.write_text(source(),encoding='utf-8')
        compiler=[args.cxx]+(['c++'] if Path(args.cxx).stem=='zig' else [])
        subprocess.run(compiler+['-std=c++17','-O0','-Wall','-Wextra',str(cpp),'-o',str(out)],check=True)
        subprocess.run([str(out)],check=True)
if __name__=='__main__':main()
