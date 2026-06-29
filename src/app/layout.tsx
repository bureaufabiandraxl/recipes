import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const anitaSans = localFont({
  src: [
    {
      path: "./fonts/AnitaSans-VariableVF.ttf",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-anita-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mariannes Rezept-Schatz",
  description:
    "Handschriftliche Rezeptkarten aus Omas Küche – neu interpretiert und modern umgesetzt.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Rezeptschatz",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png", sizes: "96x96" },
    ],
    apple: "/apple-icon.png",
  },
  other: {
    "apple-mobile-web-app-title": "Rezeptschatz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${anitaSans.className} ${anitaSans.variable} antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]`}
      >
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
