"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";

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
  | "add-text"
  | "add-logo"
  | "redact"
  | "draw-signature"
  | "checkbox"
  | "remove-metadata"
  | "flatten-form"
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
  { key: "add-text", label: "Texte libre", group: "Edition avancee" },
  { key: "add-logo", label: "Image / logo", group: "Edition avancee", multi: true, accepts: "application/pdf,image/jpeg,image/png" },
  { key: "redact", label: "Masquer zone", group: "Edition avancee" },
  { key: "draw-signature", label: "Signature dessinee", group: "Edition avancee" },
  { key: "checkbox", label: "Case a cocher", group: "Edition avancee" },
  { key: "remove-metadata", label: "Nettoyer metadonnees", group: "Edition avancee" },
  { key: "flatten-form", label: "Aplatir formulaire", group: "Edition avancee" },
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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
  const [page, setPage] = useState(1);
  const [x, setX] = useState(64);
  const [y, setY] = useState(120);
  const [boxWidth, setBoxWidth] = useState(220);
  const [boxHeight, setBoxHeight] = useState(80);
  const [checked, setChecked] = useState(true);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const signatureRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const groups = useMemo(groupedTools, []);
  const config = tools.find((item) => item.key === selectedTool) || tools[0];
  const disabled = status === "upload" || status === "processing";
  const canRun = files.length > 0 || config.provider || ["invoice", "quote"].includes(selectedTool);
  const accept = config.accepts || "application/pdf";
  const firstPdfPreview = previewUrls[files.findIndex((file) => file.type === "application/pdf")] || null;

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

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
      page,
      x,
      y,
      boxWidth,
      boxHeight,
      checked,
      signatureData: signatureRef.current?.toDataURL("image/png"),
    };
  }

  function addFiles(nextFiles: File[]) {
    const accepted = nextFiles.filter((file) => accept.split(",").some((type) => file.type === type || (type.endsWith("/*") && file.type.startsWith(type.slice(0, -1)))));
    setFiles((prev) => (config.multi ? [...prev, ...accepted] : accepted.slice(0, 1)));
    setOutputUrl(null);
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

  function clearSignature() {
    const canvas = signatureRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawSignature(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = signatureRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !drawingRef.current) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111111";
    ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    ctx.stroke();
  }

  async function run() {
    if (config.provider) {
      setStatus("error");
      setMessage("Cet outil est deja dans l'interface, mais il faut ajouter un provider IA/OCR/Office pour l'executer.");
      return;
    }
    if (!files.length) return;
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
                  onClick={() => {
                    setSelectedTool(item.key);
                    setFiles([]);
                    setMessage("");
                    setOutputUrl(null);
                    setStatus("idle");
                  }}
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
            <p className="text-sm text-neutral-400">{config.multi ? "Selection multiple acceptee" : "Un fichier a la fois"}</p>
          </div>
          {config.provider && <span className="status-pill">Provider requis</span>}
        </div>

        <input
          type="file"
          multiple={config.multi}
          accept={accept}
          disabled={disabled}
          onChange={(event) => addFiles(Array.from(event.target.files || []))}
          className="sr-only"
          id="pdf-file-input"
        />

        <label
          htmlFor="pdf-file-input"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(Array.from(event.dataTransfer.files || []));
          }}
          className="drop-zone"
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
                className="file-card flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="truncate">{index + 1}. {file.name}</span>
                <span className="text-xs text-neutral-500">glisser</span>
              </li>
            ))}
          </ul>
        )}

        {firstPdfPreview && (
          <div className="preview-card mb-5 overflow-hidden">
            <div className="border-b border-neutral-800 px-3 py-2 text-xs uppercase text-neutral-500">Previsualisation</div>
            <iframe src={firstPdfPreview} className="h-[420px] w-full bg-white" title="Previsualisation PDF" />
          </div>
        )}

        <div className="control-grid md:grid-cols-2">
          {["extract-pages", "delete-pages"].includes(selectedTool) && (
            <label className="control-label">
              Pages
              <input value={pages} onChange={(event) => setPages(event.target.value)} placeholder="1,3,5-8" className="control-input" />
            </label>
          )}

          {selectedTool === "reorder" && (
            <label className="control-label">
              Ordre des pages
              <input value={order} onChange={(event) => setOrder(event.target.value)} placeholder="3,1,2" className="control-input" />
            </label>
          )}

          {["watermark", "stamp", "qr-code"].includes(selectedTool) && (
            <label className="control-label">
              Texte
              <input value={text} onChange={(event) => setText(event.target.value)} className="control-input" />
            </label>
          )}

          {["add-text", "redact", "draw-signature", "checkbox", "add-logo"].includes(selectedTool) && (
            <>
              <label className="control-label">
                Page
                <input type="number" min={1} value={page} onChange={(event) => setPage(Number(event.target.value))} className="control-input" />
              </label>
              <label className="control-label">
                Position X
                <input type="number" value={x} onChange={(event) => setX(Number(event.target.value))} className="control-input" />
              </label>
              <label className="control-label">
                Position Y
                <input type="number" value={y} onChange={(event) => setY(Number(event.target.value))} className="control-input" />
              </label>
              <label className="control-label">
                Largeur
                <input type="number" value={boxWidth} onChange={(event) => setBoxWidth(Number(event.target.value))} className="control-input" />
              </label>
            </>
          )}

          {["redact"].includes(selectedTool) && (
            <label className="control-label">
              Hauteur
              <input type="number" value={boxHeight} onChange={(event) => setBoxHeight(Number(event.target.value))} className="control-input" />
            </label>
          )}

          {["add-text", "checkbox", "fill-form", "sign"].includes(selectedTool) && (
            <label className="control-label">
              Texte
              <input value={text} onChange={(event) => setText(event.target.value)} className="control-input" />
            </label>
          )}

          {selectedTool === "checkbox" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
              Cochee
            </label>
          )}

          {selectedTool === "draw-signature" && (
            <div className="md:col-span-2">
              <canvas
                ref={signatureRef}
                width={520}
                height={160}
                onPointerDown={(event) => {
                  drawingRef.current = true;
                  const ctx = signatureRef.current?.getContext("2d");
                  const rect = signatureRef.current?.getBoundingClientRect();
                  if (ctx && rect) {
                    ctx.beginPath();
                    ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
                  }
                }}
                onPointerMove={drawSignature}
                onPointerUp={() => {
                  drawingRef.current = false;
                }}
                onPointerLeave={() => {
                  drawingRef.current = false;
                }}
                className="h-40 w-full touch-none rounded-lg bg-white"
              />
              <button type="button" onClick={clearSignature} className="mt-2 rounded-lg border border-neutral-700 px-3 py-1 text-sm hover:bg-neutral-800">
                Effacer signature
              </button>
            </div>
          )}

          {selectedTool === "cover" && (
            <>
              <label className="control-label">
                Titre
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="control-input" />
              </label>
              <label className="control-label">
                Sous-titre
                <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="control-input" />
              </label>
            </>
          )}

          {selectedTool === "rotate" && (
            <label className="control-label">
              Rotation
              <select value={rotation} onChange={(event) => setRotation(Number(event.target.value))} className="control-input">
                <option value={90}>90 degres</option>
                <option value={180}>180 degres</option>
                <option value={270}>270 degres</option>
              </select>
            </label>
          )}

          {selectedTool === "margins" && (
            <label className="control-label">
              Marge
              <input type="number" value={margin} onChange={(event) => setMargin(Number(event.target.value))} className="control-input" />
            </label>
          )}

          {selectedTool === "crop" && (
            <label className="control-label">
              Recadrage
              <input type="number" value={cropMargin} onChange={(event) => setCropMargin(Number(event.target.value))} className="control-input" />
            </label>
          )}

          {selectedTool === "n-up" && (
            <label className="control-label">
              Pages par feuille
              <select value={perPage} onChange={(event) => setPerPage(Number(event.target.value))} className="control-input">
                <option value={2}>2</option>
                <option value={4}>4</option>
              </select>
            </label>
          )}

          {selectedTool === "password" && (
            <label className="control-label">
              Mot de passe
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="control-input" />
            </label>
          )}
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!canRun || disabled}
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
