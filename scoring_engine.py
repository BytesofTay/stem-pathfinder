"""
LAUSD Magnet School Scoring Engine
FastAPI endpoint that scores schools on Quality, Access, and Equity via Claude API.
"""

import re
import json
import asyncio
from pathlib import Path
from typing import Optional

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="LAUSD Magnet School Scoring Engine")

client = anthropic.AsyncAnthropic()

SCHOOLS_FILE = Path(__file__).parent / "lausd_magnet_schools.json"

SCORE_PROMPT = """You are a school quality assessment expert. For each school provided, score it on three dimensions using the data available:

- **Quality**: measures program rigor and STEM focus based on magnet type and grade levels.
- **Access**: measures how many students can reach and enroll in the program based on location and grades served.
- **Equity**: measures diversity and support for underserved populations.

Score each dimension on a scale of 1 to 10. Base your reasoning on the school name, magnet designation, grade range, and any demographic context available.

School data:
- Name: {name}
- Starting Grade: {low_grade}
- Address: {address}
- Magnet: {magnet}

Return the result as a JSON object with school name, quality score, access score, and equity score. Respond with ONLY this JSON, no explanation:
{{"name": "{name}", "quality": <1-10>, "access": <1-10>, "equity": <1-10>}}"""


class School(BaseModel):
    name: str
    low_grade: str
    magnet: bool
    address: str


class ScoredSchool(BaseModel):
    name: str
    low_grade: str
    magnet: bool
    address: str
    quality: Optional[int] = None
    access: Optional[int] = None
    equity: Optional[int] = None
    error: Optional[str] = None


async def score_school(school: School) -> ScoredSchool:
    """Send one school to Claude and parse the three scores."""
    prompt = SCORE_PROMPT.format(
        name=school.name,
        low_grade=school.low_grade,
        address=school.address,
        magnet=school.magnet,
    )

    try:
        response = await client.messages.create(
            model="claude-opus-4-6",
            max_tokens=256,
            thinking={"type": "adaptive"},
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract the text block (thinking blocks may also be present)
        text = next(
            (block.text for block in response.content if block.type == "text"), ""
        )

        # Pull the JSON object out of the response (may span multiple lines)
        match = re.search(r'\{.*?\}', text, re.DOTALL)
        if not match:
            raise ValueError(f"No JSON found in response: {text!r}")

        scores = json.loads(match.group())
        return ScoredSchool(
            **school.model_dump(),
            quality=int(scores["quality"]),
            access=int(scores["access"]),
            equity=int(scores["equity"]),
        )

    except Exception as exc:
        return ScoredSchool(**school.model_dump(), error=str(exc))


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/score", response_model=list[ScoredSchool])
async def score_schools(schools: list[School]):
    """
    Accept a list of school objects and return each one with Quality,
    Access, and Equity scores (1-10) added.

    Calls Claude in parallel with a concurrency cap to avoid rate limits.
    """
    semaphore = asyncio.Semaphore(5)  # max 5 concurrent Claude calls

    async def bounded(school: School) -> ScoredSchool:
        async with semaphore:
            return await score_school(school)

    results = await asyncio.gather(*[bounded(s) for s in schools])
    return list(results)


@app.post("/score/file", response_model=list[ScoredSchool])
async def score_from_file():
    """
    Score all schools from the bundled lausd_magnet_schools.json file.
    Convenience endpoint — no request body needed.
    """
    if not SCHOOLS_FILE.exists():
        raise HTTPException(status_code=404, detail="lausd_magnet_schools.json not found")

    with open(SCHOOLS_FILE) as f:
        raw = json.load(f)

    schools = [School(**s) for s in raw]

    semaphore = asyncio.Semaphore(5)

    async def bounded(school: School) -> ScoredSchool:
        async with semaphore:
            return await score_school(school)

    results = await asyncio.gather(*[bounded(s) for s in schools])
    return list(results)


@app.get("/schools")
async def get_schools():
    """Return the school list from lausd_magnet_schools.json as-is."""
    if not SCHOOLS_FILE.exists():
        raise HTTPException(status_code=404, detail="lausd_magnet_schools.json not found")
    with open(SCHOOLS_FILE) as f:
        return json.load(f)


@app.get("/health")
async def health():
    return {"status": "ok", "schools_file": SCHOOLS_FILE.exists()}


# ---------------------------------------------------------------------------
# Dev runner
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("scoring_engine:app", host="0.0.0.0", port=8000, reload=True)
