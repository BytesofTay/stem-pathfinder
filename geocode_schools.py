"""
Geocode all LAUSD magnet schools and add lat/lng to schools_data.js
Uses the US Census Bureau Geocoder (free, no API key, no rate limits)
"""
import json, re, urllib.request, urllib.parse, time, sys

JS_FILE = '/Users/hi/LAUSD MAGNET DATA/lausd_magnet_app/web/schools_data.js'

with open(JS_FILE, 'r') as f:
    content = f.read()

json_str = content.strip()
json_str = json_str[json_str.index('['):json_str.rindex(']') + 1]
schools = json.loads(json_str)

def geocode_census(address):
    """Try Census Bureau geocoder first."""
    full = address + ', Los Angeles, CA'
    url = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?' + \
          urllib.parse.urlencode({'address': full, 'benchmark': '2020', 'format': 'json'})
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'LAUSD-Magnet-Finder/1.0'})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read())
            matches = data.get('result', {}).get('addressMatches', [])
            if matches:
                coords = matches[0]['coordinates']
                return float(coords['y']), float(coords['x'])
    except Exception as e:
        pass
    return None, None

def geocode_nominatim(address):
    """Fallback: Nominatim (OpenStreetMap)."""
    full = address + ', Los Angeles, CA'
    url = 'https://nominatim.openstreetmap.org/search?' + \
          urllib.parse.urlencode({'q': full, 'format': 'json', 'limit': 1, 'countrycodes': 'us'})
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'LAUSD-Magnet-Finder/1.0'})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = json.loads(r.read())
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        pass
    return None, None

total = len(schools)
geocoded = sum(1 for s in schools if s.get('lat'))
print(f"Starting: {geocoded}/{total} already geocoded", flush=True)

for i, school in enumerate(schools):
    if school.get('lat') and school.get('lng'):
        continue

    lat, lng = geocode_census(school['address'])
    if lat is None:
        time.sleep(1.1)  # Nominatim requires 1 req/sec
        lat, lng = geocode_nominatim(school['address'])

    school['lat'] = round(lat, 6) if lat else None
    school['lng'] = round(lng, 6) if lng else None
    status = f"{lat:.4f}, {lng:.4f}" if lat else "FAILED"
    print(f"[{i+1}/{total}] {school['name'][:45]:<45} {status}", flush=True)
    time.sleep(0.3)  # Small delay to be polite

# Write updated file
with open(JS_FILE, 'w') as f:
    f.write('const SCHOOLS_DATA = ')
    f.write(json.dumps(schools, separators=(',', ':')))
    f.write(';\n')

ok = sum(1 for s in schools if s.get('lat'))
print(f"\nDone! {ok}/{total} schools geocoded.", flush=True)
