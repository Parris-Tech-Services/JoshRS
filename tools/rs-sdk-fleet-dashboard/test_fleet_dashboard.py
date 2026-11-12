import importlib.util
import json
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import urlopen

spec = importlib.util.spec_from_file_location("fleet_dashboard", Path(__file__).with_name("fleet_dashboard.py"))
fleet = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fleet)

class DashboardTest(unittest.TestCase):
    def test_roster_excludes_secrets_and_rejects_invalid_names(self):
        raw = {"bots": {"demo": {"status": "active", "tick": 12, "password": "fixture-only"}, "../bad": {}},
               "sdks": {"one": {"mode": "control", "targetUsername": "demo", "token": "fixture-only"}}}
        with patch.object(fleet, "read_assignments", return_value={}):
            result = fleet.roster(raw)
        self.assertEqual(result["summary"]["registered"], 1)
        self.assertEqual(result["summary"]["sdkControllers"], 1)
        self.assertNotIn("fixture-only", json.dumps(result))

    def test_endpoint_guard_runs_before_network(self):
        with patch.object(fleet, "urlopen") as request:
            for path in ("/admin", "/status/demo?token=value", "http://example.invalid", "/state/../secret"):
                with self.assertRaises(ValueError):
                    fleet.fetch_json(path)
            request.assert_not_called()

    def test_http_routes_without_live_gateway(self):
        server = fleet.ThreadingHTTPServer(("127.0.0.1", 0), fleet.Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = "http://127.0.0.1:%d" % server.server_port
        try:
            with urlopen(base) as response:
                self.assertEqual(response.status, 200)
                self.assertEqual(response.headers["Cache-Control"], "no-store")
            with self.assertRaises(HTTPError) as invalid:
                urlopen(base + "/api/bot?name=../bad")
            self.assertEqual(invalid.exception.code, 400)
            invalid.exception.close()
            with self.assertRaises(HTTPError) as missing:
                urlopen(base + "/unknown")
            self.assertEqual(missing.exception.code, 404)
            missing.exception.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

if __name__ == "__main__":
    unittest.main()
