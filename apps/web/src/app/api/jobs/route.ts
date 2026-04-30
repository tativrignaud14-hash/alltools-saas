import { NextRequest, NextResponse } from "next/server";
import { getQueue, resetQueue } from "@/lib/queue";
import { createLocalJob } from "@/lib/local-jobs";
import { processDirectImageJob } from "@/lib/direct-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedJobTypes = new Set([
  "image:compress",
  "image:convert",
  "image:remove-bg",
  "image:tool",
  "image:upscale",
  "pdf:merge",
  "video:extract-audio",
]);

export async function POST(req: NextRequest) {
  try {
    const { type, inputUrl, options } = await req.json();

    if (!type || !inputUrl || !allowedJobTypes.has(type)) {
      return NextResponse.json(
        { error: "Bad request: type/inputUrl invalides." },
        { status: 400 }
      );
    }

    const data = { inputUrl, options };

    if (type.startsWith("image:")) {
      const directOptions =
        type === "image:tool"
          ? options || {}
          : type === "image:convert"
          ? { ...(options || {}), tool: "convert" }
          : type === "image:compress"
          ? { ...(options || {}), tool: "weight-target" }
          : type === "image:remove-bg"
          ? { ...(options || {}), tool: "remove-bg" }
          : { ...(options || {}), tool: "resize", width: 1600, height: 1600 };
      const result = await processDirectImageJob({ inputUrl, options: directOptions });
      return NextResponse.json({
        id: `direct-${Date.now()}`,
        status: "completed",
        state: "completed",
        mode: "direct",
        result,
      });
    }

    try {
      const job = await getQueue().add(
        type,
        data,
        {
          attempts: 2,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 86400 },
        }
      );

      return NextResponse.json({ id: job.id, status: "queued" });
    } catch (err) {
      await resetQueue();
      const localFallbackAllowed = process.env.ALLTOOLS_ALLOW_LOCAL_JOBS || process.env.ALLTOOLS_STORAGE_DIR;
      if (process.env.NODE_ENV === "production" && !localFallbackAllowed) {
        throw err;
      }

      console.warn("BullMQ unavailable, running local job fallback", err);
      const job = await createLocalJob(type, data);
      return NextResponse.json({ id: job.id, status: "completed", mode: "local" });
    }
  } catch (err: any) {
    console.error("Job creation failed", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
