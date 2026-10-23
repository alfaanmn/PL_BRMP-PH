import pypdf
import json
import re

files_map = {
    "1_Maulida_Sari": "jurnall/02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.1_Sistem_Informasi/asrianda,+7+Jurnal+Indah+Maulida+Sari+(new).pdf",
    "2_Gumelta": "jurnall/02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.2_Pengelolaan_Pengajuan_Magang/admin,+Riyang+Gumelta+OK.pdf",
    "3_Zikri": "jurnall/02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.1_Sistem_Informasi/2089-File Naskah Utama-7372-1-10-20260804.pdf",
    "4_Rian": "jurnall/02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.2_Pengelolaan_Pengajuan_Magang/ojs_thamrin,+Artikel+Hesti+Handa.pdf",
    "5_Zaidir": "jurnall/03_BAB_III_METODE_PENELITIAN/3_Metodologi_Pengembangan_Agile/Fahma+Vol+20+No+2+Mei+2022-1.pdf",
    "6_Zulfikar": "jurnall/01_BAB_I_PENDAHULUAN/01_Latar_Belakang/3138-Article Text-7346-1-10-20230717_SKM.pdf"
}

keywords = [
    "survei", "kepuasan", "skm", "ikm", "otp", "one-time password", 
    "verifikasi email", "status", "pending", "tracking", "pelacakan"
]

all_data = {}

for key, path in files_map.items():
    print(f"Processing {key}...")
    reader = pypdf.PdfReader(path)
    num_pages = len(reader.pages)
    pages_text = []
    kw_findings = {kw: [] for kw in keywords}
    
    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        text = page.extract_text() or ""
        pages_text.append({"page": page_num, "text": text})
        
        # Search keywords
        # Split text into sentences or windows
        # Let's find occurrences
        text_lower = text.lower()
        for kw in keywords:
            pattern = re.compile(r'\b' + re.escape(kw) + r'\b', re.IGNORECASE)
            for m in pattern.finditer(text):
                start = max(0, m.start() - 60)
                end = min(len(text), m.end() + 60)
                snippet = " ".join(text[start:end].split())
                # Truncate to max 15 words around match
                words = snippet.split()
                if len(words) > 15:
                    # center on match
                    snippet = " ".join(words[:15])
                kw_findings[kw].append({
                    "page": page_num,
                    "snippet": snippet
                })
                
    all_data[key] = {
        "file": path,
        "num_pages": num_pages,
        "pages": pages_text,
        "kw_findings": kw_findings
    }

# Save full extracted text for inspection
with open("scratch/extracted_papers_full.json", "w", encoding="utf-8") as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

print("Done extracting all 6 papers.")
