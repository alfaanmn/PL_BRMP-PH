/**
 * Helper pembuat berkas PDF (.pdf) dan Word (.docx) secara client-side dinamis.
 * Semua dependency (jspdf, jspdf-autotable, docx) di-load secara dynamic (await import)
 * agar tidak membengkakkan initial bundle dan aman dari error server-side rendering (SSR).
 */

export interface ExportTableColumn {
  header: string
  key: string
  width?: number // perkiraan lebar kolom
}

export interface ExportDocOptions {
  title: string
  subtitle?: string
  dateRange?: string
  filename: string
  columns: ExportTableColumn[]
  data: Record<string, any>[]
}

export interface ExportDocSection {
  title: string
  columns: ExportTableColumn[]
  data: Record<string, any>[]
}

export interface MultiSectionExportDocOptions {
  title: string
  subtitle?: string
  dateRange?: string
  filename: string
  sections: ExportDocSection[]
}

/**
 * Ekspor tabel data ke format PDF Landscape dengan penomoran halaman otomatis.
 */
export async function exportTableToPDF(options: ExportDocOptions): Promise<void> {
  const { title, subtitle, dateRange, filename, columns, data } = options

  // Dynamic import jspdf & autoTable
  const { default: jsPDF } = await import('jspdf')
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule.default || autoTableModule

  // Gunakan orientasi Landscape (a4)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Header Teks Dokumen
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 14, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  const sub = subtitle || 'Kementerian Pertanian Republik Indonesia — Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian (BRMP-PH)'
  doc.text(sub, 14, 21)

  if (dateRange) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Periode: ${dateRange} | Diunduh: ${new Date().toLocaleString('id-ID')}`, 14, 26)
  }

  // Siapkan data tabel untuk autotable
  const tableHeaders = columns.map((c) => c.header)
  const tableRows = (data || []).map((row, idx) => {
    return columns.map((col) => {
      if (col.key === 'no') return String(idx + 1)
      const val = row[col.key]
      if (val === null || val === undefined || val === '') return '-'
      return String(val)
    })
  })

  // Jika data kosong, tampilkan 1 baris keterangan
  const finalRows = tableRows.length > 0 ? tableRows : [columns.map(() => 'Tidak ada data')]

  // Render Tabel dengan AutoTable
  ;(autoTable as any)(doc, {
    startY: dateRange ? 30 : 25,
    head: [tableHeaders],
    body: finalRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 42, 71], // Navy #0F2A47
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate light #F8FAFC
    },
    margin: { left: 14, right: 14, bottom: 18 },
    didDrawPage: (dataObj: any) => {
      // Footer Nomor Halaman
      const pageCount = (doc as any).internal.getNumberOfPages()
      const currentPage = dataObj.pageNumber
      doc.setFontSize(8)
      doc.setTextColor(140, 140, 140)
      doc.text(
        `Halaman ${currentPage} dari ${pageCount}`,
        doc.internal.pageSize.width - 14,
        doc.internal.pageSize.height - 8,
        { align: 'right' }
      )
    },
  })

  // Simpan file
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

/**
 * Ekspor tabel data ke format Word (.docx) dengan tabel bergaris rapi.
 */
export async function exportTableToWord(options: ExportDocOptions): Promise<void> {
  const { title, subtitle, dateRange, filename, columns, data } = options

  // Dynamic import docx
  const docx = await import('docx')
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    PageOrientation,
    AlignmentType,
    HeadingLevel,
    BorderStyle,
  } = docx

  // Header teks dokumen
  const docChildren: any[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
    }),
  ]

  if (subtitle) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: subtitle,
            color: '475569',
            size: 18, // 9pt
          }),
        ],
        spacing: { after: 100 },
      })
    )
  }

  if (dateRange) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Periode: ${dateRange} | Diunduh: ${new Date().toLocaleString('id-ID')}`,
            color: '64748B',
            size: 16, // 8pt
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    )
  }

  // Header row tabel
  const tableHeaderCells = columns.map(
    (col) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: col.header,
                bold: true,
                color: 'FFFFFF',
                size: 16, // 8pt
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: {
          fill: '0F2A47', // Navy
        },
      })
  )

  const docRows = [
    new TableRow({
      children: tableHeaderCells,
      tableHeader: true,
    }),
  ]

  // Data rows
  if (data && data.length > 0) {
    data.forEach((row, idx) => {
      const rowCells = columns.map((col) => {
        let val = ''
        if (col.key === 'no') {
          val = String(idx + 1)
        } else {
          const raw = row[col.key]
          val = raw !== null && raw !== undefined && raw !== '' ? String(raw) : '-'
        }

        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: val,
                  size: 16, // 8pt
                  color: '0F172A',
                }),
              ],
            }),
          ],
          shading: {
            fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF',
          },
        })
      })

      docRows.push(
        new TableRow({
          children: rowCells,
        })
      )
    })
  } else {
    // Baris kosong jika tidak ada data
    docRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: columns.length,
            children: [
              new Paragraph({
                text: 'Tidak ada data untuk periode atau filter yang dipilih.',
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      })
    )
  }

  // Buat tabel dengan layout full width
  const table = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: docRows,
  })

  docChildren.push(table)

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
          },
        },
        children: docChildren,
      },
    ],
  })

  // Generate buffer dan trigger download di browser
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Ekspor multi-section dokumen ke format PDF Landscape (1 file utuh dengan beberapa tabel/kategori).
 */
