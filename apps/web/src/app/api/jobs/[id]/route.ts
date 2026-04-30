import { NextRequest, NextResponse } from "next/server";
import { Job } from "bullmq";
import { getQueue } from "@/lib/queue";
import { getLocalJob } from "@/lib/local-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const localJob = await getLocalJob(params.id);
  if (localJob) {
    return NextResponse.json({
      id: localJob.id,
      state: localJob.state,
      result: localJob.result,
      failedReason: localJob.failedReason,
    });
  }

  const job = await Job.fromId(getQueue(), params.id);
  if (!job) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const state = await job.getState();
  return NextResponse.json({
    id: job.id,
    state,
    result: job.returnvalue || null,
    failedReason: job.failedReason || null,
  });
}
