import PDFDocument from "pdfkit";

export const exportToPDF = (res, data, filename, title = "Filtered Report") => {
  const doc = new PDFDocument({ margin: 30, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  doc.pipe(res);

  doc.fontSize(16).text(title, { align: "center" }).moveDown();

  if (data.length === 0) {
    doc.text("No data to display");
  } else {
    const headers = Object.keys(data[0]);
    const rows = data.map((item) => headers.map((h) => item[h] || ""));

    doc.fontSize(10);
    doc.text(headers.join(" | "), { underline: true });

    rows.forEach((row) => {
      doc.text(row.join(" | "));
    });
  }

  doc.end();
};
