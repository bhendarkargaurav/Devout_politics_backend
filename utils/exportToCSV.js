import { format } from "@fast-csv/format";
import { PassThrough } from "stream";

export const exportToCSV = (res, data, filename) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const csvStream = format({ headers: true });
  const passThrough = new PassThrough();

  csvStream.pipe(passThrough).pipe(res);

  data.forEach((row) => csvStream.write(row));
  csvStream.end();
};
