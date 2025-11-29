declare module 'dotenv-safe' {
  interface Options {
    allowEmptyValues?: boolean;
    example?: string;
    path?: string;
  }
  const dotenvSafe: { config(options?: Options): void };
  export default dotenvSafe;
}