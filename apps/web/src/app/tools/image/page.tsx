import ImageUploader from "@/app/tools/image/ImageUploader";

export default function ImageToolsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Atelier image complet</h1>
        <p className="max-w-3xl text-neutral-400">
          Conversion, compression, resize, crop, lots ZIP, watermark, fond, reseaux sociaux, e-commerce, EXIF,
          palette, floutage, pixelisation et outils IA.
        </p>
      </div>
      <ImageUploader tool="convert" />
    </main>
  );
}