export async function exportMultiSectionDocToPDF(options: MultiSectionExportDocOptions): Promise<void> {
  const { title, subtitle, dateRange, filename, sections } = options

  const { default: jsPDF } = await import('jspdf')
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule.default || autoTableModule

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Header Teks Utama Dokumen
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 14, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  const sub =
    subtitle ||
    'Kementerian Pertanian Republik Indonesia — Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian (BRMP-PH)'
  doc.text(sub, 14, 21)

  if (dateRange) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`Periode: ${dateRange} | Diunduh: ${new Date().toLocaleString('id-ID')}`, 14, 26)
  }

  let currentY = dateRange ? 32 : 28

  // Render Setiap Section
  sections.forEach((sec, sIdx) => {
    if (sIdx > 0) {
      if (currentY > 165) {
        doc.addPage()
        currentY = 16
      } else {
        currentY += 8
      }
    }

    // Judul Section
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 42, 71) // Navy #0F2A47
    doc.text(sec.title, 14, currentY)
    currentY += 4

    const tableHeaders = sec.columns.map((c) => c.header)
    const tableRows = (sec.data || []).map((row, idx) => {
      return sec.columns.map((col) => {
        if (col.key === 'no') return String(idx + 1)
        const val = row[col.key]
        if (val === null || val === undefined || val === '') return '-'
        return String(val)
      })
    })

    const finalRows = tableRows.length > 0 ? tableRows : [sec.columns.map(() => 'Tidak ada data')]

    ;(autoTable as any)(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: finalRows,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        overflow: 'linebreak',
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [15, 42, 71],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14, bottom: 18 },
      didDrawPage: (dataObj: any) => {
        const pageCount = (doc as any).internal.getNumberOfPages()
        const currentPage = dataObj.pageNumber
        doc.setFontSize(8)
        doc.setTextColor(140, 140, 140)
        doc.text(
          `Halaman ${currentPage} dari ${pageCount}`,
          doc.internal.pageSize.width - 14,
          doc.internal.pageSize.height - 8,
          { align: 'right' }
        )
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 4
  })

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}

/**
 * Ekspor multi-section dokumen ke format Word (.docx) (1 file utuh dengan beberapa tabel/kategori).
 */
export async function exportMultiSectionDocToWord(options: MultiSectionExportDocOptions): Promise<void> {
  const { title, subtitle, dateRange, filename, sections } = options
  const docx = await import('docx')
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
    PageOrientation,
    AlignmentType,
    HeadingLevel,
  } = docx

  const docChildren: any[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 100 },
    }),
  ]

  if (subtitle) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: subtitle,
            color: '475569',
            size: 18,
          }),
        ],
        spacing: { after: 100 },
      })
    )
  }

  if (dateRange) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Periode: ${dateRange} | Diunduh: ${new Date().toLocaleString('id-ID')}`,
            color: '64748B',
            size: 16,
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    )
  }

  // Tambahkan setiap section dengan heading dan tabelnya
  sections.forEach((sec, sIdx) => {
    docChildren.push(
      new Paragraph({
        text: sec.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: sIdx === 0 ? 100 : 300, after: 150 },
      })
    )

    const tableHeaderCells = sec.columns.map(
      (col) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: col.header,
                  bold: true,
                  color: 'FFFFFF',
                  size: 16,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: {
            fill: '0F2A47',
          },
        })
    )

    const docRows = [
      new TableRow({
        children: tableHeaderCells,
        tableHeader: true,
      }),
    ]

    if (sec.data && sec.data.length > 0) {
      sec.data.forEach((row, idx) => {
        const rowCells = sec.columns.map((col) => {
          let val = ''
          if (col.key === 'no') {
            val = String(idx + 1)
          } else {
            const raw = row[col.key]
            val = raw !== null && raw !== undefined && raw !== '' ? String(raw) : '-'
          }
          return new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: val,
                    size: 16,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
            shading: {
              fill: idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF',
            },
          })
        })
        docRows.push(new TableRow({ children: rowCells }))
      })
    } else {
      docRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: sec.columns.length,
              children: [
                new Paragraph({
                  text: 'Tidak ada data untuk kategori ini.',
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        })
      )
    }

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: docRows,
    })

    docChildren.push(table)
  })

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
          },
        },
        children: docChildren,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
