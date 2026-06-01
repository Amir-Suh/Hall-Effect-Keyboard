import type { Keycode, KeycodeCategory } from '../types/keymap';

function kc(
  id: string,
  label: string,
  name: string,
  category: KeycodeCategory,
  disabled = false,
): Keycode {
  return { id, label, name, category, disabled };
}

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  .split('')
  .map((c) => kc(`KC_${c}`, c, c, 'Basic Characters'));

const digits = '0123456789'
  .split('')
  .map((d) => kc(`KC_${d}`, d, d, 'Basic Characters'));

const symbols: Keycode[] = [
  kc('KC_MINUS', '-', 'Minus', 'Basic Characters'),
  kc('KC_EQUAL', '=', 'Equal', 'Basic Characters'),
  kc('KC_LBRACKET', '[', 'Left Bracket', 'Basic Characters'),
  kc('KC_RBRACKET', ']', 'Right Bracket', 'Basic Characters'),
  kc('KC_BSLASH', '\\', 'Backslash', 'Basic Characters'),
  kc('KC_SCOLON', ';', 'Semicolon', 'Basic Characters'),
  kc('KC_QUOTE', "'", 'Quote', 'Basic Characters'),
  kc('KC_COMMA', ',', 'Comma', 'Basic Characters'),
  kc('KC_DOT', '.', 'Period', 'Basic Characters'),
  kc('KC_SLASH', '/', 'Slash', 'Basic Characters'),
  kc('KC_GRAVE', '`', 'Grave', 'Basic Characters'),
];

const whitespace: Keycode[] = [
  kc('KC_SPACE', 'Space', 'Spacebar', 'Basic Characters'),
  kc('KC_ENTER', 'Enter', 'Enter', 'Basic Characters'),
  kc('KC_TAB', 'Tab', 'Tab', 'Basic Characters'),
  kc('KC_BSPACE', 'Bksp', 'Backspace', 'Basic Characters'),
  kc('KC_ESC', 'Esc', 'Escape', 'Basic Characters'),
  kc('KC_CAPS', 'Caps', 'Caps Lock', 'Basic Characters'),
];

const modifiers: Keycode[] = [
  kc('KC_LCTRL', 'Ctrl', 'Left Control', 'Modifiers'),
  kc('KC_RCTRL', 'Ctrl', 'Right Control', 'Modifiers'),
  kc('KC_LSHIFT', 'Shift', 'Left Shift', 'Modifiers'),
  kc('KC_RSHIFT', 'Shift', 'Right Shift', 'Modifiers'),
  kc('KC_LALT', 'Alt', 'Left Alt', 'Modifiers'),
  kc('KC_RALT', 'Alt', 'Right Alt', 'Modifiers'),
  kc('KC_LWIN', 'Win', 'Left Win', 'Modifiers'),
  kc('KC_MENU', 'Menu', 'Menu', 'Modifiers'),
];

const navigation: Keycode[] = [
  kc('KC_UP', '↑', 'Up Arrow', 'Navigation'),
  kc('KC_DOWN', '↓', 'Down Arrow', 'Navigation'),
  kc('KC_LEFT', '←', 'Left Arrow', 'Navigation'),
  kc('KC_RIGHT', '→', 'Right Arrow', 'Navigation'),
  kc('KC_HOME', 'Home', 'Home', 'Navigation'),
  kc('KC_END', 'End', 'End', 'Navigation'),
  kc('KC_PGUP', 'PgUp', 'Page Up', 'Navigation'),
  kc('KC_PGDN', 'PgDn', 'Page Down', 'Navigation'),
  kc('KC_INS', 'Ins', 'Insert', 'Navigation'),
  kc('KC_DEL', 'Del', 'Delete', 'Navigation'),
];

const media: Keycode[] = [
  kc('KC_MPLY', '⏯', 'Play / Pause', 'Media'),
  kc('KC_MNXT', '⏭', 'Next Track', 'Media'),
  kc('KC_MPRV', '⏮', 'Previous Track', 'Media'),
  kc('KC_VOLU', 'Vol+', 'Volume Up', 'Media'),
  kc('KC_VOLD', 'Vol-', 'Volume Down', 'Media'),
  kc('KC_MUTE', 'Mute', 'Mute', 'Media'),
];

const fkeys = Array.from({ length: 12 }, (_, i) =>
  kc(`KC_F${i + 1}`, `F${i + 1}`, `F${i + 1}`, 'Function'),
);

const layerKeys: Keycode[] = [
  kc('KC_FN', 'Fn', 'Momentary Fn Layer', 'Layer Keys'),
  kc('MO_1', 'MO(1)', 'Momentary Layer 1', 'Layer Keys'),
  kc('TG_1', 'TG(1)', 'Toggle Layer 1', 'Layer Keys'),
  kc('TO_0', 'TO(0)', 'Switch to Main Layer', 'Layer Keys'),
];

const macros: Keycode[] = [
  kc('MACRO_1', 'Macro 1', 'Macro 1 (coming soon)', 'Macros', true),
  kc('MACRO_2', 'Macro 2', 'Macro 2 (coming soon)', 'Macros', true),
];

export const KEYCODES: Keycode[] = [
  ...letters,
  ...digits,
  ...symbols,
  ...whitespace,
  ...modifiers,
  ...navigation,
  ...media,
  ...fkeys,
  ...layerKeys,
  ...macros,
];

export const KEYCODE_BY_ID: Record<string, Keycode> = Object.fromEntries(
  KEYCODES.map((k) => [k.id, k]),
);
// Resolvable "no-op" keycode (not shown in the picker).
KEYCODE_BY_ID['KC_NO'] = kc('KC_NO', '', 'None', 'Basic Characters', true);

export const CATEGORY_ORDER: KeycodeCategory[] = [
  'Basic Characters',
  'Modifiers',
  'Navigation',
  'Media',
  'Function',
  'Layer Keys',
  'Macros',
];

const CODE_MAP: Record<string, string> = {
  LShift: 'KC_LSHIFT',
  RShift: 'KC_RSHIFT',
  LCtrl: 'KC_LCTRL',
  RCtrl: 'KC_RCTRL',
  LAlt: 'KC_LALT',
  RAlt: 'KC_RALT',
};

const LABEL_MAP: Record<string, string> = {
  Esc: 'KC_ESC',
  Backspace: 'KC_BSPACE',
  Tab: 'KC_TAB',
  Caps: 'KC_CAPS',
  Enter: 'KC_ENTER',
  Space: 'KC_SPACE',
  Win: 'KC_LWIN',
  Menu: 'KC_MENU',
  Fn: 'KC_FN',
  '-': 'KC_MINUS',
  '=': 'KC_EQUAL',
  '[': 'KC_LBRACKET',
  ']': 'KC_RBRACKET',
  '\\': 'KC_BSLASH',
  ';': 'KC_SCOLON',
  "'": 'KC_QUOTE',
  ',': 'KC_COMMA',
  '.': 'KC_DOT',
  '/': 'KC_SLASH',
  Shift: 'KC_LSHIFT',
  Ctrl: 'KC_LCTRL',
  Alt: 'KC_LALT',
};

/** Map a physical key (legend + optional disambiguation code) to its default keycode id. */
export function defaultKeycodeId(label: string, code?: string): string {
  if (code && CODE_MAP[code]) return CODE_MAP[code];
  if (LABEL_MAP[label]) return LABEL_MAP[label];
  if (/^[A-Z]$/.test(label)) return `KC_${label}`;
  if (/^[0-9]$/.test(label)) return `KC_${label}`;
  return 'KC_NO';
}
