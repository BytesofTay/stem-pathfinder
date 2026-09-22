import unittest
from scoring_engine import app

class ScoringEngineSmokeTest(unittest.TestCase):
    def test_app_is_created(self):
        self.assertIsNotNone(app)

if __name__ == '__main__':
    unittest.main()
