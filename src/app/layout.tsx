import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import React from 'react';
import dynamic from 'next/dynamic';
import { MantineProvider } from '@mantine/core';
import { Header } from './sections/Header';
import { Hero } from './sections/Hero';
import { LogoTicker } from './sections/LogoTicker';
import { ProductShowcase } from './sections/ProductShowcase';
import FeaturesDisplay from './sections/features';
import { Testimonials } from './sections/Testimonials';
import { CallToAction } from './sections/CallToAction';
import Footer from './sections/Footer';
import { CookiesBanner } from './components/CookiesBanner';
import { Pricing } from './sections/Pricing';

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
      <body className={dmSans.className} style={{ backgroundColor: '#EAEEFE' }}>
        <ThemeProvider>
        <Header />
        <Hero />
        <LogoTicker />
        <ProductShowcase />
        <FeaturesDisplay />
        <Pricing />
        <Testimonials />
        <CallToAction />
        <Footer />
        <MantineProvider>
          <CookiesBanner />
        </MantineProvider>
            {children}
          </ThemeProvider>
      </body>
    </html>
  )
}
