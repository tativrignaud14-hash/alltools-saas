"use client";

import { useMemo, useState } from "react";

type ToolKey =
  | "merge"
  | "split"
  | "extract-pages"
  | "delete-pages"
  | "reorder"
  | "compress"
  | "images-to-pdf"
  | "pdf-to-images"
  | "watermark"
  | "page-numbers"
  | "rotate"
  | "margins"
  | "crop"
  | "n-up"
  | "cover"
  | "password"
  | "sign"
  | "fill-form"
  | "extract-text"
  | "extract-images"
  | "ocr"
  | "pdf-to-word"
  | "invoice"
  | "quote"
  | "qr-code"
  | "stamp"
  | "summarize-ai"
  | "chat-pdf"
  | "translate"
  | "anonymize"
  | "detect"
  | "extract-tables";

interface ToolConfig {
  key: ToolKey;
  label: string;
  group: string;
  multi?: boolean;
  accepts?: string;
  provider?: boolean;
}

const tools: ToolConfig[] = [
  { key: "merge", label: "Fusionner", group: "Essentiels", multi: true },
  { key: "split", label: "Diviser", group: "Essentiels" },
  { key: "extract-pages", label: "Extraire pages", group: "Essentiels" },
  { key: "delete-pages", label: "Supprimer pages", group: "Essentiels" },
  { key: "reorder", label: "Reorganiser", group: "Essentiels" },
  { key: "compress", label: "Compresser", group: "Essentiels" },
  { key: "images-to-pdf", label: "Images vers PDF", group: "Conversion", multi: true, accepts: "image/jpeg,image/png" },
  { key: "pdf-to-images", label: "PDF vers images", group: "Conversion", provider: true },
  { key: "pdf-to-word", label: "PDF vers Word", group: "Conversion", provider: true },
  { key: "watermark", label: "Watermark", group: "Edition" },
  { key: "page-numbers", label: "Numerotation", group: "Edition" },
  { key: "rotate", label: "Tourner", group: "Edition" },
  { key: "margins", label: "Marges", group: "Edition" },
  { key: "crop", label: "Recadrer", group: "Edition" },
  { key: "n-up", label: "Pages par feuille", group: "Edition" },
  { key: "cover", label: "Page de garde", group: "Edition" },
  { key: "password", label: "Mot de passe", group: "Business" },
  { key: "sign", label: "Signer", group: "Business" },
  { key: "fill-form", label: "Remplir formulaire", group: "Business" },
  { key: "invoice", label: "Generer facture", group: "Business", provider: true },
  { key: "quote", label: "Generer devis", group: "Business", provider: true },
  { key: "qr-code", label: "Ajouter QR code", group: "Business" },
  { key: "stamp", label: "Ajouter tampon", group: "Business" },
  { key: "extract-text", label: "Extraire texte", group: "Analyse", provider: true },
  { key: "extract-images", label: "Extraire images", group: "Analyse", provider: true },
  { key: "ocr", label: "OCR PDF scanne", group: "Analyse", provider: true },
  { key: "extract-tables", label: "Extraire tableaux", group: "Analyse IA", provider: true },
  { key: "summarize-ai", label: "Resumer avec IA", group: "Analyse IA", provider: true },
  { key: "chat-pdf", label: "Chat avec PDF", group: "Analyse IA", provider: true },
  { key: "translate", label: "Traduire PDF", group: "Analyse IA", provider: true },
  { key: "anonymize", label: "Anonymiser", group: "Analyse IA", provider: true },
  { key: "detect", label: "Detecter type", group: "Analyse IA", provider: true },
];

async function sign(filename: string, contentType: string) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Upload refuse");
  }
  return response.json() as Promise<{ url: string; objectUrl: string }>;
}

async function uploadFile(file: File) {
  const { url, objectUrl } = await sign(file.name, file.type || "application/octet-stream");
  const response = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream" } });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Upload impossible pour ${file.name}${details ? `: ${details}` : ""}`);
  }
  return objectUrl;
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

function groupedTools() {
  return tools.reduce<Record<string, ToolConfig[]>>((acc, tool) => {
    acc[tool.group] = acc[tool.group] || [];
    acc[tool.group].push(tool);
    return acc;
  }, {});
}

