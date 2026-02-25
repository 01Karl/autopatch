import fs from 'node:fs';
import path from 'node:path';

export type FreeIPAFileConfig = {
  baseUrl: string;
  usernameSuffix?: string;
  verifyTls?: boolean;
};

export type PlaybookRoutine = {
  key: string;
  label: string;
  description: string;
};

type PlaybookRoutineFile = {
  routines: PlaybookRoutine[];
};

const configDir = path.resolve(process.cwd(), 'config');
const freeipaConfigPath = path.join(configDir, 'freeipa.json');
const playbookRoutinesPath = path.join(configDir, 'playbook-routines.json');

function readJsonFile<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export function getFreeIPAFileConfig(): FreeIPAFileConfig {
  return readJsonFile<FreeIPAFileConfig>(freeipaConfigPath, {
    baseUrl: '',
    usernameSuffix: '',
    verifyTls: true,
  });
}

export function getPlaybookRoutines(): PlaybookRoutine[] {
  const payload = readJsonFile<PlaybookRoutineFile>(playbookRoutinesPath, { routines: [] });
  return payload.routines;
}

export function getFreeIPAConfigPath() {
  return freeipaConfigPath;
}

export function getPlaybookRoutinesPath() {
  return playbookRoutinesPath;
}
