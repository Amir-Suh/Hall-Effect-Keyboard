import type { KeyId } from '../types/keymap';

export interface KeyDef {
  id: KeyId;
  /** Physical legend, e.g. "Q", "Shift", "Space". */
  label: string;
  /** Disambiguation code for duplicate legends, e.g. "LShift" / "RShift". */
  code?: string;
  row: number; // 0..4
  x: number; // horizontal offset in keycap units (u)
  w: number; // width in keycap units (u)
}

export const UNITS_WIDE = 15; // a 60% layout is 15u wide
export const ROWS_TALL = 5;

type Cell = { l: string; w?: number; code?: string };

// 60% ANSI layout. Widths in keycap units; rows total 15u each.
const ROWS: Cell[][] = [
  [
    { l: 'Esc' }, { l: '1' }, { l: '2' }, { l: '3' }, { l: '4' }, { l: '5' },
    { l: '6' }, { l: '7' }, { l: '8' }, { l: '9' }, { l: '0' }, { l: '-' },
    { l: '=' }, { l: 'Backspace', w: 2 },
  ],
  [
    { l: 'Tab', w: 1.5 }, { l: 'Q' }, { l: 'W' }, { l: 'E' }, { l: 'R' }, { l: 'T' },
    { l: 'Y' }, { l: 'U' }, { l: 'I' }, { l: 'O' }, { l: 'P' }, { l: '[' },
    { l: ']' }, { l: '\\', w: 1.5 },
  ],
  [
    { l: 'Caps', w: 1.75 }, { l: 'A' }, { l: 'S' }, { l: 'D' }, { l: 'F' }, { l: 'G' },
    { l: 'H' }, { l: 'J' }, { l: 'K' }, { l: 'L' }, { l: ';' }, { l: "'" },
    { l: 'Enter', w: 2.25 },
  ],
  [
    { l: 'Shift', w: 2.25, code: 'LShift' }, { l: 'Z' }, { l: 'X' }, { l: 'C' }, { l: 'V' },
    { l: 'B' }, { l: 'N' }, { l: 'M' }, { l: ',' }, { l: '.' }, { l: '/' },
    { l: 'Shift', w: 2.75, code: 'RShift' },
  ],
  [
    { l: 'Ctrl', w: 1.25, code: 'LCtrl' }, { l: 'Win', w: 1.25 }, { l: 'Alt', w: 1.25, code: 'LAlt' },
    { l: 'Space', w: 6.25 }, { l: 'Alt', w: 1.25, code: 'RAlt' }, { l: 'Fn', w: 1.25 },
    { l: 'Menu', w: 1.25 }, { l: 'Ctrl', w: 1.25, code: 'RCtrl' },
  ],
];

function build(): KeyDef[] {
  const keys: KeyDef[] = [];
  ROWS.forEach((row, r) => {
    let x = 0;
    row.forEach((cell, i) => {
      const w = cell.w ?? 1;
      keys.push({ id: `k${r}_${i}`, label: cell.l, code: cell.code, row: r, x, w });
      x += w;
    });
  });
  return keys;
}

export const LAYOUT_60: KeyDef[] = build();
export const ALL_KEY_IDS: KeyId[] = LAYOUT_60.map((k) => k.id);
export const KEY_BY_ID: Record<KeyId, KeyDef> = Object.fromEntries(
  LAYOUT_60.map((k) => [k.id, k]),
);
