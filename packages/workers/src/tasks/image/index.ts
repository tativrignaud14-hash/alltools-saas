import { Job } from "bullmq";
import { processImageConvert } from "./convert.js";
import { processImageCompress } from "./compress.js";
import { processImageRemoveBg } from "./removeBg.js";
import { processImageUpscale } from "./upscale.js";
import { processImageTool } from "./tools.js";

export { processImageConvert, processImageCompress, processImageRemoveBg, processImageUpscale, processImageTool };

export async function handleImageJob(job: Job) {
  switch (job.name) {
    case "image:convert":
      return processImageConvert(job.data);
    case "image:compress":
      return processImageCompress(job.data);
    case "image:remove-bg":
      return processImageRemoveBg(job.data);
    case "image:upscale":
      return processImageUpscale(job.data);
    case "image:tool":
      return processImageTool(job.data);
    default:
      throw new Error(`Unknown image task: ${job.name}`);
  }
}
