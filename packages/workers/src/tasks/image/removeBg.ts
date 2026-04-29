import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { downloadToFile, uploadLocalFile } from "../../utils/storage.js";

const exec = promisify(execFile);

interface RemoveBgPayload {
  inputUrl: string;
}

export async function processImageRemoveBg(data: RemoveBgPayload) {
  const dir = await mkdtemp(path.join(tmpdir(), "alltools-remove-bg-"));
  const inputPath = path.join(dir, "input");
  const outputPath = path.join(dir, "output.png");

  try {
    await downloadToFile(data.inputUrl, inputPath);
    await exec("rembg", ["i", inputPath, outputPath]);
    const outputUrl = await uploadLocalFile(outputPath, "image/png", "png");
    return { outputUrl };
  } catch (err: any) {
    throw new Error(`Background removal failed: ${err.message}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
