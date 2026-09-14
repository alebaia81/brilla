/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    STORAGE: R2Bucket;
    PUBLIC_R2_URL?: string;
    R2_PUBLIC_URL?: string;
  }
}
