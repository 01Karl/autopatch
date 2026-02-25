import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const reportsDir = path.resolve(process.cwd(), '..', 'reports');
const dbPath = path.join(reportsDir, 'autopatch_web.db');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT,
    env TEXT NOT NULL,
    dry_run INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    total_targets INTEGER DEFAULT 0,
    ok_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    success_pct REAL DEFAULT 0,
    report_json TEXT,
    report_xlsx TEXT,
    message TEXT
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    env TEXT NOT NULL,
    base_path TEXT NOT NULL,
    dry_run INTEGER NOT NULL,
    max_workers INTEGER NOT NULL,
    probe_timeout REAL NOT NULL,
    day_of_week TEXT NOT NULL,
    time_hhmm TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_trigger_key TEXT
  );

  CREATE TABLE IF NOT EXISTS service_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    purpose TEXT NOT NULL,
    username TEXT NOT NULL,
    secret TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);


export default db;
export { reportsDir };
