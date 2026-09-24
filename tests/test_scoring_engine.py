import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from scoring_engine import School, ScoredSchool, health, score_school, score_schools

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

    async def test_batch_keeps_input_order_and_isolates_failures(self):
        schools = [
            School(name='First', low_grade='K', magnet=True, address='One'),
            School(name='Second', low_grade='6', magnet=True, address='Two'),
        ]

        async def fake_score(school):
            if school.name == 'First':
                return ScoredSchool(**school.model_dump(), quality=8, access=7, equity=6)
            return ScoredSchool(**school.model_dump(), error='Provider unavailable')

        with patch('scoring_engine.score_school', side_effect=fake_score):
            results = await score_schools(schools)

        self.assertEqual([result.name for result in results], ['First', 'Second'])
        self.assertEqual(results[0].quality, 8)
        self.assertEqual(results[1].error, 'Provider unavailable')
        self.assertIsNone(results[1].quality)

    async def test_empty_batch_and_health_do_not_initialize_provider(self):
        with patch('scoring_engine.get_client') as provider:
            self.assertEqual(await score_schools([]), [])
            self.assertEqual((await health())['status'], 'ok')
            provider.assert_not_called()
