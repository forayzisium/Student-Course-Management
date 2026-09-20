import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const caPath = path.resolve(process.cwd(), "prisma", "ca.pem");

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  connectionLimit: 5,
  ssl: {
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: true,
  },
});

export const prisma = new PrismaClient({
  adapter,
});