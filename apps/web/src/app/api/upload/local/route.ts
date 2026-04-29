import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { localStorageRoot, safeLocalKey } from "@/lib/local-storage";

export async function PUT(req: NextRequest) {
  try {
    const key = safeLocalKey(req.nextUrl.searchParams.get("key") || "");
    const buffer = Buffer.from(await req.arrayBuffer());
    const filePath = path.join(localStorageRoot(), key);

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);

    return NextResponse.json({ ok: true, objectUrl: `local://${key}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
