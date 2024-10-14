'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const UploadPage = dynamic(() => import('./upload'), { ssr: false });

export default function ArticleGenPage() {
  return (
    <div>
      <h1>Article Generator</h1>
      <UploadPage />
    </div>
  );
}
