import MediaUploader from "../media/MediaUploader";
import { FreemiumNotice } from "@/components/FreemiumNotice";

export default function VideoToolsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Atelier video complet</h1>
        <p className="mt-4 max-w-4xl text-neutral-400">
          Compression, conversion, decoupe, fusion, GIF, frames, watermark, sous-titres et export.
        </p>
      </section>
      <FreemiumNotice heavy />
      <MediaUploader kind="video" />
    </div>
  );
}
