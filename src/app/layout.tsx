import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import React from 'react';
import dynamic from 'next/dynamic';

const ThemeProvider = dynamic(() => import('./contexts/ThemeContext').then(mod => mod.ThemeProvider), { ssr: false });

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Light Saas Landing Page",
  description: "Template created by Frontend Tribe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
