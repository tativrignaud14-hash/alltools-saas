import sharp from "sharp";
import { downloadBuffer, uploadBuffer } from "../../utils/storage.js";

type OutputFormat = "jpg" | "jpeg" | "png" | "webp" | "avif";

interface ConvertPayload {
  inputUrl: string;
  options?: {
    format?: OutputFormat;
    outputFormat?: OutputFormat;
    quality?: number;
  };
}

const contentTypes: Record<OutputFormat, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export async function processImageConvert(data: ConvertPayload) {
  const outputFormat = data.options?.outputFormat || data.options?.format || "webp";
  const quality = data.options?.quality ?? 85;
  const input = await downloadBuffer(data.inputUrl);

  const output = await sharp(input).toFormat(outputFormat, { quality }).toBuffer();
  const outputUrl = await uploadBuffer(output, contentTypes[outputFormat], outputFormat === "jpeg" ? "jpg" : outputFormat);

  return { outputUrl };
}
