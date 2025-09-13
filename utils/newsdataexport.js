import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";

// CSV Export
export const exportToCSV = (res, data, filename) => {
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-Type", "text/csv");

  const csvStream = format({ headers: true });
  csvStream.pipe(res);

  data.forEach((item) => {
    csvStream.write({
      newspaperName: item.newspaperName,
      city: item.city,
      type: item.type,
      uploadDate: item.uploadDate.toISOString().split("T")[0],
    });
  });

  csvStream.end();
};

// PDF Export
export const exportToPDF = (res, data, filename) => {
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-Type", "application/pdf");

  const doc = new PDFDocument();
  doc.pipe(res);

  doc.fontSize(18).text("Filtered News Report", { align: "center" });
  doc.moveDown();

  data.forEach((item, index) => {
    doc.fontSize(12).text(
      `${index + 1}. ${item.newspaperName} | ${item.city || "-"} | ${
        item.type
      } | ${item.uploadDate.toISOString().split("T")[0]}`
    );
    doc.moveDown(0.5);
  });

  doc.end();
};
