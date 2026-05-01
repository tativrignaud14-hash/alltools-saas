"use client";

import { useEffect, useMemo, useState } from "react";

type ToolKey =
  | "convert"
  | "compress"
  | "remove-bg"
  | "upscale"
  | "resize"
  | "crop"
  | "batch-convert"
  | "batch-compress"
  | "background"
  | "watermark"
  | "social"
  | "favicon"
  | "palette"
  | "strip-exif"
  | "blur"
  | "pixelate"
  | "marketplace"
  | "weight-target"
  | "auto-enhance"
  | "denoise"
  | "restore"
  | "before-after"
  | "mockup"
  | "rename"
  | "social-pack"
  | "colorize"
  | "product-background-ai";

interface ToolConfig {
  key: ToolKey;
  label: string;
  group: string;
  multi?: boolean;
  aiExternal?: boolean;
  localAi?: boolean;
}

const tools: ToolConfig[] = [
  { key: "convert", label: "Convertir", group: "Essentiels" },
  { key: "compress", label: "Compresser", group: "Essentiels" },
  { key: "resize", label: "Redimensionner", group: "Essentiels" },
  { key: "crop", label: "Recadrer", group: "Essentiels" },
  { key: "batch-convert", label: "Convertir en lot", group: "Lot", multi: true },
  { key: "batch-compress", label: "Compresser en lot", group: "Lot", multi: true },
  { key: "background", label: "Changer le fond", group: "Edition" },
  { key: "watermark", label: "Watermark", group: "Edition" },
  { key: "social", label: "Formats sociaux", group: "Edition" },
  { key: "favicon", label: "Favicons", group: "Edition" },
  { key: "palette", label: "Palette couleurs", group: "Analyse" },
  { key: "strip-exif", label: "Supprimer EXIF", group: "Analyse" },
  { key: "blur", label: "Flouter une zone", group: "Confidentialite" },
  { key: "pixelate", label: "Pixeliser une zone", group: "Confidentialite" },
  { key: "weight-target", label: "Poids cible", group: "Export" },
  { key: "marketplace", label: "Pack marketplace", group: "E-commerce" },
  { key: "before-after", label: "Apercu avant/apres", group: "Workflow" },
  { key: "rename", label: "Renommage auto", group: "Workflow" },
  { key: "social-pack", label: "Pack social ZIP", group: "Workflow", multi: true },
  { key: "mockup", label: "Mockup produit", group: "Workflow", aiExternal: true },
  { key: "remove-bg", label: "Supprimer fond IA", group: "IA locale", localAi: true },
  { key: "upscale", label: "Upscale local", group: "IA locale", localAi: true },
  { key: "auto-enhance", label: "Amelioration auto", group: "IA locale", localAi: true },
  { key: "denoise", label: "Debruitage", group: "IA locale", localAi: true },
  { key: "restore", label: "Restauration photo", group: "IA locale", localAi: true },
  { key: "colorize", label: "Colorisation", group: "IA", aiExternal: true },
  { key: "product-background-ai", label: "Fond produit IA", group: "IA", aiExternal: true },
];

const directJobs: Partial<Record<ToolKey, string>> = {
  convert: "image:convert",
  compress: "image:compress",
  "remove-bg": "image:remove-bg",
  upscale: "image:upscale",
};

const formatOptions = ["webp", "jpeg", "png", "avif"];
const socialOptions = ["instagram-square", "instagram-portrait", "instagram-story", "tiktok", "youtube-thumbnail", "linkedin-post", "x-post"];
const marketplaceOptions = ["shopify", "amazon", "etsy", "thumbnail"];

async function sign(filename: string, contentType: string) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Upload refused");
  }
  return response.json() as Promise<{ url: string; objectUrl: string }>;
}

