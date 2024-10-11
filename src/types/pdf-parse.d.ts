declare module 'pdf-parse' {
  function parse(dataBuffer?: Buffer, options?: {}): Promise<any>;
  export = parse;
}