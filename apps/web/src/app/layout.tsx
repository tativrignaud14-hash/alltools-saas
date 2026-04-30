import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen text-gray-100 font-sans">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08090a]/82 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="group flex items-center gap-3 font-semibold text-white">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white text-sm font-black text-black transition group-hover:scale-105">
                A
              </span>
              <span className="text-lg tracking-tight">AllTools</span>
            </Link>
            <nav className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1 text-sm text-gray-300 md:flex">
              <Link href="/dashboard" className="rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Dashboard
              </Link>
              <Link href="/tools/image" className="rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Image
              </Link>
              <Link href="/tools/video" className="rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Video
              </Link>
              <Link href="/tools/pdf" className="rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
                PDF
              </Link>
              <Link href="/tools/audio" className="rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Audio
              </Link>
              <Link href="/pricing" className="rounded-md bg-white px-3 py-2 font-medium text-black transition hover:bg-blue-200">
                Pricing
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-10 md:py-14">{children}</main>

        <footer className="mt-16 border-t border-white/10 text-center">
          <div className="mx-auto max-w-7xl px-4 py-7 text-sm text-gray-500">
            (c) {new Date().getFullYear()} <span className="text-white">AllTools</span> - Fichiers supprimes automatiquement sous 2 h.
          </div>
        </footer>
      </body>
    </html>
  );
}
