/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { User } from '@prisma/client';

declare namespace App {
  interface Locals {
    user: User | null;
    csrfToken?: string;
  }
}
