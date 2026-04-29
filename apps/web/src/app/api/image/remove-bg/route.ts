import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Deprecated endpoint. Upload via /api/upload, then create an image:remove-bg job via /api/jobs." },
    { status: 410 }
  );
}
