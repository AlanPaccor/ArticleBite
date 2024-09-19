// pages/index.tsx

import { MantineProvider } from "@mantine/core";
import { CookiesBanner } from "./components/CookiesBanner";
import { CallToAction } from "./sections/CallToAction";
import { Hero } from "./sections/Hero";
import { LogoTicker } from "./sections/LogoTicker";
import { Pricing } from "./sections/Pricing";
import { ProductShowcase } from "./sections/ProductShowcase";
import { Testimonials } from "./sections/Testimonials";
import FeaturesDisplay from "./sections/features";
import Footer from "./sections/Footer";
import { Header } from "./sections/Header";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <LogoTicker />
      <ProductShowcase />
      <FeaturesDisplay/>
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
