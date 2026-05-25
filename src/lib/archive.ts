import { getPhoto } from '../storage/photos';
import type {
  DayEntry,
  Settings,
  WeekMeasurement,
  WeekPhoto,
} from '../types';

export type MissionArchive = {
  archivedAt: string;
  version: 3;
  kind: 'mission-archive';
  settings: Settings;
  days: Record<string, DayEntry>;
  measurements: WeekMeasurement[];
  photos: Array<WeekPhoto & { base64: string }>;
  finalXp: number;
};

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Read failed'));
    r.readAsDataURL(blob);
  });
}

export async function buildMissionArchive(input: {
  settings: Settings;
  days: Record<string, DayEntry>;
  measurements: WeekMeasurement[];
  photos: WeekPhoto[];
  finalXp: number;
}): Promise<MissionArchive> {
  const photosOut: Array<WeekPhoto & { base64: string }> = [];
  for (const p of input.photos) {
    const blob = await getPhoto(p.photoKey);
    if (!blob) continue;
    const base64 = await blobToDataURL(blob);
    photosOut.push({ ...p, base64 });
  }
  return {
    archivedAt: new Date().toISOString(),
    version: 3,
    kind: 'mission-archive',
    settings: input.settings,
    days: input.days,
    measurements: input.measurements,
    photos: photosOut,
    finalXp: input.finalXp,
  };
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function archiveFilename(date = new Date()): string {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  return `mission-archive-${stamp}.json`;
}

export function downloadMissionArchive(archive: MissionArchive): void {
  const blob = new Blob([JSON.stringify(archive, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = archiveFilename();
  a.click();
  URL.revokeObjectURL(url);
}