async function uploadFile(file: File) {
  const { url, objectUrl } = await sign(file.name, file.type);
  const response = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Upload failed for ${file.name}${details ? `: ${details}` : ""}`);
  }
  return objectUrl;
}

async function createJob(type: string, inputUrl: string, options: Record<string, unknown>) {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, inputUrl, options }),
  });
  if (!response.ok) throw new Error("Job creation failed");
  return response.json() as Promise<{ id: string; result?: { outputUrl?: string } }>;
}

async function pollJob(id: string) {
  for (let tries = 0; tries < 120; tries++) {
    const response = await fetch(`/api/jobs/${id}`);
    const data = await response.json();
    if (data.state === "completed" && data.result?.outputUrl) return data.result.outputUrl as string;
    if (data.state === "failed") throw new Error(data.failedReason || "Processing failed");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Processing timed out");
}

function downloadResult(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = "";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function canvasFromFile(file: File, scale = 1) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas indisponible sur ce navigateur.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { canvas, context };
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

function enhanceImageData(imageData: ImageData, mode: "enhance" | "denoise" | "restore") {
  const data = imageData.data;
  const contrast = mode === "restore" ? 1.22 : 1.12;
  const saturation = mode === "denoise" ? 0.96 : 1.1;
  const brightness = mode === "restore" ? 9 : 3;

  for (let index = 0; index < data.length; index += 4) {
    let red = data[index];
    let green = data[index + 1];
    let blue = data[index + 2];

    if (mode === "restore") {
      const gray = red * 0.299 + green * 0.587 + blue * 0.114;
      red = gray + (red - gray) * 1.08;
      green = gray + (green - gray) * 1.04;
      blue = gray + (blue - gray) * 0.98;
    }

    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
    red = luminance + (red - luminance) * saturation;
    green = luminance + (green - luminance) * saturation;
    blue = luminance + (blue - luminance) * saturation;

    data[index] = clampChannel((red - 128) * contrast + 128 + brightness);
    data[index + 1] = clampChannel((green - 128) * contrast + 128 + brightness);
    data[index + 2] = clampChannel((blue - 128) * contrast + 128 + brightness);
  }

  return imageData;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number) {
  const mime = format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp";
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Export image impossible."));
        else resolve(blob);
      },
      mime,
      Math.max(0.01, Math.min(1, quality / 100)),
    );
  });
}

async function runLocalAiTool(file: File, tool: ToolKey, format: string, quality: number) {
  if (tool === "remove-bg") {
    const importFromUrl = new Function("url", "return import(url)") as (url: string) => Promise<{
      removeBackground: (image: File) => Promise<Blob>;
    }>;
    const { removeBackground } = await importFromUrl("https://esm.sh/@imgly/background-removal@1.7.0");
    return removeBackground(file);
  }

  const scale = tool === "upscale" ? 2 : 1;
  const { canvas, context } = await canvasFromFile(file, scale);

  if (tool === "denoise") {
    context.filter = "blur(0.45px)";
    context.drawImage(canvas, 0, 0);
    context.filter = "none";
  }

  if (tool === "auto-enhance" || tool === "denoise" || tool === "restore") {
    const data = context.getImageData(0, 0, canvas.width, canvas.height);
    context.putImageData(enhanceImageData(data, tool === "auto-enhance" ? "enhance" : tool), 0, 0);
  }

  return canvasToBlob(canvas, format, quality);
}

function groupedTools() {
  return tools.reduce<Record<string, ToolConfig[]>>((acc, tool) => {
    acc[tool.group] = acc[tool.group] || [];
    acc[tool.group].push(tool);
    return acc;
  }, {});
}

export default function ImageUploader({ tool = "convert" }: { tool?: ToolKey }) {
  const [selectedTool, setSelectedTool] = useState<ToolKey>(tool);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "upload" | "processing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [localOutputUrl, setLocalOutputUrl] = useState<string | null>(null);
  const groups = useMemo(groupedTools, []);
  const config = tools.find((item) => item.key === selectedTool) || tools[0];

  const [format, setFormat] = useState("webp");
  const [quality, setQuality] = useState(82);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(1200);
  const [background, setBackground] = useState("#ffffff");
  const [watermarkText, setWatermarkText] = useState("AllTools");
  const [preset, setPreset] = useState("instagram-square");
  const [marketplacePreset, setMarketplacePreset] = useState("shopify");
  const [targetKb, setTargetKb] = useState(500);
  const [outputName, setOutputName] = useState("alltools-result");
  const [zone, setZone] = useState({ x: 0, y: 0, w: 400, h: 300 });

  const disabled = status === "upload" || status === "processing";

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    return () => {
      if (localOutputUrl) URL.revokeObjectURL(localOutputUrl);
    };
  }, [localOutputUrl]);

  function buildOptions(inputUrls: string[]) {
    const toolName = selectedTool;
    const options: Record<string, unknown> = {
      tool: toolName,
      format,
      outputFormat: format,
      quality,
      inputs: inputUrls,
    };

    if (toolName === "resize") Object.assign(options, { width, height, fit: "inside" });
    if (toolName === "crop") Object.assign(options, { aspect: preset });
    if (toolName === "social") Object.assign(options, { preset });
    if (toolName === "marketplace") Object.assign(options, { preset: marketplacePreset, background });
    if (toolName === "background") Object.assign(options, { background });
    if (toolName === "watermark") Object.assign(options, { watermarkText, gravity: "southeast", opacity: 0.45 });
    if (toolName === "weight-target" || toolName === "batch-compress") Object.assign(options, { targetKb });
    if (toolName === "blur" || toolName === "pixelate") Object.assign(options, { ...zone, zoneTool: toolName });
    if (toolName === "compress") Object.assign(options, { quality });
    if (toolName === "convert") Object.assign(options, { outputFormat: format, quality });
    if (toolName === "upscale") Object.assign(options, { scale: 2 });
    if (toolName === "before-after" || toolName === "rename") Object.assign(options, { tool: "convert", outputName });
    if (toolName === "social-pack") Object.assign(options, { tool: "batch-convert", format, outputFormat: format });

    return options;
  }

  function addFiles(nextFiles: File[]) {
    const accepted = nextFiles.filter((file) => file.type.startsWith("image/"));
    setFiles((prev) => (config.multi ? [...prev, ...accepted] : accepted.slice(0, 1)));
    setOutputUrl(null);
    if (localOutputUrl) URL.revokeObjectURL(localOutputUrl);
    setLocalOutputUrl(null);
    setMessage("");
    setStatus("idle");
  }

  function moveFile(from: number, to: number) {
    setFiles((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  async function run() {
    if (!files.length) return;
    if (config.aiExternal) {
      setStatus("error");
      setMessage("Cet outil est branche dans l'interface, mais il faut ajouter un provider IA image pour l'executer.");
      return;
    }

    try {
      setOutputUrl(null);
      if (localOutputUrl) URL.revokeObjectURL(localOutputUrl);
      setLocalOutputUrl(null);

      if (config.localAi) {
        setStatus("processing");
        setMessage(selectedTool === "remove-bg" ? "Chargement de l'IA locale dans le navigateur..." : "Traitement local en cours...");
        const blob = await runLocalAiTool(files[0], selectedTool, format, quality);
        const resultUrl = URL.createObjectURL(blob);
        setLocalOutputUrl(resultUrl);
        setOutputUrl(resultUrl);
        setStatus("done");
        setMessage("Resultat pret. Traitement fait sur ton appareil, sans cout serveur.");
        downloadResult(resultUrl);
        return;
      }

      setStatus("upload");
      setMessage("Upload en cours...");

      const selectedFiles = config.multi ? files : files.slice(0, 1);
      const inputUrls = [];
      for (const file of selectedFiles) {
        inputUrls.push(await uploadFile(file));
      }

      setStatus("processing");
      setMessage("Traitement en cours...");

      const type = directJobs[selectedTool] || "image:tool";
      const options = buildOptions(inputUrls);
      const job = await createJob(type, inputUrls[0], options);
      const resultUrl = job.result?.outputUrl || (await pollJob(job.id));

      setOutputUrl(resultUrl);
      setStatus("done");
      setMessage("Resultat pret. Telechargement lance automatiquement.");
      downloadResult(resultUrl);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erreur pendant le traitement.");
    }
  }

  return (
    <div className="tool-workspace">
      <aside className="tool-sidebar space-y-5">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group}>
            <div className="tool-group-title">{group}</div>
            <div className="grid gap-2">
              {items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedTool(item.key)}
                  className={`tool-tab ${selectedTool === item.key ? "tool-tab-active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <section className="tool-surface">
        <div className="tool-heading">
          <div>
            <h2 className="text-xl font-semibold">{config.label}</h2>
            <p className="text-sm text-neutral-400">{config.localAi ? "IA dans le navigateur, sans cout serveur" : config.multi ? "Selection multiple acceptee" : "Une image a la fois"}</p>
          </div>
          {config.localAi && <span className="status-pill">IA locale gratuite</span>}
          {config.aiExternal && <span className="status-pill">Provider IA requis</span>}
        </div>

        <input
          id="image-file-input"
          type="file"
          multiple={config.multi}
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={disabled}
          onChange={(event) => addFiles(Array.from(event.target.files || []))}
          className="sr-only"
        />

        <label
          htmlFor="image-file-input"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(Array.from(event.dataTransfer.files || []));
          }}
          className="drop-zone"
        >
          Deposer les images ici ou cliquer pour choisir
        </label>

        {!!files.length && (
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedIndex !== null) moveFile(draggedIndex, index);
                  setDraggedIndex(null);
                }}
                className="file-card p-3"
              >
                {previewUrls[index] && <img src={previewUrls[index]} alt="" className="mb-3 aspect-video w-full rounded bg-black object-contain" />}
                <div className="truncate text-sm text-neutral-300">{index + 1}. {file.name}</div>
                <div className="text-xs text-neutral-500">glisser pour reorganiser</div>
              </div>
            ))}
          </div>
        )}

        {previewUrls[0] && outputUrl && (
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <div className="preview-card p-3">
              <div className="mb-2 text-xs uppercase text-neutral-500">Avant</div>
              <img src={previewUrls[0]} alt="" className="aspect-video w-full object-contain" />
            </div>
            <div className="preview-card p-3">
              <div className="mb-2 text-xs uppercase text-neutral-500">Apres</div>
              <img src={outputUrl} alt="" className="aspect-video w-full object-contain" />
            </div>
          </div>
        )}

        <div className="control-grid md:grid-cols-2">
          {["convert", "batch-convert", "compress", "batch-compress", "resize", "crop", "social", "watermark", "weight-target", "auto-enhance", "denoise", "restore"].includes(selectedTool) && (
            <label className="control-label">
              Format
              <select value={format} onChange={(event) => setFormat(event.target.value)} className="control-input">
                {formatOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}

          {["convert", "compress", "batch-convert", "batch-compress", "watermark", "weight-target"].includes(selectedTool) && (
            <label className="control-label">
              Qualite
              <input type="number" min={1} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="control-input" />
            </label>
          )}

          {selectedTool === "resize" && (
            <>
              <label className="control-label">
                Largeur
                <input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value))} className="control-input" />
              </label>
              <label className="control-label">
                Hauteur
                <input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value))} className="control-input" />
              </label>
            </>
          )}

          {["crop", "social"].includes(selectedTool) && (
            <label className="control-label">
              Preset
              <select value={preset} onChange={(event) => setPreset(event.target.value)} className="control-input">
                {socialOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}

          {selectedTool === "marketplace" && (
            <label className="control-label">
              Marketplace
              <select value={marketplacePreset} onChange={(event) => setMarketplacePreset(event.target.value)} className="control-input">
                {marketplaceOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}

          {["background", "marketplace"].includes(selectedTool) && (
            <label className="control-label">
              Couleur de fond
              <input type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="control-input h-11 p-1" />
            </label>
          )}

          {selectedTool === "watermark" && (
            <label className="control-label">
              Texte watermark
              <input value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} className="control-input" />
            </label>
          )}

          {selectedTool === "weight-target" && (
            <label className="control-label">
              Poids cible KB
              <input type="number" min={10} value={targetKb} onChange={(event) => setTargetKb(Number(event.target.value))} className="control-input" />
            </label>
          )}

          {selectedTool === "rename" && (
            <label className="control-label">
              Nom de sortie
              <input value={outputName} onChange={(event) => setOutputName(event.target.value)} className="control-input" />
            </label>
          )}

          {["blur", "pixelate"].includes(selectedTool) && (
            <>
              {(["x", "y", "w", "h"] as const).map((key) => (
                <label key={key} className="control-label">
                  Zone {key}
                  <input type="number" value={zone[key]} onChange={(event) => setZone((prev) => ({ ...prev, [key]: Number(event.target.value) }))} className="control-input" />
                </label>
              ))}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!files.length || disabled}
          className="run-button"
        >
          {status === "upload" ? "Upload..." : status === "processing" ? "Traitement..." : "Lancer"}
        </button>

        {message && <p className={`mt-4 text-sm ${status === "error" ? "text-red-400" : status === "done" ? "text-green-400" : "text-neutral-400"}`}>{message}</p>}
        {outputUrl && (
          <a href={outputUrl} className="result-link">
            Telecharger le resultat
          </a>
        )}
      </section>
    </div>
  );
}
