import { NextRequest, NextResponse } from "next/server";
import { getSignedPutUrl } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const { url, objectUrl } = await getSignedPutUrl(filename, contentType);
    return NextResponse.json({ url, objectUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
