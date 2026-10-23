import os
import pypdf
import json

base_dir = "jurnall"
results = []

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f.lower().endswith(".pdf"):
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, base_dir)
            try:
                reader = pypdf.PdfReader(full_path)
                num_pages = len(reader.pages)
                first_page = reader.pages[0].extract_text() if num_pages > 0 else ""
                lines = [l.strip() for l in first_page.split("\n") if l.strip()]
                preview = " /// ".join(lines[:12])
                results.append({
                    "rel_path": rel_path,
                    "filename": f,
                    "pages": num_pages,
                    "preview": preview
                })
            except Exception as e:
                results.append({
                    "rel_path": rel_path,
                    "filename": f,
                    "error": str(e)
                })

with open("scratch/pdf_summary.json", "w", encoding="utf-8") as out:
    json.dump(results, out, indent=2, ensure_ascii=False)

print(f"Inspected {len(results)} PDFs.")
