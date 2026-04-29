import { Worker, Job } from "bullmq";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { handleImageJob } from "./tasks/image/index.js";
import { processPdfMerge } from "./tasks/pdf.js";
import { processVideoExtractAudio } from "./tasks/video.js";
import { requiredEnv } from "./utils/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../../../.env");
dotenv.config({ path: envPath });

const connection = {
  url: requiredEnv("REDIS_URL"),
  tls: requiredEnv("REDIS_URL").startsWith("rediss://") || requiredEnv("REDIS_URL").includes("upstash.io") ? {} : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

const worker = new Worker(
  "alltools",
  async (job: Job) => {
    if (job.name.startsWith("image:")) {
      return handleImageJob(job);
    }

    switch (job.name) {
      case "test-job":
        return { status: "success", data: job.data };
      case "video:extract-audio":
        return processVideoExtractAudio(job.data);
      case "pdf:merge":
        return processPdfMerge(job.data);
      default:
        throw new Error(`Unhandled job: ${job.name}`);
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} (${job?.name}) failed:`, err.message);
});

console.log("Worker ready");
