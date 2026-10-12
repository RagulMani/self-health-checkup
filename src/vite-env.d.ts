/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public origin of the linked API service; empty = same origin (dev proxy). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
