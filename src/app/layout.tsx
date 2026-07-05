import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIHub - AI应用聚合平台",
  description: "发现、发布和使用优质AI应用，连接开发者与用户",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
};

// CloudBase 部署：构建时没有 DATABASE_URL，
// 强制所有页面走 SSR（动态渲染），不预渲染
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Navbar />
        {/* Mobile: add bottom padding for the bottom nav bar */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        {/* Desktop only footer */}
        <div className="hidden md:block">
          <Footer />
        </div>
        {/* Mobile bottom tab bar */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
