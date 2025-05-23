import type { Metadata } from "next";
import "./globals.css";
import { Roboto_Mono } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ASCII Art Generator",
  description: "Convert images into ASCII Art",
};

const roboto = Roboto_Mono({
  subsets: ['latin']
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.className}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
