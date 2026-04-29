function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_BUCKET);
}

export function supabaseBucket() {
  return requiredEnv("SUPABASE_BUCKET");
}

export function supabaseUrl() {
  return requiredEnv("SUPABASE_URL").replace(/\/$/, "");
}

export function supabaseHeaders(contentType?: string) {
  const key = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

export function encodeStoragePath(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function publicSupabaseUrl(key: string) {
  return `${supabaseUrl()}/storage/v1/object/public/${supabaseBucket()}/${encodeStoragePath(key)}`;
}
