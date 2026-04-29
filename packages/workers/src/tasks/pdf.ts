import { PDFDocument } from "pdf-lib";
import { downloadBuffer, uploadBuffer } from "../utils/storage.js";

interface PdfMergePayload {
  inputUrl?: string;
  options?: {
    inputs?: string[];
  };
}

export async function processPdfMerge(data: PdfMergePayload) {
  const inputs = data.options?.inputs?.length ? data.options.inputs : data.inputUrl ? [data.inputUrl] : [];
  if (inputs.length < 2) {
    throw new Error("At least two PDF inputs are required");
  }

  const merged = await PDFDocument.create();
  for (const inputUrl of inputs) {
    const bytes = await downloadBuffer(inputUrl);
    const source = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const output = Buffer.from(await merged.save());
  const outputUrl = await uploadBuffer(output, "application/pdf", "pdf");
  return { outputUrl };
}
