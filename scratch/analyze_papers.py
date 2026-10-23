import json
import re

with open("scratch/extracted_papers_full.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("scratch/analyze_output.txt", "w", encoding="utf-8") as out:
    for key, paper in data.items():
        out.write("="*60 + "\n")
        out.write(f"ANALYZING: {key} (Total Pages: {paper['num_pages']})\n")
        out.write("="*60 + "\n")
        
        # 1. Print first page to inspect title, authors, journal, vol/no/pp, doi
        p1 = paper['pages'][0]['text']
        out.write("--- PAGE 1 HEADER & INFO ---\n")
        lines = [l.strip() for l in p1.split("\n") if l.strip()]
        for l in lines[:35]:
            out.write(l + "\n")
        out.write("...\n")
        
        # 2. Look for keywords findings
        out.write("\n--- KEYWORD FINDINGS ---\n")
        for kw, hits in paper['kw_findings'].items():
            if hits:
                out.write(f"[{kw}]: {len(hits)} occurrence(s)\n")
                for h in hits:
                    out.write(f"   Page {h['page']}: {h['snippet']}\n")
            else:
                out.write(f"[{kw}]: TIDAK DITEMUKAN\n")
                
        # 3. Look for sections: Metode, Pengujian/Evaluasi, Kesimpulan
        out.write("\n--- SECTIONS SEARCH ---\n")
        for p in paper['pages']:
            p_text = p['text']
            # Check headings
            for match in re.finditer(r'(metode|metodologi|pengujian|evaluasi|kesimpulan|saran|hasil dan pembahasan|arsitektur|analisis kebutuhan|blackbox|black box|system development)', p_text, re.IGNORECASE):
                start = max(0, match.start() - 20)
                end = min(len(p_text), match.end() + 100)
                snippet = " ".join(p_text[start:end].split())
                out.write(f"   [Page {p['page']}] Section hit: {snippet[:120]}...\n")

print("Done writing analyze_output.txt")
