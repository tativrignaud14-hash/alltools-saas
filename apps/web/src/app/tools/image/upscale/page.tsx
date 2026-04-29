import ImageUploader from "@/app/tools/image/ImageUploader";

export default function UpscalePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white p-10">
      <h1 className="text-3xl font-bold mb-6">Ameliorer la resolution</h1>
      <p className="text-gray-400 mb-8">Agrandissez une image avec un redimensionnement propre cote worker.</p>
      <ImageUploader tool="upscale" />
    </main>
  );
}
