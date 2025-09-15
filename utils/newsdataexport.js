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
  console.log("kjbgjkgyjcgfUGD", url);
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
};

export const exportToPDF = async (res, data, filename) => {
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.setHeader("Content-Type", "application/pdf");

  console.log("data is", data,data[0].images);
  //  console.log("res is", res);
    console.log("filename is", filename, "yz");

  const doc = new PDFDocument({ margin: 30 });
  doc.pipe(res);

  // Title
  doc.fontSize(18).text("Filtered News Report", { align: "center" });
  doc.moveDown();

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    // News metadata
    doc
      .fontSize(12)
      .fillColor("black")
      // .text(
      //   `${i + 1}. ${item.newspaperName} | ${item.city || "-"} | ${
      //     item.type
      //   } | ${new Date(item.uploadDate).toISOString().split("T")[0]}`
      // );

    // Add images if present
    if (item.images && item.images.length > 0) {
      for (let img of item.images) {
        try {
          const buffer = await fetchImageBuffer(img.url); // ✅ fetch Cloudinary image
          doc.moveDown(0.3);
          doc.image(buffer, {
            fit: [400, 400],
            align: "center",
          });
        } catch (err) {
          doc
            .moveDown(0.5)  //0.3
            .fontSize(10)
            .fillColor("red")
            .text("Image could not be loaded");
          doc.fillColor("black");
        }
      }
    }

    doc.moveDown(1);
  }

  doc.end();
};
