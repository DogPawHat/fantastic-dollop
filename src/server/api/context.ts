import { db } from "./db";
import type { PrismaClient } from "@prisma/client";

export interface Context {
  db: PrismaClient;
}

export const context: Context = {
  db,
};
