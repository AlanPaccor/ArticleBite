import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import React from 'react';
import dynamic from 'next/dynamic';
import { MantineProvider } from '@mantine/core';
import { CookiesBanner } from './components/CookiesBanner';

const ThemeProvider = dynamic(() => import('./contexts/ThemeContext'), { ssr: false });

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Study Star",
  description: "The Best Study App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={dmSans.className}>
        <ThemeProvider>
          <MantineProvider>
            {children}
            <CookiesBanner />
          </MantineProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
