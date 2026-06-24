import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const anitaSans = localFont({
  src: "./fonts/AnitaSans-VariableVF.ttf",
  variable: "--font-anita-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mariannes Rezept-Schatz",
  description:
    "Handschriftliche Rezeptkarten aus Omas Küche – neu interpretiert und modern umgesetzt.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
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
