import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import mariadb from "mariadb";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const caPath = path.resolve(process.cwd(), "prisma", "ca.pem");

const pool = mariadb.createPool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,

  connectionLimit: 5,
  connectTimeout: 5000,

  ssl: {
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: true,
  },
});

const adapter = new PrismaMariaDb(pool);

export const prisma = new PrismaClient({ adapter });