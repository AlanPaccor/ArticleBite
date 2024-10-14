declare module 'pdf-parse' {
  function parse(_: Buffer, __?: any): Promise<PDFData>;
  export = parse;
}
