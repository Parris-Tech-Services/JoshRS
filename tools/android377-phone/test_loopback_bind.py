#!/usr/bin/env python3
"""Offline regression tests for pinned 377 loopback listener guard."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("loopback_bind.py")
spec = importlib.util.spec_from_file_location("phone377_loopback", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class TestLoopback377(unittest.TestCase):
    def build_tree(self, path: Path):
        for rel, old, _, count in module.RULES:
            p = path / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text("prefix\n" + (old + "\n") * count + "suffix\n")

    def test_all_six_listener_bindings_are_patched(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            self.build_tree(root)
            module.apply(root)
            module.apply(root, verify=True)
            for rel, old, new, count in module.RULES:
                contents = (root / rel).read_text()
                self.assertEqual(contents.count(old), 0)
                self.assertEqual(contents.count(new), count)

    def test_drift_fails_before_any_file_is_written(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            self.build_tree(root)
            problem = root / module.RULES[-1][0]
            problem.write_text("changed upstream")
            untouched = (root / module.RULES[0][0]).read_text()
            with self.assertRaises(ValueError):
                module.apply(root)
            self.assertEqual((root / module.RULES[0][0]).read_text(), untouched)

    def test_does_not_patch_twice(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            self.build_tree(root)
            module.apply(root)
            with self.assertRaises(ValueError):
                module.apply(root)


if __name__ == "__main__":
    unittest.main()
