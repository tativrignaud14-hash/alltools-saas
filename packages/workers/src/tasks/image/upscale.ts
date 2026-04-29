import sharp from "sharp";
import { downloadBuffer, uploadBuffer } from "../../utils/storage.js";

interface UpscalePayload {
  inputUrl: string;
  options?: {
    scale?: 2 | 3 | 4;
  };
}

export async function processImageUpscale(data: UpscalePayload) {
  const scale = data.options?.scale ?? 2;
  const input = await downloadBuffer(data.inputUrl);
  const metadata = await sharp(input).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Image dimensions could not be read");
  }

  const output = await sharp(input)
    .resize({
      width: Math.round(metadata.width * scale),
      height: Math.round(metadata.height * scale),
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const outputUrl = await uploadBuffer(output, "image/png", "png");
  return { outputUrl };
}
