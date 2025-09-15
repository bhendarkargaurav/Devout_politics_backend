// import { format } from "@fast-csv/format";
// import PDFDocument from "pdfkit";
// import axios from "axios"; 

// export const exportToCSV = (res, data, filename) => {

//   res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
//   res.setHeader("Content-Type", "text/csv");

//   const csvStream = format({ headers: true });
//   csvStream.pipe(res);

//   data.forEach((item) => {
//     csvStream.write({
//       newspaperName: item.newspaperName,
//       city: item.city || "-",
//       type: item.type || "-",
//       uploadDate: new Date(item.uploadDate).toISOString().split("T")[0],
//       // Export image URLs (comma separated if multiple)
//       images: item.images?.map((img) => img.url).join(", ") || "-",
//     });
//   });

//   csvStream.end();
// };

// PDF Export

// Helper: fetch image as buffer



// const fetchImageBuffer = async (url) => {
//   const response = await axios.get(url, { responseType: "arraybuffer" });
//   return Buffer.from(response.data, "binary");
// };

// export const exportToPDF = async (res, data, filename) => {
//   res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
//   res.setHeader("Content-Type", "application/pdf");

//   console.log('jhbg,', data);
//   const doc = new PDFDocument({ margin: 30 });
//   doc.pipe(res);

//   for (let i = 0; i < data.length; i++) {
//     const item = data[i];

//     // Title for each news item
//     doc.fontSize(16)//.text({ align: "center" });//`News ${i + 1}`
//     doc.moveDown(1);

//     // Metadata
//     doc
//       .fontSize(12)
//       .fillColor("black")
//       .text(`Newspaper: ${item.newspaperName}`)
//       .text(`City: ${item.city || "-"}`)
//       // .text(`Type: ${item.type}`)
//       // .text(
//       //   `Upload Date: ${new Date(item.uploadDate).toISOString().split("T")[0]}`
//       // );

//     doc.moveDown(1);

//     // Add images (each resized, max width/height 250)
//     if (item.images && item.images.length > 0) {
//       for (let img of item.images) {
//         try {
//           const buffer = await fetchImageBuffer(img.url);
//           doc.image(buffer, {
//             fit: [520, 550],
//             align: "center",
//             valign: "center",
//           });
//           doc.moveDown(1);
//         } catch (err) {
//           doc
//             .fontSize(10)
//             .fillColor("red")
//             .text("⚠ Image could not be loaded");
//           doc.fillColor("black");
//         }
//       }
//     }

//     // Add new page if not last item
//     // if (i < data.length - 1) {
//     //   doc.addPage();
//     // }
//     // doc.addPage();
//   }

//   doc.end();
// };














//hfuduyduyjfkyufktydtky
import { format } from "@fast-csv/format";
import PDFDocument from "pdfkit";
import axios from "axios";

// CSV Export Function
export const exportToCSV = (res, data, filename) => {
  try {
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "text/csv");

    const csvStream = format({ headers: true });
    csvStream.pipe(res);

    data.forEach((item, index) => {
      csvStream.write({
        srNo: index + 1,
        newspaperName: item.newspaperName || "-",
        city: item.city || "-",
        type: item.type || "-",
        uploadDate: item.uploadDate 
          ? new Date(item.uploadDate).toISOString().split("T")[0] 
          : "-",
        totalImages: item.images?.length || 0,
        imageUrls: item.images?.map((img) => img.url).join(" | ") || "-",
      });
    });

    csvStream.end();
    console.log(`CSV export completed: ${filename}`);
  } catch (error) {
    console.error("CSV Export Error:", error);
    res.status(500).json({ error: "Failed to export CSV" });
  }
};

