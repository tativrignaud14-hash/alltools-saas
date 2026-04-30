import PdfUploader from "./PdfUploader";

export default function PdfToolsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Atelier PDF complet</h1>
        <p className="mt-4 max-w-4xl text-neutral-400">
          Fusion, division, pages, watermark, numerotation, conversion, business, analyse et outils IA.
        </p>
      </section>
      <PdfUploader />
    </div>
  );
}
