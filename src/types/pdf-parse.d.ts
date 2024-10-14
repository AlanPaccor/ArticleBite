declare module 'pdf-parse' {
  interface PDFData {
    // Define the structure of PDFData here
    text: string;
    // Add other properties as needed
  }

  function parse(dataBuffer: Buffer, options?: any): Promise<PDFData>;
  export = parse;
}
