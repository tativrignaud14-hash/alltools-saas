import { readFile } from "node:fs/promises";
import { handleImageJob } from "./tasks/image/index.js";
import { processPdfMerge } from "./tasks/pdf.js";
import { processVideoExtractAudio } from "./tasks/video.js";

interface LocalJob {
  name: string;
  data: unknown;
}

async function run(job: LocalJob) {
  if (job.name.startsWith("image:")) {
    return handleImageJob({ name: job.name, data: job.data } as any);
  }

  switch (job.name) {
    case "pdf:merge":
      return processPdfMerge(job.data as any);
    case "video:extract-audio":
      return processVideoExtractAudio(job.data as any);
    default:
      throw new Error(`Unhandled local job: ${job.name}`);
  }
}

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Missing local job payload path");
}

const payload = JSON.parse(await readFile(inputPath, "utf8")) as LocalJob;
const result = await run(payload);
process.stdout.write(JSON.stringify(result));
