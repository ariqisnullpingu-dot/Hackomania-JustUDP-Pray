import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DisasterAid - Emergency Fund Platform",
  description:
    "Community-driven emergency fund platform for disaster relief donations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
