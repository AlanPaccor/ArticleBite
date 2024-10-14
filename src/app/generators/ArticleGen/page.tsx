'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SecondHeader } from '@/app/sections/SecondHeader';
import Footer from '@/app/sections/Footer';

const UploadPage = dynamic(() => import('./upload'), { 
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const ArticleGenPage: React.FC = () => {
  useEffect(() => {
    console.log('ArticleGenPage mounted');
  }, []);

  return (
    <div>
      <SecondHeader />
      <UploadPage />
      <Footer />
    </div>
  );
};

export default ArticleGenPage;
