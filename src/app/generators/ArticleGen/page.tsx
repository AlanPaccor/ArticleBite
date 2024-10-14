'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { SecondHeader } from '@/app/sections/SecondHeader';
import Footer from '@/app/sections/Footer';

const UploadPage = dynamic(() => import('./upload'), { ssr: false });

export default function ArticleGenPage() {
  return (
    <div>
      <SecondHeader />
      <UploadPage />
      <Footer />
    </div>
  );
}
