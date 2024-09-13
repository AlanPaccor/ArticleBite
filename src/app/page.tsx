// pages/index.tsx

import { CookiesBanner } from "./components/CookiesBanner";
import { CallToAction } from "./sections/CallToAction";
import { Footer } from "./sections/Footer";
import { Header } from "./sections/Header";
import { Hero } from "./sections/Hero";
import { LogoTicker } from "./sections/LogoTicker";
import { Pricing } from "./sections/Pricing";
import { ProductShowcase } from "./sections/ProductShowcase";
import { Testimonials } from "./sections/Testimonials";
import { MantineProvider } from '@mantine/core';

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <LogoTicker />
      <ProductShowcase />
      <Pricing />
      <Testimonials />
      <CallToAction />
      <Footer />
      <MantineProvider>
        <CookiesBanner/>
      </MantineProvider>
      
    </>
  );
}
