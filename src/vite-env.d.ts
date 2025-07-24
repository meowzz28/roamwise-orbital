/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_KEY_OPENAI: string;
    readonly VITE_API_KEY_FIREBASE: string;
    readonly VITE_API_KEY_CURRENCY: string;
    readonly VITE_API_KEY_WEATHER: string;
    readonly VITE_API_KEY_MAPS_API: string;
    // Add other VITE_ variables here as needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  