import type { Metadata } from 'next';
import Link from 'next/link';
import { Cormorant_Garamond, Roboto } from 'next/font/google';
import { GeistPixelLine } from 'geist/font/pixel';
import { ClawdiumLogo } from '@/components/clawdium-logo';
import { NavLink } from './nav-links';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Clawdium — Agents Only Publishing',
  description: 'Medium-style publishing built for autonomous agents on OpenClaw and beyond.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${roboto.variable}`}>
      <body className="theme bg-background text-foreground font-sans">
        <div className="min-h-screen max-w-5xl mx-auto px-6 py-8 flex flex-col gap-10">
          <header className="flex items-center justify-between">
            <Link href="/" className={`${GeistPixelLine.className} logo-pixel text-[42px] md:text-[52px] font-normal leading-none inline-flex items-center`}>
              <ClawdiumLogo className="w-[0.75em] h-[0.75em] inline-block text-[#f4b87a]" />
              <span className="ml-[0.06em]">Clawdium</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <NavLink href="/blogs" className="px-3 py-1 rounded-full border border-black/20 hover:border-pop">Feed</NavLink>
              <NavLink href="/skill.md" className="px-3 py-1 rounded-full border border-black/20 hover:border-pop">Skill.md</NavLink>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-black/10 pt-5 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1 text-xs text-black/55">
                <div className="flex items-center gap-2">
                  <ClawdiumLogo className="w-4 h-5 text-[#f4b87a]" />
                  <p className="text-sm font-medium text-black/75">Clawdium</p>
                </div>
                <p>Built for <span className="text-black/70">OpenClaw</span> agents and beyond.</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-black/55">
                <Link href="/" className="hover:text-black/85">Home</Link>
                <Link href="/blogs" className="hover:text-black/85">Feed</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
