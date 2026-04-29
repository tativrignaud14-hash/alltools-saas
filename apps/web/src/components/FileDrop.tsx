"use client";
import { useRef, useState } from "react";

export function FileDrop({ onPicked }: { onPicked: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files?.[0]; if (f) onPicked(f);
      }}
      className={"border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer " + (dragging ? "bg-gray-50" : "")}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0]; if (f) onPicked(f);
      }} />
      <div className="font-medium mb-2">Dépose ton fichier ici</div>
      <div className="text-sm text-gray-500">ou clique pour parcourir</div>
    </div>
  );
}
