import sharp from "sharp";
import { downloadBuffer, uploadBuffer } from "../../utils/storage.js";

interface CompressPayload {
  inputUrl: string;
  options?: {
    quality?: number;
  };
}

export async function processImageCompress(data: CompressPayload) {
  const quality = data.options?.quality ?? 75;
  const input = await downloadBuffer(data.inputUrl);
  const output = await sharp(input).webp({ quality }).toBuffer();
  const outputUrl = await uploadBuffer(output, "image/webp", "webp");

  return { outputUrl };
}
