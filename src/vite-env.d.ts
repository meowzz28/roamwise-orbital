/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_KEY_OPENAI: string;
    readonly VITE_API_KEY_FIREBASE: string;
    // Add other VITE_ variables here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  