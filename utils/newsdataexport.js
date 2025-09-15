import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";
import axios from "axios"; 

// ---------------------
// CSV Export
// ---------------------
export const exportToCSV = (res, data, filename) => {
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-Type", "text/csv");

  const csvStream = format({ headers: true });
  csvStream.pipe(res);

  data.forEach((item) => {
    csvStream.write({
      newspaperName: item.newspaperName,
      city: item.city || "-",
      type: item.type || "-",
      uploadDate: new Date(item.uploadDate).toISOString().split("T")[0],
      // Export image URLs (comma separated if multiple)
      images: item.images?.map((img) => img.url).join(", ") || "-",
    });
  });

  csvStream.end();
};

// PDF Export

// Helper: fetch image as buffer
const fetchImageBuffer = async (url) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
};

export const exportToPDF = async (res, data, filename) => {
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-Type", "application/pdf");

  const doc = new PDFDocument({ margin: 30 });
  doc.pipe(res);

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    // Title for each news item
    doc.fontSize(16)//.text({ align: "center" });//`News ${i + 1}`
    doc.moveDown(1);

    // Metadata
    doc
      .fontSize(12)
      .fillColor("black")
      .text(`Newspaper: ${item.newspaperName}`)
      .text(`City: ${item.city || "-"}`)
      // .text(`Type: ${item.type}`)
      // .text(
      //   `Upload Date: ${new Date(item.uploadDate).toISOString().split("T")[0]}`
      // );

    doc.moveDown(1);

    // Add images (each resized, max width/height 250)
    if (item.images && item.images.length > 0) {
      for (let img of item.images) {
        try {
          const buffer = await fetchImageBuffer(img.url);
          doc.image(buffer, {
            fit: [520, 550],
            align: "center",
            valign: "center",
          });
          doc.moveDown(1);
        } catch (err) {
          doc
            .fontSize(10)
            .fillColor("red")
            .text("⚠ Image could not be loaded");
          doc.fillColor("black");
        }
      }
    }

    // Add new page if not last item
    if (i < data.length - 1) {
      doc.addPage();
    }
  }

  doc.end();
};
