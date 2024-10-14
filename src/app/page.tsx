// pages/index.tsx

import React from 'react';
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

export default function Home() {
  return (
    <div style={{ backgroundColor: '#EAEEFE' }}>
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
    </div>
  );
}
