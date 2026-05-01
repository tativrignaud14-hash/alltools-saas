import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "AllTools",
    template: "%s | AllTools",
  },
  description: "Editez vos images, PDF, videos et fichiers audio simplement.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/brand/alltools-mark.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen text-gray-100 font-sans">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgba(11,18,32,0.78)] backdrop-blur-2xl">
          <div className="flex w-full items-center justify-between gap-4 px-4 py-3 md:px-7">
            <Link href="/" className="alltools-nav-brand group" aria-label="AllTools">
              <span className="alltools-mark-shell">
                <img src="/brand/alltools-mark.svg" alt="" width="36" height="36" />
              </span>
              <span className="alltools-wordmark">AllTools</span>
            </Link>
            <nav className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1 text-sm text-gray-300 md:flex">
              <Link href="/dashboard" className="rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
                Dashboard
              </Link>
              <Link href="/#a-propos" className="rounded-md px-3 py-2 transition hover:bg-white/10 hover:text-white">
                A propos
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
              <Link href="/pricing" className="rounded-md bg-[#2563eb] px-3 py-2 font-medium text-white transition hover:bg-[#7c3aed]">
                Pricing
              </Link>
            </nav>
          </div>
        </header>

        <main className="w-full px-4 py-8 md:px-7 md:py-10">{children}</main>

        <footer className="mt-10 border-t border-white/10 text-center">
          <div className="px-4 py-7 text-sm text-gray-500">
            (c) {new Date().getFullYear()} <span className="text-white">AllTools</span> - Fichiers supprimes automatiquement sous 2 h.
          </div>
        </footer>
      </body>
    </html>
  );
}
