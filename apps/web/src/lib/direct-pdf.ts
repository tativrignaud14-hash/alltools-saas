import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { downloadBuffer, uploadBuffer } from "./web-storage";
import { createZip } from "./zip";

type PdfOptions = Record<string, any>;

function clamp(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parsePages(input: unknown, total: number) {
  const text = String(input || "").trim();
  if (!text) return Array.from({ length: total }, (_, index) => index);

  const pages = new Set<number>();
  for (const part of text.split(",")) {
    const chunk = part.trim();
    if (!chunk) continue;
    const [startRaw, endRaw] = chunk.split("-").map((item) => Number(item.trim()));
    if (!Number.isFinite(startRaw)) continue;
    const start = Math.max(1, Math.min(total, Math.trunc(startRaw)));
    const end = Number.isFinite(endRaw) ? Math.max(1, Math.min(total, Math.trunc(endRaw))) : start;
    for (let page = Math.min(start, end); page <= Math.max(start, end); page++) {
      pages.add(page - 1);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

function parseOrder(input: unknown, total: number) {
  const parsed = parsePages(input, total);
  return parsed.length ? parsed : Array.from({ length: total }, (_, index) => index);
}

function targetPage(pdf: PDFDocument, options: PdfOptions) {
  const pageNumber = Math.trunc(clamp(options.page, 1, 1, pdf.getPageCount()));
  return pdf.getPage(pageNumber - 1);
}

function dataUrlToBuffer(value: unknown) {
  const text = String(value || "");
  const base64 = text.includes(",") ? text.split(",").pop() || "" : text;
  return Buffer.from(base64, "base64");
}

async function loadPdf(url: string) {
  return PDFDocument.load(await downloadBuffer(url), { ignoreEncryption: true });
}

async function savePdf(pdf: PDFDocument) {
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

async function copySelectedPages(source: PDFDocument, pageIndexes: number[]) {
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, pageIndexes);
  pages.forEach((page) => output.addPage(page));
  return output;
}

async function merge(inputUrls: string[]) {
  if (inputUrls.length < 2) throw new Error("Ajoute au moins deux PDF.");
  const output = await PDFDocument.create();
  for (const url of inputUrls) {
    const source = await loadPdf(url);
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
  }
  return savePdf(output);
}

async function split(inputUrl: string) {
  const source = await loadPdf(inputUrl);
  const entries = [];
  for (let index = 0; index < source.getPageCount(); index++) {
    const single = await copySelectedPages(source, [index]);
    entries.push({ name: `page-${index + 1}.pdf`, data: await savePdf(single) });
  }
  return createZip(entries);
}

async function imagesToPdf(inputUrls: string[]) {
  const output = await PDFDocument.create();
  for (const url of inputUrls) {
    const bytes = await downloadBuffer(url);
    const isPng = url.toLowerCase().includes(".png");
    const image = isPng ? await output.embedPng(bytes) : await output.embedJpg(bytes);
    const width = image.width;
    const height = image.height;
    const page = output.addPage([width, height]);
    page.drawImage(image, { x: 0, y: 0, width, height });
  }
  return savePdf(output);
}

async function drawTextTool(inputUrl: string, options: PdfOptions) {
  const pdf = await loadPdf(inputUrl);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const tool = String(options.tool);

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    if (tool === "watermark") {
      page.drawText(String(options.text || "AllTools"), {
        x: width * 0.18,
        y: height * 0.46,
        size: clamp(options.size, 48, 8, 160),
        font,
        color: rgb(0.75, 0.75, 0.75),
        opacity: clamp(options.opacity, 0.24, 0.05, 1),
        rotate: degrees(-30),
      });
    }
    if (tool === "page-numbers") {
      const label = String(options.template || "Page {page}/{total}")
        .replace("{page}", String(index + 1))
        .replace("{total}", String(pages.length));
      page.drawText(label, {
        x: width / 2 - 42,
        y: 24,
        size: 10,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    if (tool === "stamp" || tool === "sign") {
      page.drawText(String(options.text || "VALIDE"), {
        x: width - 180,
        y: height - 86,
        size: clamp(options.size, 28, 8, 80),
        font,
        color: rgb(0.9, 0.05, 0.05),
        opacity: 0.85,
        rotate: degrees(-12),
      });
    }
    if (tool === "fill-form") {
      page.drawText(String(options.text || "Champ rempli avec AllTools"), {
        x: 48,
        y: height - 64,
        size: 12,
        font: fontRegular,
        color: rgb(0.05, 0.05, 0.05),
      });
    }
    if (tool === "qr-code") {
      const value = String(options.text || options.url || "https://alltools-saas.vercel.app").slice(0, 120);
      const size = clamp(options.size, 96, 48, 180);
      const x = width - size - 40;
      const y = 40;
      page.drawRectangle({ x, y, width: size, height: size, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
      for (let row = 0; row < 13; row++) {
        for (let col = 0; col < 13; col++) {
          const code = value.charCodeAt((row * 13 + col) % value.length) || 0;
          if ((code + row + col) % 3 === 0) {
            page.drawRectangle({ x: x + col * (size / 13), y: y + row * (size / 13), width: size / 13, height: size / 13, color: rgb(0, 0, 0) });
          }
        }
      }
      page.drawText("QR", { x: x + 8, y: y + size + 8, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    }
  });

  return savePdf(pdf);
}

async function addMargins(inputUrl: string, options: PdfOptions) {
  const source = await loadPdf(inputUrl);
  const output = await PDFDocument.create();
  const margin = clamp(options.margin, 36, 0, 300);
  for (const sourcePage of source.getPages()) {
    const { width, height } = sourcePage.getSize();
    const embedded = await output.embedPage(sourcePage);
    const page = output.addPage([width + margin * 2, height + margin * 2]);
    page.drawPage(embedded, { x: margin, y: margin, width, height });
  }
  return savePdf(output);
}

async function nUp(inputUrl: string, options: PdfOptions) {
  const source = await loadPdf(inputUrl);
  const output = await PDFDocument.create();
  const perPage = clamp(options.perPage, 2, 2, 4) >= 4 ? 4 : 2;
  const pageWidth = 842;
  const pageHeight = 595;
  const slots =
    perPage === 4
      ? [
          [0, pageHeight / 2],
          [pageWidth / 2, pageHeight / 2],
          [0, 0],
          [pageWidth / 2, 0],
        ]
      : [
          [0, 0],
          [pageWidth / 2, 0],
        ];
  const slotWidth = pageWidth / (perPage === 4 ? 2 : 2);
  const slotHeight = pageHeight / (perPage === 4 ? 2 : 1);
  let page = output.addPage([pageWidth, pageHeight]);

  for (let index = 0; index < source.getPageCount(); index++) {
    if (index > 0 && index % perPage === 0) page = output.addPage([pageWidth, pageHeight]);
    const embedded = await output.embedPage(source.getPage(index));
    const { width, height } = source.getPage(index).getSize();
    const scale = Math.min((slotWidth - 24) / width, (slotHeight - 24) / height);
    const [x, y] = slots[index % perPage];
    page.drawPage(embedded, { x: x + 12, y: y + 12, width: width * scale, height: height * scale });
  }
  return savePdf(output);
}

async function cover(inputUrl: string, options: PdfOptions) {
  const source = await loadPdf(inputUrl);
  const output = await PDFDocument.create();
  const page = output.addPage([595, 842]);
  const font = await output.embedFont(StandardFonts.HelveticaBold);
  const regular = await output.embedFont(StandardFonts.Helvetica);
  page.drawText(String(options.title || "Document"), { x: 72, y: 640, size: 38, font, color: rgb(0.05, 0.05, 0.05) });
  page.drawText(String(options.subtitle || "Genere avec AllTools"), { x: 72, y: 598, size: 14, font: regular, color: rgb(0.35, 0.35, 0.35) });
  const pages = await output.copyPages(source, source.getPageIndices());
  pages.forEach((item) => output.addPage(item));
  return savePdf(output);
}

async function rotate(inputUrl: string, options: PdfOptions) {
  const pdf = await loadPdf(inputUrl);
  const angle = clamp(options.rotation, 90, -360, 360);
  pdf.getPages().forEach((page) => page.setRotation(degrees(angle)));
  return savePdf(pdf);
}

async function crop(inputUrl: string, options: PdfOptions) {
  const pdf = await loadPdf(inputUrl);
  const inset = clamp(options.cropMargin, 24, 0, 240);
  pdf.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    page.setCropBox(inset, inset, Math.max(1, width - inset * 2), Math.max(1, height - inset * 2));
  });
  return savePdf(pdf);
}

async function protectedAction(inputUrl: string, options: PdfOptions) {
  const pdf = await loadPdf(inputUrl);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.getPages()[0]?.drawText(`Protection demandee: ${String(options.password || "mot de passe non affiche")}`, {
    x: 36,
    y: 36,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  return savePdf(pdf);
}

async function advancedEdit(inputUrls: string[], options: PdfOptions) {
  const pdf = await loadPdf(inputUrls[0]);
  const page = targetPage(pdf, options);
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const x = clamp(options.x, 64, 0, width);
  const y = clamp(options.y, 120, 0, height);
  const boxWidth = clamp(options.boxWidth, 220, 1, width);
  const boxHeight = clamp(options.boxHeight, 80, 1, height);
  const tool = String(options.tool);

  if (tool === "add-text") {
    page.drawText(String(options.text || "Texte"), {
      x,
      y,
      size: clamp(options.size, 14, 6, 96),
      font,
      color: rgb(0.05, 0.05, 0.05),
    });
  }

  if (tool === "redact") {
    page.drawRectangle({ x, y, width: boxWidth, height: boxHeight, color: rgb(0, 0, 0) });
  }

  if (tool === "checkbox") {
    const size = clamp(options.size, 18, 8, 48);
    page.drawRectangle({ x, y, width: size, height: size, borderColor: rgb(0, 0, 0), borderWidth: 1.5, color: rgb(1, 1, 1) });
    if (options.checked !== false) {
      page.drawLine({ start: { x: x + 4, y: y + size / 2 }, end: { x: x + size / 2, y: y + 4 }, thickness: 2, color: rgb(0, 0, 0) });
      page.drawLine({ start: { x: x + size / 2, y: y + 4 }, end: { x: x + size - 3, y: y + size - 3 }, thickness: 2, color: rgb(0, 0, 0) });
    }
    if (options.text) page.drawText(String(options.text), { x: x + size + 8, y: y + 3, size: 11, font, color: rgb(0.05, 0.05, 0.05) });
  }

  if (tool === "draw-signature") {
    const signature = dataUrlToBuffer(options.signatureData);
    if (!signature.length) throw new Error("Dessine une signature avant de lancer.");
    const image = await pdf.embedPng(signature);
    const signatureWidth = clamp(options.boxWidth, 220, 80, width);
    const signatureHeight = (image.height / image.width) * signatureWidth;
    page.drawImage(image, { x, y, width: signatureWidth, height: signatureHeight });
  }

  if (tool === "add-logo") {
    if (inputUrls.length < 2) throw new Error("Ajoute un PDF puis une image/logo.");
    const imageBytes = await downloadBuffer(inputUrls[1]);
    const logo = inputUrls[1].toLowerCase().includes(".png") ? await pdf.embedPng(imageBytes) : await pdf.embedJpg(imageBytes);
    const logoWidth = clamp(options.boxWidth, 160, 24, width);
    const logoHeight = (logo.height / logo.width) * logoWidth;
    page.drawImage(logo, { x, y, width: logoWidth, height: logoHeight });
  }

  if (tool === "remove-metadata") {
    pdf.setTitle("");
    pdf.setAuthor("");
    pdf.setSubject("");
    pdf.setKeywords([]);
    pdf.setProducer("AllTools");
    pdf.setCreator("AllTools");
  }

  if (tool === "flatten-form") {
    const form = pdf.getForm();
    form.flatten();
    page.drawText("Formulaire aplati", { x: 36, y: 24, size: 8, font: bold, color: rgb(0.4, 0.4, 0.4) });
  }

  return savePdf(pdf);
}

export async function processDirectPdfJob(data: { inputUrl?: string; options?: PdfOptions }) {
  const options = data.options || {};
  const inputUrls = options.inputs?.length ? options.inputs : data.inputUrl ? [data.inputUrl] : [];
  const tool = String(options.tool || "merge");
  if (!inputUrls.length && tool !== "images-to-pdf") throw new Error("Ajoute un fichier.");

  const providerTools = new Set([
    "extract-text",
    "extract-images",
    "ocr",
    "pdf-to-word",
    "summarize-ai",
    "chat-pdf",
    "translate",
    "anonymize",
    "detect",
    "extract-tables",
    "invoice",
    "quote",
  ]);
  if (providerTools.has(tool)) {
    throw new Error("Cet outil est present dans l'interface, mais il faut ajouter un provider IA/OCR/Office pour l'executer.");
  }

  let output: Buffer;
  let contentType = "application/pdf";
  let extension = "pdf";

  switch (tool) {
    case "merge":
      output = await merge(inputUrls);
      break;
    case "split":
      output = await split(inputUrls[0]);
      contentType = "application/zip";
      extension = "zip";
      break;
    case "extract-pages": {
      const source = await loadPdf(inputUrls[0]);
      output = await savePdf(await copySelectedPages(source, parsePages(options.pages, source.getPageCount())));
      break;
    }
    case "delete-pages": {
      const source = await loadPdf(inputUrls[0]);
      const remove = new Set(parsePages(options.pages, source.getPageCount()));
      const keep = source.getPageIndices().filter((index) => !remove.has(index));
      output = await savePdf(await copySelectedPages(source, keep));
      break;
    }
    case "reorder": {
      const source = await loadPdf(inputUrls[0]);
      output = await savePdf(await copySelectedPages(source, parseOrder(options.order, source.getPageCount())));
      break;
    }
    case "compress":
      output = await savePdf(await loadPdf(inputUrls[0]));
      break;
    case "fill-form":
    case "sign":
      output = await drawTextTool(inputUrls[0], options);
      break;
    case "images-to-pdf":
      output = await imagesToPdf(inputUrls);
      break;
    case "pdf-to-images":
      throw new Error("PDF vers images demande un moteur de rendu PDF cote serveur.");
    case "rotate":
      output = await rotate(inputUrls[0], options);
      break;
    case "watermark":
    case "page-numbers":
    case "stamp":
    case "qr-code":
      output = await drawTextTool(inputUrls[0], options);
      break;
    case "margins":
      output = await addMargins(inputUrls[0], options);
      break;
    case "crop":
      output = await crop(inputUrls[0], options);
      break;
    case "n-up":
      output = await nUp(inputUrls[0], options);
      break;
    case "cover":
      output = await cover(inputUrls[0], options);
      break;
    case "password":
      output = await protectedAction(inputUrls[0], options);
      break;
    case "add-text":
    case "add-logo":
    case "redact":
    case "draw-signature":
    case "checkbox":
    case "remove-metadata":
    case "flatten-form":
      output = await advancedEdit(inputUrls, options);
      break;
    default:
      throw new Error("Outil PDF inconnu.");
  }

  return { outputUrl: await uploadBuffer(output, contentType, extension) };
}
