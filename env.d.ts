/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    JUDGE_ME_PRIVATE_API_TOKEN?: string;
    JUDGE_ME_PUBLIC_API_TOKEN?: string;
    INSTAFEED_API_KEY?: string;
  }
}
