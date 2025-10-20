/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { User } from '@prisma/client';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      csrfToken?: string;
    }
  }
}

export {};