// Helper: fetch image as buffer with timeout and retry
const fetchImageBuffer = async (url, timeout = 15000, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await axios.get(url, {
        responseType: "arraybuffer",
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeoutId);
      return Buffer.from(response.data, "binary");
    } catch (error) {
      console.error(`Image fetch attempt ${attempt + 1} failed for ${url}:`, error.message);
      if (attempt === retries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// PDF Export Function with improved image handling
export const exportToPDF = async (res, data, filename) => {
  try {
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", "application/pdf");

    console.log(`Starting PDF export for ${data.length} items`);
    const doc = new PDFDocument({ 
      margin: 30,
      size: 'A4'
    });
    doc.pipe(res);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      console.log(`Processing news item ${i + 1}: ${item.newspaperName}`);

      // Add title for each news item
      // doc.fontSize(18)
      //    .fillColor("black")
      //    .text(`News Item ${i + 1}`, { align: "center" });
      // doc.moveDown(1);

      // // Add metadata section
      // doc.fontSize(12)
        //  .text(`Newspaper: ${item.newspaperName || "N/A"}`, { continued: false })
        //  .text(`City: ${item.city || "N/A"}`)
        //  .text(`Type: ${item.type || "N/A"}`)
        //  .text(`Upload Date: ${item.uploadDate ? new Date(item.uploadDate).toISOString().split("T")[0] : "N/A"}`)
        //  .text(`Total Images: ${item.images?.length || 0}`);

      // doc.moveDown(1);

      // Process images if they exist
      if (item.images && item.images.length > 0) {
        // doc.fontSize(14)
          //  .text(`Images (${item.images.length} total):`)
          //  .moveDown(0.5);

        for (let j = 0; j < item.images.length; j++) {
          const img = item.images[j];
          console.log(`Processing image ${j + 1} of ${item.images.length} for news item ${i + 1}`);

          try {
            // Check available space on page
            const currentY = doc.y;
            const pageHeight = doc.page.height - doc.page.margins.bottom;
            const estimatedImageHeight = 350; // Height + caption + spacing

            // Add new page if not enough space
            if (currentY + estimatedImageHeight > pageHeight) {
              console.log(`Adding new page for image ${j + 1}`);
              doc.addPage();
            }

            // Add image caption
            // doc.fontSize(10)
            //    .fillColor("gray")
            //   //  .text(`Image ${j + 1} of ${item.images.length}:`, { align: "left" })
            //    .moveDown(0.3);

            // Fetch and add image
            const buffer = await fetchImageBuffer(img.url);
            
            doc.image(buffer, {
              fit: [500, 280], // Width x Height limits
              align: "center",
              valign: "center",
            });

            doc.moveDown(1);
            console.log(`Successfully added image ${j + 1}`);

            // Add page break after every 2 images to prevent overcrowding
            if ((j + 1) % 2 === 0 && j < item.images.length - 1) {
              doc.addPage();
              console.log(`Added page break after image ${j + 1}`);
            }

          } catch (error) {
            console.error(`Failed to load image ${j + 1} for news item ${i + 1}:`, error.message);
            
            // Add error message in PDF
            doc.fontSize(10)
               .fillColor("red")
               .text(`⚠ Image ${j + 1} could not be loaded`)
               .fontSize(8)
               .text(`URL: ${img.url}`)
               .fontSize(8)
               .text(`Error: ${error.message}`)
               .moveDown(1);
            
            doc.fillColor("black");
          }
        }
      } else {
        doc.fontSize(10)
           .fillColor("gray")
           .text("No images available for this news item")
           .moveDown(1);
        doc.fillColor("black");
      }

      // Add separator line and new page for next item (except for last item)
      if (i < data.length - 1) {
        // Add a separator line
        doc.moveTo(30, doc.y)
           .lineTo(doc.page.width - 30, doc.y)
           .stroke();
        
        doc.addPage();
        console.log(`Added new page for next news item`);
      }
    }

    doc.end();
    console.log(`PDF export completed: ${filename}`);

  } catch (error) {
    console.error("PDF Export Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to export PDF", details: error.message });
    }
  }
};

// Combined export function (exports both CSV and PDF)
export const exportData = async (res, data, filename, format) => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "No data provided for export" });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format.toLowerCase()) {
      case 'csv':
        const csvFilename = filename.endsWith('.csv') ? filename : `${filename}_${timestamp}.csv`;
        await exportToCSV(res, data, csvFilename);
        break;
        
      case 'pdf':
        const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}_${timestamp}.pdf`;
        await exportToPDF(res, data, pdfFilename);
        break;
        
      default:
        res.status(400).json({ error: "Unsupported export format. Use 'csv' or 'pdf'" });
    }
  } catch (error) {
    console.error("Export Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Export failed", details: error.message });
    }
  }
};

// Usage example for route handler:
/*
// In your route file (e.g., routes/export.js)
import { exportData } from './exportFunctions.js';

app.get('/export/:format', async (req, res) => {
  try {
    const { format } = req.params;
    const data = await YourDataModel.find(); // Replace with your data fetching logic
    
    const filename = `news_export_${new Date().toISOString().split('T')[0]}`;
    await exportData(res, data, filename, format);
  } catch (error) {
    console.error('Export route error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});
*/