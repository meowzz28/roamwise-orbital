/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_KEY_OPENAI: string;
    // Add other VITE_ variables here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  