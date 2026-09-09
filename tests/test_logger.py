import importlib.util, tempfile, unittest, csv
from pathlib import Path
spec=importlib.util.spec_from_file_location('tdr_logger',Path(__file__).resolve().parents[1]/'tools/tdr_logger.py')
logger=importlib.util.module_from_spec(spec);spec.loader.exec_module(logger)

class LoggerTests(unittest.TestCase):
    def test_stale_and_disconnected_values_are_blank(self):
        b=logger.ReadingBuffer();b.update('vwc',65,100)
        self.assertEqual(b.snapshot(['vwc'],110,120),[65,10])
        self.assertEqual(b.snapshot(['vwc'],221,120),['',121])
        b.disconnect();self.assertEqual(b.snapshot(['vwc'],110,120),['',10])
    def test_reconnect_does_not_refresh_unseen_fields(self):
        b=logger.ReadingBuffer();b.update('vwc',65,100);b.update('ec',1.3,100);b.disconnect()
        b.update('vwc',64,300)
        self.assertEqual(b.snapshot(['vwc','ec'],300,120),[64,0,'',200])
    def test_identical_new_value_refreshes_age(self):
        b=logger.ReadingBuffer();b.update('vwc',65,100);b.update('vwc',65,300)
        self.assertEqual(b.snapshot(['vwc','missing'],301,120),[65,1,'',''])
    def test_mismatched_append_refused(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'test.csv';p.write_text('timestamp,vwc\n')
            with self.assertRaises(ValueError):logger.validate_append_header(p,logger.wide_header(['vwc']))
            with p.open('w',newline='') as f:csv.writer(f).writerow(logger.wide_header(['vwc']))
            logger.validate_append_header(p,logger.wide_header(['vwc']))
    def test_numeric_zero_not_lost(self):
        self.assertEqual(logger.numeric_value({'value':0,'state':'0.00'}),0)
if __name__=='__main__':unittest.main()
