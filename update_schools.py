"""
STEM Pathfinder — automatic school directory updater.

Downloads the current CDE public school directory, filters to active LAUSD
magnet schools, merges changes into the site's schools_data.js (preserving
existing scores and coordinates), and redeploys to Netlify when anything
actually changed.

Run manually:  python3 update_schools.py
Run by cron:   see update_schools.sh
"""
import csv
import json
import shutil
import subprocess
import sys
import time
from datetime import date
from pathlib import Path

BASE      = Path(__file__).parent
JS_FILE   = BASE / 'lausd_magnet_app' / 'web' / 'schools_data.js'
HTML_FILE = BASE / 'lausd_magnet_app' / 'web' / 'index.html'
# California open-data portal (CKAN) — CDE publishes a new dataset each school
# year (california-public-schools-YYYY-YY), so we discover the latest at runtime.
CKAN_SEARCH = 'https://data.ca.gov/api/3/action/package_search?q=california-public-schools&rows=20'
# Works on the Mac (homebrew path) and on GitHub Actions (netlify-cli on PATH,
# authenticated via the NETLIFY_AUTH_TOKEN environment variable).
NETLIFY   = shutil.which('netlify') or '/opt/homebrew/bin/netlify'
CURL      = shutil.which('curl') or '/usr/bin/curl'
SITE_ID   = '39838051-15f1-44e2-a688-9f6495977ca8'  # stempathfinder.netlify.app

def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)

def curl(url, timeout=120):
    result = subprocess.run(
        [CURL, '-s', '-L', '--max-time', str(timeout), url],
        capture_output=True, timeout=timeout + 30)
    if result.returncode != 0:
        raise RuntimeError(f'curl {url} failed with exit code {result.returncode}')
    return result.stdout

def find_latest_dataset_csv():
    """Ask the CKAN portal for the newest california-public-schools-YYYY-YY dataset."""
    data = json.loads(curl(CKAN_SEARCH))
    candidates = []
    for pkg in data.get('result', {}).get('results', []):
        name = pkg.get('name', '')
        if not name.startswith('california-public-schools-'):
            continue
        csv_urls = [r['url'] for r in pkg.get('resources', []) if r.get('format') == 'CSV']
        if csv_urls:
            candidates.append((name, csv_urls[0]))
    if not candidates:
        raise RuntimeError('No california-public-schools dataset with a CSV found on data.ca.gov')
    name, url = max(candidates)  # names sort by year: ...-2024-25 < ...-2025-26
    log(f'Latest dataset: {name}')
    return url

def fetch_cde_magnets():
    """Download the current school year's directory; return active LAUSD magnets."""
    log('Finding latest CDE dataset on data.ca.gov…')
    csv_url = find_latest_dataset_csv()
    log('Downloading school directory CSV…')
    text = curl(csv_url, timeout=180).decode('utf-8-sig', errors='replace')
    rows = list(csv.DictReader(text.splitlines()))
    magnets = [r for r in rows
               if r.get('Status') == 'Active'
               and 'Los Angeles Unified' in r.get('District Name', '')
               and r.get('Magnet', '').strip() == 'Y']
    log(f'CDE lists {len(magnets)} active LAUSD magnet schools')
    if len(magnets) < 100:
        # A collapsed count means CDE changed their format or the filter broke —
        # bail rather than gutting the live site's data.
        raise RuntimeError(f'Only {len(magnets)} magnets found; refusing to update (sanity check)')
    return magnets

def low_grade_of(grade):
    """'KG' -> 'K', '09' -> '9', '01' -> '1'."""
    g = (grade or '').strip().upper()
    if g.startswith('K'):
        return 'K'
    return g.lstrip('0') or 'K'

def to_school(r):
    s = {
        'name': r['School Name'].strip(),
        'low_grade': low_grade_of(r.get('Grade Low')),
        'magnet': True,
        'address': r.get('Street', '').strip(),
    }
    try:
        s['lat'] = round(float(r['Latitude']), 6)
        s['lng'] = round(float(r['Longitude']), 6)
    except (KeyError, ValueError, TypeError):
        pass
    return s

def load_existing():
    content = JS_FILE.read_text().strip()
    json_str = content[content.index('['):content.rindex(']') + 1]
    return json.loads(json_str)

def merge(existing, cde_schools):
    """CDE is the source of truth for the roster; existing data keeps its scores."""
    by_name = {s['name']: s for s in existing}
    merged, added = [], []
    for cde in cde_schools:
        old = by_name.get(cde['name'])
        if old:
            # Keep scores; refresh address/grades; prefer CDE coordinates.
            for k in ('quality', 'access', 'equity'):
                if k in old:
                    cde[k] = old[k]
            if 'lat' not in cde and 'lat' in old:
                cde['lat'], cde['lng'] = old['lat'], old['lng']
        else:
            added.append(cde['name'])
        merged.append(cde)
    removed = [n for n in by_name if n not in {c['name'] for c in cde_schools}]
    return merged, added, removed

def bump_cache_version():
    """Point index.html at the fresh data file so browsers don't serve stale JS."""
    stamp = date.today().strftime('%Y%m%d')
    html = HTML_FILE.read_text()
    import re
    html = re.sub(r'schools_data\.js\?v=[^"]*', f'schools_data.js?v={stamp}', html)
    HTML_FILE.write_text(html)

def deploy():
    log('Deploying to Netlify…')
    result = subprocess.run(
        [NETLIFY, 'deploy', '--dir', str(BASE / 'lausd_magnet_app' / 'web'),
         '--prod', '--site', SITE_ID],
        capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        raise RuntimeError(f'Netlify deploy failed:\n{result.stderr[-2000:]}')
    log('Deploy complete: https://stempathfinder.netlify.app')

def main():
    cde = fetch_cde_magnets()
    existing = load_existing()
    merged, added, removed = merge(existing, [to_school(r) for r in cde])

    if not added and not removed and merged == existing:
        log('No changes — site already up to date.')
        return

    for n in added:   log(f'  + added:   {n}')
    for n in removed: log(f'  - removed: {n}')
    if not added and not removed:
        log('School details changed (addresses/grades/coordinates)')

    JS_FILE.write_text('const SCHOOLS_DATA = ' + json.dumps(merged, separators=(',', ':')) + ';\n')
    bump_cache_version()
    log(f'schools_data.js updated: {len(merged)} schools '
        f'({len(added)} added, {len(removed)} removed)')
    deploy()

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        log(f'ERROR: {e}')
        sys.exit(1)
