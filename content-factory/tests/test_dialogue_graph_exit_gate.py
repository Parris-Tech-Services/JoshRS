"""Synthetic original-dialogue proposal checks; no RuneScape dialogue or saves."""
import copy
import importlib.util
from pathlib import Path
import unittest

MODULE = Path(__file__).resolve().parents[1] / "harvest_match.py"
spec = importlib.util.spec_from_file_location("harvest_match", MODULE)
harvest_match = importlib.util.module_from_spec(spec)
spec.loader.exec_module(harvest_match)


def node(key, text, nexts=None, exit=False):
    return {"id": key, "text": text, "next": list(nexts or []), "exit": exit}


def proposal(nodes):
    return {
        "schema": "joshrs-377-original-dialogue-v1",
        "entries": [{
            "key": "original_guide", "origin": "original_user_authored",
            "status": "research_proposal_not_installable", "id377": None,
            "nodes": nodes,
        }],
    }


class DialogueGraphExitGate(unittest.TestCase):
    def assert_problem(self, nodes, fragment):
        errors = harvest_match.dialogue_health(proposal(nodes))
        self.assertTrue(any(fragment in e for e in errors), errors)

    def test_simple_original_dialogue_can_exit(self):
        self.assertEqual([], harvest_match.dialogue_health(proposal([
            node("start", "Welcome to the crossroads.", ["answer"]),
            node("answer", "Take the east road.", exit=True),
        ])))

    def test_player_can_choose_to_exit_optional_loop(self):
        self.assertEqual([], harvest_match.dialogue_health(proposal([
            node("start", "Do you need directions?", ["repeat", "finish"]),
            node("repeat", "I can explain again.", ["repeat", "finish"]),
            node("finish", "Safe travels.", exit=True),
        ])))

    def test_closed_self_loop_cannot_trap_player(self):
        self.assert_problem([
            node("start", "Do you need directions?", ["trap", "finish"]),
            node("trap", "Try again.", ["trap"]),
            node("finish", "Safe travels.", exit=True),
        ], "reachable branch cannot reach an exit")

    def test_closed_two_node_cycle_cannot_trap_player(self):
        self.assert_problem([
            node("start", "Do you need directions?", ["one", "finish"]),
            node("one", "First direction.", ["two"]),
            node("two", "Second direction.", ["one"]),
            node("finish", "Safe travels.", exit=True),
        ], "reachable branch cannot reach an exit")

    def test_unreachable_exit_does_not_make_trap_valid(self):
        self.assert_problem([
            node("start", "No route out.", ["start"]),
            node("finish", "Safe travels.", exit=True),
        ], "reachable branch cannot reach an exit")

    def test_non_string_node_id_fails_closed(self):
        self.assert_problem([
            {"id": ["start"], "text": "Bad identifier.", "next": []},
            node("finish", "Safe travels.", exit=True),
        ], "invalid dialogue node id")

    def test_non_string_next_target_fails_closed(self):
        self.assert_problem([
            node("start", "Pick an option.", [["bad"], "finish"]),
            node("finish", "Safe travels.", exit=True),
        ], "dangling or invalid branch")

    def test_dangling_target_fails_closed(self):
        self.assert_problem([
            node("start", "Pick an option.", ["missing", "finish"]),
            node("finish", "Safe travels.", exit=True),
        ], "dangling or invalid branch")

    def test_exit_node_cannot_continue(self):
        self.assert_problem([
            node("start", "Pick an option.", ["finish"]),
            node("finish", "Safe travels.", ["start"], exit=True),
        ], "exit node cannot have outgoing branches")

    def test_carriage_return_is_rejected(self):
        self.assert_problem([
            node("start", "First\\rSecond.", ["finish"]),
            node("finish", "Safe travels.", exit=True),
        ], "unsafe/empty dialogue")

    def test_repeated_universal_greeting_is_rejected(self):
        self.assert_problem([
            node("start", "Hello adventurer", ["finish"]),
            node("finish", "Safe travels.", exit=True),
        ], "universal greeting refused")

    def test_duplicate_node_ids_are_rejected(self):
        self.assert_problem([
            node("start", "A first line.", ["finish"]),
            node("finish", "Safe travels.", exit=True),
            node("finish", "Other ending.", exit=True),
        ], "duplicate dialogue node id")

    def test_no_gameplay_or_install_claims_are_inferred(self):
        doc = proposal([node("start", "Take care.", exit=True)])
        self.assertEqual([], harvest_match.dialogue_health(copy.deepcopy(doc)))
        self.assertIsNone(doc["entries"][0]["id377"])
        self.assertEqual("research_proposal_not_installable", doc["entries"][0]["status"])


if __name__ == "__main__":
    unittest.main()
