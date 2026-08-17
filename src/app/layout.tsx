import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fence Depot Chain-Link Estimator",
  description: "Chain-link estimating, takeoff, pricing, and contract conversion for Fence Depot.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-100 text-zinc-950">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 rounded-2xl bg-zinc-950 px-6 py-5 text-white shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Fence Depot</p>
                <h1 className="text-3xl font-semibold">Chain-link estimator</h1>
                <p className="mt-1 text-sm text-zinc-300">3045 Pitt Street, Cornwall, Ontario K6K 1A9 · 613-932-0717 · fencedepot@hotmail.com</p>
              </div>
              <nav className="flex gap-3 text-sm font-medium">
                <Link className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20" href="/">Dashboard</Link>
                <Link className="rounded-lg bg-emerald-600 px-3 py-2 hover:bg-emerald-500" href="/estimates/new">New estimate</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
