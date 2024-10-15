import Footer from "@/app/sections/Footer";
import UploadAlgebra from "./uploadAlgebra";
import { SecondHeader } from "@/app/sections/SecondHeader";
import getConfig from 'next/config';

export default function Upload() {
  const { publicRuntimeConfig } = getConfig();
  const apiUrl = publicRuntimeConfig.API_URL || 'http://localhost:3001';

  return (
    <>
      <SecondHeader />
      <UploadAlgebra />
      <Footer />
    </>
  );
}
