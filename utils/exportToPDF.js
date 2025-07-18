// import PDFDocument from "pdfkit";

// export const exportToPDF = (res, data, filename, title = "Filtered Report") => {
//   const doc = new PDFDocument({ margin: 30, size: "A4" });

//   res.setHeader("Content-Type", "application/pdf");
//   res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

//   doc.pipe(res);

//   doc.fontSize(16).text(title, { align: "center" }).moveDown();

//   if (data.length === 0) {
//     doc.text("No data to display");
//   } else {
//     const headers = Object.keys(data[0]);
//     const rows = data.map((item) => headers.map((h) => item[h] || ""));

//     doc.fontSize(10);
//     doc.text(headers.join(" | "), { underline: true });

//     rows.forEach((row) => {
//       doc.text(row.join(" | "));
//     });
//   }

//   doc.end();
// };

// utils/exportToPDF.js
// import PDFDocument from 'pdfkit';
// import 'pdfkit-table'; // <- this extends PDFDocument

// export const exportTo = async (res, data, filename) => {
//   try {
//     const doc = new PDFDocument({ margin: 30, size: 'A4' });

//     // Set response headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

//     // Pipe to response
//     doc.pipe(res);

//     // Title
//     doc
//       .fontSize(18)
//       .fillColor('#333')
//       .text('Filtered Video Stats Report', { align: 'center' })
//       .moveDown(1.5);

//     // Define table headers
//     const headers = [
//       { label: 'Platform', property: 'platform', width: 60 },
//       { label: 'Channel Name', property: 'channelName', width: 120 },
//       { label: 'Link', property: 'link', width: 140 },
//       { label: 'Views', property: 'views', width: 60 },
//       { label: 'Upload Date', property: 'uploadDate', width: 80 },
//     ];

//     // Transform data
//     const rows = data.map(item => ({
//       platform: item.platform || (item.youtubelink ? 'YouTube' : 'Facebook'),
//       channelName: item.youtubechannel || item.facebookchannel || '',
//       link: item.youtubelink || item.facebooklink || '',
//       views: item.youtubeViews || item.facebookViews || 0,
//       uploadDate: item.uploadDate || '',
//     }));

//     // Draw table
//     await doc.table(
//       {
//         headers,
//         datas: rows,
//       },
//       {
//         prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
//         prepareRow: (row, i) => doc.font('Helvetica').fontSize(9),
//         align: 'left',
//         padding: 5,
//       }
//     );

//     // End the PDF stream
//     doc.end();
//   } catch (error) {
//     console.error("PDF generation failed:", error);
//     res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
//   }
// };



import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToPDF = (res, data, filename) => {
  try {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text("Filtered Video Stats Report", 14, 20);

    if (!Array.isArray(data) || data.length === 0) {
      doc.setFontSize(12);
      doc.text("No data available to display.", 14, 40);
    } else {
      const headers = Object.keys(data[0]);
      const rows = data.map((item) =>
        headers.map((key) => {
          const value = item[key];
          return typeof value === "object" ? JSON.stringify(value) : String(value);
        })
      );

      autoTable(doc, {
        startY: 30,
        head: [headers],
        body: rows,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        columnStyles: {
          0: { cellWidth: 20 },  // Example: ID
          1: { cellWidth: 50 },  // youtube link
          2: { cellWidth: 50 },  // facebook link
          3: { cellWidth: 50 },  // portal link
          // You can customize more columns like:
          // 4: { cellWidth: 30 }, 5: { cellWidth: 30 }, etc.
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
      });
    }

    const pdfStream = doc.output("arraybuffer");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.send(Buffer.from(pdfStream));
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("PDF generation failed");
  }
};
