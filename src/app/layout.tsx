import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "LinkedIn Hook LLM Evaluator",
  description: "Compare GPT-4o and GPT-4.1 for generating high-quality LinkedIn post hooks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-background text-foreground min-h-screen`}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#1a1b1e]">
          {children}
        </div>
      </body>
    </html>
  );
}
