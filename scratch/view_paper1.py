import json

with open("scratch/extracted_papers_full.json", "r", encoding="utf-8") as f:
    data = json.load(f)

def examine_paper(key):
    paper = data[key]
    print(f"=== FULL TEXT FOR {key} ===")
    for p in paper['pages']:
        print(f"\n--- PAGE {p['page']} ---")
        print(p['text'])

examine_paper("1_Maulida_Sari")
