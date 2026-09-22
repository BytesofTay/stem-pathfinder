import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from scoring_engine import School, score_school

class ScoringTests(unittest.IsolatedAsyncioTestCase):
    async def score(self, text):
        fake = SimpleNamespace(messages=SimpleNamespace(create=AsyncMock(return_value=SimpleNamespace(content=[SimpleNamespace(type='text', text=text)]))))
        with patch('scoring_engine.get_client', return_value=fake):
            return await score_school(School(name='Test School',low_grade='6',magnet=True,address='Test Address'))

    async def test_valid_scores_preserve_school(self):
        result = await self.score('{"quality":8,"access":6,"equity":7}')
        self.assertEqual((result.name,result.quality), ('Test School',8))
        self.assertIsNone(result.error)

    async def test_out_of_range_scores_are_rejected(self):
        result = await self.score('{"quality":99,"access":6,"equity":7}')
        self.assertIsNotNone(result.error)
        self.assertIsNone(result.quality)

    async def test_invalid_response_is_recoverable(self):
        result = await self.score('No data available')
        self.assertIsNotNone(result.error)
        self.assertEqual(result.name,'Test School')