export default function PdfUploader() {
  const [selectedTool, setSelectedTool] = useState<ToolKey>("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "upload" | "processing" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [pages, setPages] = useState("1-3");
  const [order, setOrder] = useState("1,2,3");
  const [text, setText] = useState("AllTools");
  const [title, setTitle] = useState("Document");
  const [subtitle, setSubtitle] = useState("Genere avec AllTools");
  const [rotation, setRotation] = useState(90);
  const [margin, setMargin] = useState(36);
  const [cropMargin, setCropMargin] = useState(24);
  const [perPage, setPerPage] = useState(2);
  const [password, setPassword] = useState("");

  const groups = useMemo(groupedTools, []);
  const config = tools.find((item) => item.key === selectedTool) || tools[0];
  const disabled = status === "upload" || status === "processing";
  const canRun = files.length > 0 || config.provider || ["invoice", "quote"].includes(selectedTool);
  const accept = config.accepts || "application/pdf";

  function buildOptions(inputUrls: string[]) {
    return {
      tool: selectedTool,
      inputs: inputUrls,
      pages,
      order,
      text,
      title,
      subtitle,
      rotation,
      margin,
      cropMargin,
      perPage,
      password,
    };
  }

  async function run() {
    if (!files.length) return;
    if (config.provider) {
      setStatus("error");
      setMessage("Cet outil est deja dans l'interface, mais il faut ajouter un provider IA/OCR/Office pour l'executer.");
      return;
    }
    if (selectedTool === "merge" && files.length < 2) {
      setStatus("error");
      setMessage("Ajoute au moins deux PDF.");
      return;
    }

    try {
      setOutputUrl(null);
      setStatus("upload");
      setMessage("Upload en cours...");
      const selectedFiles = config.multi ? files : files.slice(0, 1);
      const inputUrls = [];
      for (const file of selectedFiles) inputUrls.push(await uploadFile(file));

      setStatus("processing");
      setMessage("Traitement en cours...");
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedTool === "merge" ? "pdf:merge" : "pdf:tool", inputUrl: inputUrls[0], options: buildOptions(inputUrls) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Traitement PDF impossible");

      const resultUrl = data.result?.outputUrl as string | undefined;
      if (!resultUrl) throw new Error("Resultat PDF manquant");
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
                    setSelectedTool(item.key);
                    setFiles([]);
                    setMessage("");
                    setOutputUrl(null);
                    setStatus("idle");
                  }}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedTool === item.key ? "border-blue-500 bg-blue-600 text-white" : "border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
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
          {config.provider && <span className="rounded-full border border-amber-500 px-3 py-1 text-xs text-amber-300">Provider requis</span>}
        </div>

        <input
          type="file"
          multiple={config.multi}
          accept={accept}
          disabled={disabled}
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
          className="mb-5 block w-full text-sm text-neutral-200"
        />

        {!!files.length && (
          <ul className="mb-5 list-disc space-y-1 pl-5 text-sm text-neutral-400">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`}>{file.name}</li>
            ))}
          </ul>
        )}

        <div className="mb-5 grid gap-4 md:grid-cols-2">
          {["extract-pages", "delete-pages"].includes(selectedTool) && (
            <label className="grid gap-1 text-sm">
              Pages
              <input value={pages} onChange={(event) => setPages(event.target.value)} placeholder="1,3,5-8" className="rounded-lg bg-neutral-950 p-2" />
            </label>
          )}

          {selectedTool === "reorder" && (
            <label className="grid gap-1 text-sm">
              Ordre des pages
              <input value={order} onChange={(event) => setOrder(event.target.value)} placeholder="3,1,2" className="rounded-lg bg-neutral-950 p-2" />
            </label>
          )}

          {["watermark", "stamp", "qr-code"].includes(selectedTool) && (
            <label className="grid gap-1 text-sm">
              Texte
              <input value={text} onChange={(event) => setText(event.target.value)} className="rounded-lg bg-neutral-950 p-2" />
            </label>
          )}

          {selectedTool === "cover" && (
            <>
              <label className="grid gap-1 text-sm">
                Titre
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg bg-neutral-950 p-2" />
              </label>
              <label className="grid gap-1 text-sm">
                Sous-titre
                <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="rounded-lg bg-neutral-950 p-2" />
              </label>
            </>
          )}

          {selectedTool === "rotate" && (
            <label className="grid gap-1 text-sm">
              Rotation
              <select value={rotation} onChange={(event) => setRotation(Number(event.target.value))} className="rounded-lg bg-neutral-950 p-2">
                <option value={90}>90 degres</option>
                <option value={180}>180 degres</option>
                <option value={270}>270 degres</option>
              </select>
            </label>
          )}

          {selectedTool === "margins" && (
            <label className="grid gap-1 text-sm">
              Marge
              <input type="number" value={margin} onChange={(event) => setMargin(Number(event.target.value))} className="rounded-lg bg-neutral-950 p-2" />
            </label>
          )}

          {selectedTool === "crop" && (
            <label className="grid gap-1 text-sm">
              Recadrage
              <input type="number" value={cropMargin} onChange={(event) => setCropMargin(Number(event.target.value))} className="rounded-lg bg-neutral-950 p-2" />
            </label>
          )}

          {selectedTool === "n-up" && (
            <label className="grid gap-1 text-sm">
              Pages par feuille
              <select value={perPage} onChange={(event) => setPerPage(Number(event.target.value))} className="rounded-lg bg-neutral-950 p-2">
                <option value={2}>2</option>
                <option value={4}>4</option>
              </select>
            </label>
          )}

          {selectedTool === "password" && (
            <label className="grid gap-1 text-sm">
              Mot de passe
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-lg bg-neutral-950 p-2" />
            </label>
          )}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!canRun || disabled}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-700"
        >
          {status === "upload" ? "Upload..." : status === "processing" ? "Traitement..." : "Lancer"}
        </button>

        {message && <p className={`mt-4 text-sm ${status === "error" ? "text-red-400" : status === "done" ? "text-green-400" : "text-neutral-400"}`}>{message}</p>}
        {outputUrl && (
          <a href={outputUrl} className="mt-4 inline-flex rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800">
            Telecharger le resultat
          </a>
        )}
      </section>
    </div>
  );
}
