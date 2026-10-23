with open("scratch/1_Maulida_Sari_text.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Let's inspect sections: metode, teknologi, pengujian, kesimpulan, saran
import re

sections = ["METODE", "HASIL DAN PEMBAHASAN", "KESIMPULAN", "SARAN", "Black Box"]
for sec in sections:
    pos = text.find(sec)
    print(f"=== SECTION: {sec} ===")
    if pos != -1:
        print(text[pos:pos+1500])
    else:
        print("NOT FOUND")
    print("\n" + "="*50 + "\n")
