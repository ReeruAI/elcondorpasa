import type { Metadata } from "next";
import "./globals.css";
import { StrictMode } from "react";

import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ReeruAI",
  description: "ReeruAI - Making Short Easier",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <StrictMode>
          <main className="">{children}</main>
        </StrictMode>
      </body>
    </html>
  );
}
