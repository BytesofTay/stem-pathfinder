import json

input_path = "/Users/hi/Downloads/CDESchoolDirectoryExport.txt"
output_path = "/Users/hi/LAUSD MAGNET DATA/lausd_magnet_schools.json"

schools = []

with open(input_path, encoding="utf-8") as f:
    lines = f.readlines()

# Skip header row (index 0)
for line in lines[1:]:
    line = line.rstrip("\n")
    if not line.strip():
        continue
    cols = line.split("\t")
    if len(cols) < 8:
        continue
    name = cols[2].strip()
    low_grade = cols[4].strip()
    magnet = cols[5].strip().upper() == "Y"
    address = cols[7].strip()
    schools.append({
        "name": name,
        "low_grade": low_grade,
        "magnet": magnet,
        "address": address,
    })

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(schools, f, indent=2, ensure_ascii=False)

print(f"Written {len(schools)} schools to {output_path}")
