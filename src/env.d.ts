/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import pkg from '@prisma/client';

const { User } = pkg;

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      csrfToken?: string;
    }
  }
}

export {};
