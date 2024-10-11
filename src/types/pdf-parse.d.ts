declare module 'pdf-parse' {
  function parse(_dataBuffer?: Buffer, _options?: {}): Promise<any>;
  export = parse;
}