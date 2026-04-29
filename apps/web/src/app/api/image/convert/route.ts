import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Deprecated endpoint. Upload via /api/upload, then create an image:convert job via /api/jobs." },
    { status: 410 }
  );
}
