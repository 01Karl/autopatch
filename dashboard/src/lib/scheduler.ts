import db from './db';
import { enqueueAutopatch } from './autopatch';

const DAY_MAP: Record<string, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0
};

let started = false;

export function startScheduler() {
  if (started) return;
  started = true;

  setInterval(() => {
    const now = new Date();
    const day = now.getDay();
    const hhmm = now.toTimeString().slice(0, 5);
    const dedupe = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${hhmm.replace(':', '')}`;

    const schedules = db.prepare('SELECT * FROM schedules WHERE enabled=1').all() as any[];
    for (const item of schedules) {
      if (DAY_MAP[item.day_of_week] !== day) continue;
      if (item.time_hhmm !== hhmm) continue;

      const triggerKey = `${item.id}:${dedupe}`;
      if (item.last_trigger_key === triggerKey) continue;

      enqueueAutopatch({
        env: item.env,
        basePath: item.base_path,
        dryRun: Boolean(item.dry_run),
        maxWorkers: item.max_workers,
        probeTimeout: item.probe_timeout
      });

      db.prepare('UPDATE schedules SET last_trigger_key=? WHERE id=?').run(triggerKey, item.id);
    }
  }, 15000);
}
