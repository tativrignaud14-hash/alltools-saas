"use client";

import { useEffect, useMemo, useState } from "react";

type ToolConfig = {
  key: string;
  label: string;
  group: string;
  accepts: string;
  runnable?: boolean;
  multi?: boolean;
};

const audioTools: ToolConfig[] = [
  { key: "convert-audio", label: "Convertir MP3/WAV/OGG", group: "Conversion", accepts: "audio/*" },
  { key: "compress-audio", label: "Compresser audio", group: "Conversion", accepts: "audio/*" },
  { key: "cut-audio", label: "Couper audio", group: "Edition", accepts: "audio/*" },
  { key: "merge-audio", label: "Fusionner audio", group: "Edition", accepts: "audio/*", multi: true },
  { key: "normalize-audio", label: "Normaliser volume", group: "Edition", accepts: "audio/*" },
  { key: "remove-silence", label: "Supprimer silence", group: "Edition", accepts: "audio/*" },
  { key: "voice-instrumental", label: "Voix / instrumental IA", group: "IA", accepts: "audio/*" },
];

const videoTools: ToolConfig[] = [
  { key: "extract-audio", label: "Extraire audio", group: "Essentiels", accepts: "video/*", runnable: false },
  { key: "compress-video", label: "Compresser video", group: "Essentiels", accepts: "video/*" },
  { key: "convert-video", label: "Convertir MP4/WebM/MOV", group: "Essentiels", accepts: "video/*" },
  { key: "video-to-frames", label: "Extraire images", group: "Edition", accepts: "video/*" },
  { key: "gif", label: "Creer GIF", group: "Edition", accepts: "video/*" },
  { key: "cut-video", label: "Couper video", group: "Edition", accepts: "video/*" },
  { key: "merge-video", label: "Fusionner videos", group: "Edition", accepts: "video/*", multi: true },
  { key: "watermark-video", label: "Ajouter watermark", group: "Edition", accepts: "video/*" },
  { key: "subtitles", label: "Extraire sous-titres", group: "Analyse", accepts: "video/*" },
  { key: "resolution-fps", label: "Changer resolution/FPS", group: "Export", accepts: "video/*" },
  { key: "remove-audio", label: "Supprimer audio", group: "Export", accepts: "video/*" },
];

function grouped(tools: ToolConfig[]) {
  return tools.reduce<Record<string, ToolConfig[]>>((acc, tool) => {
    acc[tool.group] = acc[tool.group] || [];
    acc[tool.group].push(tool);
    return acc;
  }, {});
}

export default function MediaUploader({ kind }: { kind: "audio" | "video" }) {
  const tools = kind === "audio" ? audioTools : videoTools;
  const [selected, setSelected] = useState(tools[0].key);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const groups = useMemo(() => grouped(tools), [tools]);
  const config = tools.find((tool) => tool.key === selected) || tools[0];

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function addFiles(next: File[]) {
    const accepted = next.filter((file) => {
      const family = config.accepts.replace("/*", "");
      return file.type.startsWith(family);
    });
    setFiles(config.multi ? [...files, ...accepted] : accepted.slice(0, 1));
    setMessage("");
  }

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  function run() {
    if (!files.length) return;
    setMessage("Cet outil est pret dans l'interface. Pour l'executer en production il faut brancher un worker FFmpeg gratuit/heberge ou un provider media.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-5">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="mb-2 text-xs uppercase text-neutral-500">{group}</div>
            <div className="grid gap-2">
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setSelected(item.key);
                    setFiles([]);
                    setMessage("");
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selected === item.key ? "border-blue-500 bg-blue-600 text-white" : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{config.label}</h2>
            <p className="text-sm text-neutral-400">{config.multi ? "Selection multiple acceptee" : "Un fichier a la fois"}</p>
          </div>
          <span className="rounded-full border border-amber-500 px-3 py-1 text-xs text-amber-300">Worker FFmpeg requis</span>
        </div>

        <input
          id={`${kind}-file-input`}
          type="file"
          multiple={config.multi}
          accept={config.accepts}
          onChange={(event) => addFiles(Array.from(event.target.files || []))}
          className="sr-only"
        />
        <label
          htmlFor={`${kind}-file-input`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(Array.from(event.dataTransfer.files || []));
          }}
          className="mb-5 flex min-h-28 cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-950 px-4 text-center text-sm text-neutral-300 hover:border-blue-500"
        >
          Deposer les fichiers ici ou cliquer pour choisir
        </label>

        {!!files.length && (
          <ul className="mb-5 space-y-2 text-sm text-neutral-300">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedIndex !== null) moveFile(draggedIndex, index);
                  setDraggedIndex(null);
                }}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="truncate">{index + 1}. {file.name}</span>
                  <span className="text-xs text-neutral-500">glisser</span>
                </div>
                {previewUrls[index] && kind === "audio" && <audio controls src={previewUrls[index]} className="w-full" />}
                {previewUrls[index] && kind === "video" && <video controls src={previewUrls[index]} className="aspect-video w-full rounded bg-black" />}
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={run} disabled={!files.length} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:bg-neutral-700">
          Lancer
        </button>
        {message && <p className="mt-4 text-sm text-amber-300">{message}</p>}
      </section>
    </div>
  );
}
