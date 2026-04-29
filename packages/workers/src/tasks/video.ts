import ffmpeg from "@ffmpeg-installer/ffmpeg";
import { execa } from "execa";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { downloadToFile, uploadLocalFile } from "../utils/storage.js";

interface ExtractAudioPayload {
  inputUrl: string;
}

export async function processVideoExtractAudio(data: ExtractAudioPayload) {
  const dir = await mkdtemp(path.join(tmpdir(), "alltools-video-"));
  const inputPath = path.join(dir, "input-video");
  const outputPath = path.join(dir, "audio.mp3");

  try {
    await downloadToFile(data.inputUrl, inputPath);
    await execa(ffmpeg.path, ["-y", "-i", inputPath, "-vn", "-codec:a", "libmp3lame", "-q:a", "2", outputPath]);
    const outputUrl = await uploadLocalFile(outputPath, "audio/mpeg", "mp3");
    return { outputUrl };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
