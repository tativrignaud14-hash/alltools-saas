import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-neutral-950 text-gray-100 font-sans">
        <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold text-white text-lg">
              AllTools
            </Link>
            <nav className="flex gap-6 text-sm text-gray-300">
              <Link href="/dashboard" className="hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/tools/image" className="hover:text-white transition">
                Image
              </Link>
              <Link href="/tools/video" className="hover:text-white transition">
                Video
              </Link>
              <Link href="/tools/pdf" className="hover:text-white transition">
                PDF
              </Link>
              <Link href="/tools/audio" className="hover:text-white transition">
                Audio
              </Link>
              <Link href="/pricing" className="hover:text-white transition">
                Pricing
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>

        <footer className="border-t border-neutral-800 mt-12 text-center">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
            (c) {new Date().getFullYear()} <span className="text-white">AllTools</span> - Fichiers supprimes
            automatiquement sous 2 h.
          </div>
        </footer>
      </body>
    </html>
  );
}
