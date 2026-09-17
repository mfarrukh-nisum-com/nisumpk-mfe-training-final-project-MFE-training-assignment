import fs from "fs";
import path from "path";

/**
 * Minimal JSON-file-backed persistence layer.
 *
 * Standing in for a real database (Postgres/Mongo/etc.) per the project
 * brief — every read/write goes through here, so swapping this file for
 * a real DB client later means the route handlers in routes/*.ts don't
 * change at all, only this module does.
 */
const DATA_DIR = path.join(__dirname, "..", "..", "data");

function filePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`);
}

export function readCollection<T>(collection: string, seed: T): T {
  const file = filePath(collection);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(seed, null, 2));
    return seed;
  }
  const raw = fs.readFileSync(file, "utf-8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt/empty file — reseed rather than crash the server.
    fs.writeFileSync(file, JSON.stringify(seed, null, 2));
    return seed;
  }
}

export function writeCollection<T>(collection: string, data: T): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2));
}
