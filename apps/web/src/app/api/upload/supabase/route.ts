import { NextRequest, NextResponse } from "next/server";
import { encodeStoragePath, supabaseBucket, supabaseHeaders, supabaseUrl } from "@/lib/supabase-storage";

function safeStorageKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!/^uploads\//.test(normalized) || normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

export async function PUT(req: NextRequest) {
  try {
    const key = safeStorageKey(req.nextUrl.searchParams.get("key") || "");
    const contentType = req.nextUrl.searchParams.get("contentType") || "application/octet-stream";
    const body = Buffer.from(await req.arrayBuffer());

    const response = await fetch(`${supabaseUrl()}/storage/v1/object/${supabaseBucket()}/${encodeStoragePath(key)}`, {
      method: "POST",
      headers: {
        ...supabaseHeaders(contentType),
        "x-upsert": "true",
      },
      body,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return NextResponse.json({ ok: true, objectUrl: `supabase://${key}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
