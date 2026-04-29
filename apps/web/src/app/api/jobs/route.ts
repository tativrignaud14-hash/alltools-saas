import { NextRequest, NextResponse } from "next/server";
import { getQueue } from "@/lib/queue";
import { createLocalJob } from "@/lib/local-jobs";

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
