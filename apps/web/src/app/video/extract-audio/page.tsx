"use client";
import { useState } from "react";
import { FileDrop } from "@/components/FileDrop";

async function getSignedUrl(filename: string, contentType: string) {
  const r = await fetch("/api/upload", { method: "POST", body: JSON.stringify({ filename, contentType }) });
  return r.json();
}

async function uploadTo(url: string, file: File) {
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
}

export default function ExtractAudioPage() {
  const [status, setStatus] = useState<string>("");
  const [download, setDownload] = useState<string | null>(null);

  async function handle(file: File) {
    setStatus("Upload…");
    const { url, objectUrl } = await getSignedUrl(file.name, file.type);
    await uploadTo(url, file);

    setStatus("Traitement…");
    const jr = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "video:extract-audio", inputUrl: objectUrl, options: {} }),
    });
    const { id } = await jr.json();

    // polling simple
    let tries = 0;
    while (tries < 120) {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (data.state === "completed" && data.result?.outputUrl) {
        setDownload(data.result.outputUrl);
        setStatus("Terminé");
        return;
      }
      if (data.state === "failed") {
        setStatus("Échec du traitement");
        return;
      }
      await new Promise(r => setTimeout(r, 1500));
      tries++;
    }
    setStatus("Temps d'attente dépassé");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Extraire l'audio (MP4 → MP3)</h1>
      <FileDrop onPicked={handle} />
      <div className="text-sm text-gray-600">{status}</div>
      {download && (
        <a href={download} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50">
          Télécharger le MP3
        </a>
      )}
    </div>
  );
}
