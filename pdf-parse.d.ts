declare module 'pdf-parse/lib/pdf-parse' {
  function pdf(dataBuffer: Buffer, options?: any): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }>;

  export = pdf;
}

declare module 'pdf-parse' {
  export = pdf;
}
