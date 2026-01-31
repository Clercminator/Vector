/// <reference types="vite/client" />

declare module '*.txt' {
  const content: string;
  export default content;
}

declare module '*.txt?raw' {
  const rawContent: string;
  export default rawContent;
}
