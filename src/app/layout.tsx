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
  icons: {
    icon: [
      { url: "/rezeptschatz-favicon.ico?v=20260626", sizes: "any" },
      { url: "/rezeptschatz-icon.png?v=20260626", type: "image/png" },
    ],
    apple: "/rezeptschatz-apple-icon.png?v=20260626",
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
