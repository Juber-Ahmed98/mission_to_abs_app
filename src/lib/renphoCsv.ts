// Parser for the CSV the Renpho app exports ("RENPHO Health-….csv").
//
// We deliberately read only the two columns the app cares about — Weight(kg)
// and Body Fat(%) — and ignore the ~15 other body-composition fields (BMI,
// muscle mass, visceral fat, …), honoring the "witness, not a coach" scope.
//
// Confirmed schema (header row, columns trimmed):
//   Date,Time,Weight(kg),BMI,Body Fat(%),Skeletal Muscle(%),Fat-Free Mass(kg),…
//   2025.12.26,08:23:40,74.30,26.3,26.1,47.6,…
//
// Quirks handled here:
//   - Date is `YYYY.MM.DD` (dot-separated) → normalized to ISO `YYYY-MM-DD`.
//   - `--` (and blanks) mean "no value" → null.
//   - Rows are newest-first and a date can appear more than once; we dedupe to
//     one reading per day, keeping the latest `Time`.

export type RenphoReading = {
  date: string; // ISO YYYY-MM-DD
  weightKg: number | null;
  bodyFat: number | null;
};

// Split a single CSV line, honoring double-quoted fields (the trailing free-text
// "Remarks" column can in theory contain commas; the columns we read never do).
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// `2025.12.26` → `2025-12-26`. Returns null for anything that isn't a plausible
// Y.M.D date so a malformed row is skipped rather than corrupting state.
function parseRenphoDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const month = mo.padStart(2, '0');
  const day = d.padStart(2, '0');
  if (Number(month) < 1 || Number(month) > 12) return null;
  if (Number(day) < 1 || Number(day) > 31) return null;
  return `${y}-${month}-${day}`;
}

// `--`, blank, or non-numeric → null.
function parseCell(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const t = raw.trim();
  if (t === '' || t === '--') return null;
  const n = parseFloat(t.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function findColumn(header: string[], match: (h: string) => boolean): number {
  return header.findIndex((h) => match(h.trim().toLowerCase()));
}

/**
 * Parse a Renpho export into one reading per day (latest of the day), sorted by
 * date ascending. Readings with neither a weight nor a body-fat value are
 * dropped. Throws if the required columns can't be located (treated as a bad
 * file by callers).
 */
export function parseRenphoCsv(text: string): RenphoReading[] {
  // Strip a UTF-8 BOM and normalize line endings.
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r\n|\r|\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) {
    throw new Error('Empty or headerless Renpho export.');
  }

  const header = splitCsvLine(lines[0]);
  const dateIdx = (() => {
    const i = findColumn(header, (h) => h === 'date');
    return i === -1 ? 0 : i;
  })();
  const timeIdx = (() => {
    const i = findColumn(header, (h) => h === 'time');
    return i === -1 ? 1 : i;
  })();
  const weightIdx = findColumn(
    header,
    (h) => h === 'weight(kg)' || h.startsWith('weight('),
  );
  const bodyFatIdx = findColumn(header, (h) => h.startsWith('body fat'));
  if (weightIdx === -1 || bodyFatIdx === -1) {
    throw new Error('Unrecognized Renpho export — missing weight or body-fat column.');
  }

  // Dedupe to the latest reading per date.
  const byDate = new Map<string, { time: string; reading: RenphoReading }>();
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const date = parseRenphoDate(cols[dateIdx] ?? '');
    if (!date) continue;
    const time = (cols[timeIdx] ?? '').trim() || '00:00:00';
    const reading: RenphoReading = {
      date,
      weightKg: parseCell(cols[weightIdx]),
      bodyFat: parseCell(cols[bodyFatIdx]),
    };
    const prev = byDate.get(date);
    if (!prev || time > prev.time) {
      byDate.set(date, { time, reading });
    }
  }

  return Array.from(byDate.values())
    .map((v) => v.reading)
    .filter((r) => r.weightKg !== null || r.bodyFat !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}
