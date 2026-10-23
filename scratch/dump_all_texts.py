import json

with open("scratch/extracted_papers_full.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for key in data.keys():
    with open(f"scratch/{key}_text.txt", "w", encoding="utf-8") as out:
        paper = data[key]
        out.write(f"=== FULL TEXT OF {key} (File: {paper['file']}) ===\n")
        out.write(f"Total Pages: {paper['num_pages']}\n\n")
        for p in paper['pages']:
            out.write(f"==================== PAGE {p['page']} ====================\n")
            out.write(p['text'] + "\n\n")

print("Dumped all 6 papers to separate text files.")
