"""Offline safety tests: no network, Bun, Termux or Android needed."""
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('phone.sh')
SCRIPT_TEXT = SCRIPT.read_text()
PATCH_CODE = re.search(r'python3 - "\$WORK" <<\x27PY\x27\n(.*?)\nPY', SCRIPT_TEXT, re.S)
assert PATCH_CODE, 'missing embedded loopback patch script'

ORIGINALS = {
    'server/engine/src/web/WebTransportServer.ts': "hostname: options.hostname ?? '0.0.0.0', port: options.port,",
    'server/engine/src/server/tcp/TcpServer.ts': "this.tcp.listen(Environment.node.port, '0.0.0.0', () => {});",
    'server/engine/src/setup.ts': "server.listen(Environment.web.managementPort, '0.0.0.0', () => resolve());",
    'server/engine/src/web/index.ts': "hostname: offThread ? '127.0.0.1' : '0.0.0.0',",
    'server/engine/src/web/hiscoresServer.ts': 'port: Environment.HISCORES_WEB_PORT,',
}

class SafetyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        for rel, snippet in ORIGINALS.items():
            file = self.root / rel
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text('original-start\n' + snippet + '\noriginal-end\n')

    def tearDown(self):
        self.tmp.cleanup()

    def patch(self):
        return subprocess.run([sys.executable, '-c', PATCH_CODE.group(1), str(self.root)],
                              text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def test_patches_only_isolated_listeners_and_are_idempotent(self):
        first = self.patch()
        self.assertEqual(first.returncode, 0, first.stdout + first.stderr)
        originals = {}
        for rel, before in ORIGINALS.items():
            file = self.root / rel
            after = file.read_text()
            if rel.endswith('hiscoresServer.ts'):
                self.assertIn("port: Environment.HISCORES_WEB_PORT, hostname: '127.0.0.1'", after)
            else:
                self.assertNotIn(before, after)
            self.assertIn('127.0.0.1', after)
            self.assertIn('original-start\n', after)
            originals[rel] = after
        second = self.patch()
        self.assertEqual(second.returncode, 0, second.stdout + second.stderr)
        for rel, after in originals.items():
            self.assertEqual((self.root / rel).read_text(), after)

    def test_drift_blocks_without_partial_writes(self):
        rel = 'server/engine/src/web/hiscoresServer.ts'
        (self.root / rel).write_text('upstream-changed')
        result = self.patch()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('BLOCKED', result.stderr)
        self.assertIn(ORIGINALS['server/engine/src/web/WebTransportServer.ts'],
                      (self.root / 'server/engine/src/web/WebTransportServer.ts').read_text())

    def test_symlink_is_rejected(self):
        rel = 'server/engine/src/web/hiscoresServer.ts'
        file = self.root / rel
        file.unlink()
        elsewhere = self.root / 'other-file'
        elsewhere.write_text(ORIGINALS[rel])
        file.symlink_to(elsewhere)
        result = self.patch()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(elsewhere.read_text(), ORIGINALS[rel])

    def test_shell_syntax_and_production_protection(self):
        result = subprocess.run(['bash', '-n', str(SCRIPT)])
        self.assertEqual(result.returncode, 0)
        for name in ['lc274', 'dev274', 'js377']:
            self.assertIn('$HOME/' + name, SCRIPT_TEXT)
        for forbidden in ['pkill', 'killall', 'git clean', 'git reset', 'sqlite:reset', 'rm -rf']:
            self.assertNotIn(forbidden, SCRIPT_TEXT)

if __name__ == '__main__':
    unittest.main()
