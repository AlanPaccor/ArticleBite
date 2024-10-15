'use client';

import React from 'react';
import Footer from "@/app/sections/Footer";
import UploadArticle from "./uploadArticle";
import { SecondHeader } from "@/app/sections/SecondHeader";
import getConfig from 'next/config';

export default function ArticleGen() {
  const { publicRuntimeConfig } = getConfig();
  const apiUrl = publicRuntimeConfig.API_URL || 'http://localhost:3005';

  return (
    <>
      <SecondHeader />
      <UploadArticle apiUrl={apiUrl} />
      <Footer />
    </>
  );
}
