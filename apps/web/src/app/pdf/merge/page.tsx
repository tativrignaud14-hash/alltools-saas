"use client";
import { useState } from "react";
import { FileDrop } from "@/components/FileDrop";

async function sign(name: string, type: string) {
  const r = await fetch("/api/upload", { method: "POST", body: JSON.stringify({ filename: name, contentType: type }) });
  return r.json();
}
async function upload(url: string, file: File) {
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
}

export default function PdfMergePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [dl, setDl] = useState<string | null>(null);

  function addFile(f: File) { if (f.type === "application/pdf") setFiles(prev => [...prev, f]); }

  async function run() {
    if (files.length < 2) { setStatus("Ajoute au moins 2 PDF"); return; }
    setStatus("Upload…");
    const urls: string[] = [];
    for (const f of files) {
      const { url, objectUrl } = await sign(f.name, f.type);
      await upload(url, f); urls.push(objectUrl);
    }
    setStatus("Traitement…");
    const jr = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pdf:merge", inputUrl: urls[0], options: { inputs: urls } }),
    });
    const { id } = await jr.json();

    let tries = 0;
    while (tries < 120) {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (data.state === "completed" && data.result?.outputUrl) { setDl(data.result.outputUrl); setStatus("Terminé"); return; }
      if (data.state === "failed") { setStatus("Échec du traitement"); return; }
      await new Promise(r => setTimeout(r, 1500)); tries++;
    }
    setStatus("Temps d'attente dépassé");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Fusionner des PDF</h1>
      <FileDrop onPicked={addFile} />
      <ul className="text-sm text-gray-600 list-disc pl-5">
        {files.map((f, i) => <li key={i}>{f.name}</li>)}
      </ul>
      <button onClick={run} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Fusionner</button>
      <div className="text-sm text-gray-600">{status}</div>
      {dl && <a href={dl} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 hover:bg-gray-50">Télécharger le PDF fusionné</a>}
    </div>
  );
}
