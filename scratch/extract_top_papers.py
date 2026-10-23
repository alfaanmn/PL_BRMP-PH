import pypdf
import json

targets = [
    "jurnall/02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.1_Sistem_Informasi/asrianda,+7+Jurnal+Indah+Maulida+Sari+(new).pdf",
    "jurnall/02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.2_Pengelolaan_Pengajuan_Magang/admin,+Riyang+Gumelta+OK.pdf",
    "jurnall/02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.1_Sistem_Informasi/2089-File Naskah Utama-7372-1-10-20260804.pdf",
    "jurnall/02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.2_Pengelolaan_Pengajuan_Magang/ojs_thamrin,+Artikel+Hesti+Handa.pdf"
]

for t in targets:
    try:
        reader = pypdf.PdfReader(t)
        text = reader.pages[0].extract_text()
        print("=== FILE:", t, "===")
        print(text[:1200])
        print("\n" + "="*40 + "\n")
    except Exception as e:
        print("Error reading", t, e)
