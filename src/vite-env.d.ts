/// <reference types="vite/client" />

declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.md?raw' {
  const rawContent: string;
  export default rawContent;
}
