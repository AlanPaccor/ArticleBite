import Footer from "@/app/sections/Footer";
import UploadAlgebra from "./uploadAlgebra";
import { SecondHeader } from "@/app/sections/SecondHeader";
import getConfig from 'next/config';

const AlgebraGenerator: React.FC = () => {
  const { publicRuntimeConfig } = getConfig();
  const apiUrl = publicRuntimeConfig.API_URL || 'http://localhost:3001';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/generate-algebra`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate algebra content');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      setError('An error occurred while generating content. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SecondHeader />
      <UploadAlgebra />
      <Footer />
    </>
  );
};

export default AlgebraGenerator;
