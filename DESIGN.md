# Hall-Effect Keyboard Configurator — UI Design Specification

> **Status:** Design spec (no application code). UI-first milestone with a mocked device layer; real firmware/HID integration is a documented future phase.
> **Audience:** The engineer(s) who will build this UI. Every section is concrete enough to implement without further clarification.

## Overview

This document specifies the user interface for a desktop/web application that configures a custom
**hall-effect keyboard**. Unlike mechanical switches, hall-effect switches report **analog key
travel** (how far a key is pressed, in millimetres), which enables three per-key features that this
app must expose:

- **Rapid Trigger** — dynamic actuate/reset based on travel *direction* rather than a fixed point.
- **Actuation Point** — the exact depth (mm) at which a key registers.
- **Keybinding / Remap** — remap physical keys to outputs, layers, presets, and (future) macros.

The UI is modeled closely on the three provided reference images (Wootility v5.3.1 visual language)
and must reproduce their layout, components, and styling per tab.

### Build strategy (confirmed with stakeholder)

1. **UI-first.** Build the complete UI now with *dummy functionality*, including a simulated
   "connect a device" flow ("Exit Demo Mode" in the references). No real hardware required to run it.
2. **Abstracted device layer.** All keyboard communication sits behind a single `DeviceService`
   interface. A `MockDeviceService` powers the UI today; a real WebHID/native-HID implementation
   drops in later **without UI changes**.
3. **Firmware later, then integrate.** Low-level firmware is built afterward; the front and back end
   are combined in a final integration phase. The HID protocol is therefore an explicit open question.

### Goals

- Faithfully reproduce each reference image for its tab.
- Support **both light and dark themes**, with **dark as the default** (the references mix the two).
- Decouple UI from transport so the mock → real swap is trivial.
- Realistic, explicitly-stated hall-effect value ranges, units, and defaults.

### Non-goals (this milestone)

- Real USB/HID communication, firmware, or flashing.
- RGB Settings, Advanced Keys, Gamepad tabs (present in the sidebar but out of scope here).
- Cloud sync / accounts.

---

## Reference Analysis

All three images share the same application chrome and the **Wootility v5.3.1** visual language. The
files live in [images/](images/):

- [images/Rapid Trigger.png](<images/Rapid Trigger.png>)
- [images/Actuation Point.png](<images/Actuation Point.png>)
- [images/Remap Keys.png](<images/Remap Keys.png>)

### Shared chrome (all tabs)

```
┌───────────────┬───────────────────────────────────────────────────────────┐
│  ▢ Keyboard   │  [▣ Typing Profile  ⌄]              ↺ ↻   [ Exit Demo Mode ]│  ← Top bar
│    Config     ├───────────────────────────────────────────────────────────┤
│ ┌───────────┐ │     ┌───────────────────────────────────────────────┐     │
│ │Demo device│ │     │  60% KEYBOARD VISUALIZATION (rounded keycaps)  │     │  ← Key viz panel
│ │Wooting60HE⌄│ │     └───────────────────────────────────────────────┘     │
│ └───────────┘ │                                                             │
│ PROFILES      │   Rapid Trigger ⓘ       TO ADJUST … SELECT KEYS FIRST       │  ← Section header
│  Quick Set…   │                          [Select all keys] [Discard]        │
│  My Profiles  │   ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ KEYBOARD CFG  │   │  Card 1  │  │  Card 2  │  │  Card 3  │                   │  ← Config cards
│ ▸Actuation Pt │   └──────────┘  └──────────┘  └──────────┘                  │
│  Rapid Trigger│                                                             │
│  RGB Settings │                                                             │
│  Remap        │                                                             │
│  Advanced Keys│                                                             │
│  Gamepad      │                                                             │
│ Wootility 5.3 │                                                             │
└───────────────┴───────────────────────────────────────────────────────────┘
```

| Region | Contents |
|---|---|
| **Left sidebar (~220 px)** | App title + window icon; device-selector card ("Demo devices / Wooting 60HE" + chevron); `PROFILES` group (Quick Settings, My Profiles); `KEYBOARD CONFIGURATION` group (Actuation Point, Rapid Trigger, RGB Settings, Remap, Advanced Keys, Gamepad); version label pinned bottom-left. Active item has an accent color + left indicator bar. |
| **Top bar** | App title (left); centered **Profile switcher** ("Typing Profile" + square icon + chevron); undo/redo icons + yellow **Exit Demo Mode** button (right). |
| **Main area** | A **60% keyboard visualization** panel on top, then a **section header** (tab title + ⓘ info icon, helper caption, and `Select all keys` / `Discard selection` actions), then a responsive **row of config cards**. |

### Per-image mapping

| Image | Tab | Theme | Distinctive content |
|---|---|---|---|
| `Rapid Trigger.png` | **Rapid Trigger** | **Light** | Three cards: **Enable Rapid Trigger** (toggle; footer "ENABLED ON 0 KEYS"); **Rapid Trigger Sensitivity** ("Split sensitivity" toggle + ⓘ; `SENSITIVITY` label; slider with **HIGH ↔ LOW** axis labels and an `x.xx mm` value bubble); **Continuous Rapid Trigger** (toggle; descriptive copy; blue **info callout** at bottom). |
| `Actuation Point.png` | **Actuation Point** | **Dark** | Two cards: **Set Actuation Point** (descriptive copy; "CHANGING ACTUATION POINT FOR N keys"; a **3D keyswitch illustration with a vertical travel/depth slider** in mm); **Visual Feedback** (empty state: "Connect a keyboard to see the visual feedback"). |
| `Remap Keys.png` | **Keybinding / Remap** | **Dark** | Top **Layers** control (Main Layer / Fn Layer 1 / **Add Layer +**); **rainbow** key visualization; **Remap keys** card ("Changes made here will affect this profile…"; drag-and-drop instructions; **SELECT A PRESET** cards — Default, ASDF→Arrows, AZERTY, Colemak…); right panel: **keycode search** ("Search for a keycode") + **Basic Characters** picker grid (drag onto keys). |

### Visual design tokens (extracted from the images)

| Token | Light (Rapid Trigger img) | Dark (Actuation/Remap imgs) |
|---|---|---|
| App background | `#F4F5F7` (very light gray) | `#17181C` (near-black navy) |
| Panel / card surface | `#FFFFFF` with subtle 1px border `#E5E7EB` | `#1E1F25` with border `#2A2C33` |
| Sidebar surface | `#FFFFFF` / light gray | `#121317` |
| Primary text | `#1F2328` | `#ECEDEF` |
| Muted / caption text | `#8A9099` (uppercase, letter-spaced) | `#8A9099` |
| Accent (active nav, profile icon, focus) | Blue `#3B82F6` / teal | Blue/teal `#4C8DFF` |
| Demo button | Yellow `#F5C518` text/bg, dark label | same yellow |
| Slider track / fill | gray track, darker fill + round handle | dark track, accent fill + handle |
| Key (unselected) | light gray rounded rect, dark label | dark rounded rect, light label |
| Key (selected / active) | accent outline/fill | accent outline/fill |
| Typography | Inter-like sans-serif; **bold** headings; small uppercase captions | same |
| Radius / spacing | cards ~`12px` radius, ~`16–24px` padding; keys ~`6px` radius | same |

> **Theme note:** Rapid Trigger is shown in light mode while Actuation Point and Remap are shown in
> dark mode. This is treated as the *same application in different themes*, not three different
> designs. Both themes are first-class; dark is the default.

---

## Tech Stack

| Concern | Choice | Justification (trade-off) |
|---|---|---|
| Language | **TypeScript** | Type-safe config/keymap/profile models catch bugs early; standard for this UI class. Slight compile overhead vs JS. |
| Framework + build | **React 18 + Vite** | Fast HMR dev loop, massive ecosystem, and matches the Wootility heritage. Vite over CRA for speed. |
| Styling | **Tailwind CSS + CSS-variable theme tokens** | Utility classes reproduce the dense reference layout quickly; CSS variables on `[data-theme]` drive light/dark from one source. Trade-off: verbose class lists (mitigated by extracting components). |
| Accessible primitives | **Radix UI** (Tabs, Slider, Switch, Select, Popover, Dialog, Tooltip) | Correct ARIA + keyboard behavior for sliders/switches/dropdowns out of the box; unstyled so we own the look. |
| Component layer | **shadcn/ui-style wrappers** (optional) | Thin styled wrappers over Radix to keep markup tidy. Copy-in, not a dependency lock-in. |
| State management | **Zustand (+ `persist` middleware)** | Lightweight global store for selection/profiles/config/connection; far less boilerplate than Redux for this size. `persist` saves profiles to `localStorage` during the mock phase. |
| Routing / tabs | **React Router v6** | URL-addressable tabs (`/config/rapid-trigger`, etc.); sidebar items map to routes. A plain state switch is acceptable but loses deep-linking. |
| Keyboard grid + analog visuals | **Custom React + SVG components** | The 60% grid, switch-travel illustration, sensitivity slider, and live-depth bars are bespoke; no off-the-shelf lib fits. Trade-off: more code, full control. |
| Drag-and-drop (Remap) | **dnd-kit** | Modern, accessible, pointer + keyboard DnD for dropping keycodes onto keys. Lighter and more flexible than react-dnd. |
| Icons | **lucide-react** | Thin line icons matching the sidebar style; tree-shakeable. |
| Device communication | **`DeviceService` interface + `MockDeviceService`** | Single seam between UI and transport. Mock now; **WebHID** (web) or **Tauri native-HID** (desktop) later, no UI changes. |
| Testing | **Vitest + React Testing Library**; Playwright (later, E2E) | Fast unit/component tests colocated with Vite; Playwright for cross-tab flows once stable. |
| Lint / format | **ESLint + Prettier** | Consistent style; CI-enforceable. |
| Future desktop shell | **Tauri** (Electron as fallback) — *not built this milestone* | Rust backend pairs naturally with low-level firmware tooling, tiny bundle, native HID via a Rust crate. Electron is heavier but is what Wootility uses. The `DeviceService` seam makes either a drop-in. |

### Recommended project layout

```
src/
  main.tsx                      # React entry, theme bootstrap
  App.tsx                       # Router + AppShell
  app/
    AppShell.tsx                # Sidebar + TopBar + <Outlet/>
    routes.tsx
  components/
    layout/  Sidebar.tsx  TopBar.tsx  DeviceSelector.tsx  ProfileSwitcher.tsx
             DemoModeButton.tsx  ThemeToggle.tsx
    shared/  ConfigCard.tsx  SectionHeader.tsx  InfoTooltip.tsx  ValueSlider.tsx
             KeyboardVisualizer.tsx  Keycap.tsx  InfoCallout.tsx  EmptyState.tsx
  features/
    actuation/  ActuationPointTab.tsx  SwitchTravelControl.tsx  VisualFeedbackPanel.tsx
    rapidtrigger/ RapidTriggerTab.tsx  SensitivitySlider.tsx
    remap/      RemapTab.tsx  LayerBar.tsx  KeycodePicker.tsx  PresetList.tsx
  device/
    DeviceService.ts            # interface + types
    MockDeviceService.ts        # in-memory fake device
    DeviceProvider.tsx          # React context exposing the active service
  store/
    useConfigStore.ts           # Zustand: profiles, selection, per-key config
    useConnectionStore.ts       # Zustand: connection + demo mode + live key states
  data/
    layout60.ts                 # 60% key layout descriptor
    keycodes.ts                 # keycode catalog (categories)
    presets.ts                  # remap presets
  theme/
    tokens.css                  # CSS variables for [data-theme="dark|light"]
    tailwind.config.ts
  types/  config.ts  device.ts  keymap.ts
```

---

## Architecture & Shared Components

### App shell & navigation

1. `AppShell` renders a fixed-width `Sidebar` (left), a `TopBar` (top of the main column), and a
   routed `<Outlet/>` for the active view.
2. Sidebar items map 1:1 to routes. This milestone implements the three configuration routes; the
   others (`RGB Settings`, `Advanced Keys`, `Gamepad`) render a simple "Coming soon" placeholder.

| Route | Component | Sidebar label |
|---|---|---|
| `/config/actuation-point` | `ActuationPointTab` | Actuation Point |
| `/config/rapid-trigger` | `RapidTriggerTab` | Rapid Trigger |
| `/config/remap` | `RemapTab` | Remap |
| `/config/rgb`, `/advanced`, `/gamepad` | `ComingSoon` | (placeholders) |

### Shared components

| Component | Responsibility | Key props |
|---|---|---|
| `Sidebar` | Brand, `DeviceSelector`, nav groups, version label. | `activeRoute` |
| `TopBar` | `ProfileSwitcher`, undo/redo, `DemoModeButton`, `ThemeToggle`. | — |
| `DeviceSelector` | Shows connected/demo device; dropdown to pick device or "Connect". | `devices`, `active`, `onSelect` |
| `ProfileSwitcher` | Active profile + dropdown to switch/rename/add. | `profiles`, `activeId` |
| `DemoModeButton` | Toggles demo mode; label flips between "Exit Demo Mode" / "Enter Demo Mode". | `isDemo`, `onClick` |
| `ThemeToggle` | Flips `[data-theme]` between dark/light; persists choice. | — |
| `KeyboardVisualizer` | Renders the 60% grid from `layout60`; handles selection; exposes per-key color/state render hooks. **Reused by all three tabs.** | `layout`, `selection`, `onSelectionChange`, `renderKey?`, `mode` |
| `Keycap` | One key: label, size (unit `u`), selected/active state, optional color + live-depth fill. | `keyDef`, `selected`, `state` |
| `ConfigCard` | Card container: title, optional ⓘ, optional header toggle, body, optional footer. | `title`, `info?`, `headerControl?`, `footer?` |
| `SectionHeader` | Tab title + ⓘ Popover; helper caption; `Select all keys` / `Discard selection`. | `title`, `info`, `caption`, `selectionCount` |
| `ValueSlider` | Themed Radix slider with min/max/step, value bubble, optional left/right axis labels. | `min`, `max`, `step`, `value`, `unit`, `labels?` |
| `InfoTooltip` / `InfoCallout` | ⓘ Popover for inline help; blue callout box (as in Continuous RT card). | `children` |
| `EmptyState` | Centered icon + message (e.g., "Connect a keyboard…", "Select keys first"). | `icon`, `message` |

### KeyboardVisualizer — selection behavior

The visualizer is the heart of the app and is shared across tabs. Selection rules:

1. **Click** a key → select only that key.
2. **Shift/Ctrl-click** → add/remove from selection (multi-select).
3. **Click-drag** across keys → marquee/rubber-band selection.
4. **Select all keys** → selects the entire layout; **Discard selection** → clears it.
5. Selection is stored in `useConfigStore.selection` (array of key IDs) and read by every tab so the
   "applies to N keys" counters stay in sync.
6. In **Remap mode**, clicking a key sets it as the drop target / edit target instead of multi-selecting.

### State model (Zustand)

```ts
// useConnectionStore
{
  status: 'disconnected' | 'connecting' | 'connected',
  isDemo: boolean,                  // true on boot (demo mode)
  device: DeviceInfo | null,        // { id, name: 'Wooting 60HE Demo', layout: '60%' }
  keyStates: Record<KeyId, number>, // live travel depth in mm (0..MAX_TRAVEL), from stream
}

// useConfigStore (persisted)
{
  profiles: Profile[],              // [{ id, name: 'Typing Profile', ... }]
  activeProfileId: string,
  selection: KeyId[],               // currently selected keys
  activeLayer: LayerId,             // for Remap
  // per profile → per key:
  config: {
    [profileId]: {
      [keyId]: {
        actuationPoint: number,                 // mm
        rapidTrigger: {
          enabled: boolean,
          sensitivity: number,                  // mm
          continuous: boolean,
          split?: { press: number; release: number },
        },
      }
    }
  },
  keymap: { [profileId]: { [layerId]: Record<KeyId, Keycode> } },
}
```

### Theming

1. Define all colors as CSS custom properties in `theme/tokens.css` under `:root[data-theme="dark"]`
   and `:root[data-theme="light"]` (values from the **Visual design tokens** table).
2. Configure Tailwind to consume them (e.g., `colors: { bg: 'var(--bg)', panel: 'var(--panel)', … }`).
3. `ThemeToggle` sets `document.documentElement.dataset.theme` and persists to `localStorage`; default `dark`.
4. Components never hardcode colors — only token classes — so both themes render from one component tree.

### Key layout model (`data/layout60.ts`)

A single data-driven descriptor used by both the visualizer and remap. Example shape:

```ts
export type KeyDef = { id: string; label: string; row: number; x: number; w: number /* units */ };
// 60% (ANSI) ~61 keys, 5 rows; widths in keycap units (u): Backspace 2u, Tab 1.5u,
// Caps 1.75u, Enter 2.25u, L-Shift 2.25u, R-Shift 2.75u, Spacebar 6.25u, mods 1.25u.
```

### Device layer (the critical seam)

```ts
// device/DeviceService.ts
export interface DeviceService {
  listDevices(): Promise<DeviceInfo[]>;
  connect(deviceId: string): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  readConfig(): Promise<DeviceConfig>;
  writeConfig(patch: Partial<DeviceConfig>): Promise<void>;
  subscribeKeyState(cb: (states: Record<KeyId, number>) => void): () => void; // returns unsubscribe
}
```

- **`MockDeviceService`** (this milestone): exposes a fake `"Wooting 60HE Demo"`; `connect` resolves
  after ~600 ms (simulated latency) and flips `isDemo`/`status`; `read/writeConfig` round-trip through
  the Zustand store + `localStorage`; `subscribeKeyState` emits a scripted/`requestAnimationFrame`
  stream so **Visual Feedback** animates and the "connect a device to show it's working" demo is real.
- **Future** `WebHidDeviceService` / `NativeHidDeviceService` implement the same interface; swap via
  `DeviceProvider`. No UI/store changes required.

---

## Tab Specifications

> Value ranges below assume a typical hall-effect switch (Lekker-class) with **~4.0 mm total travel**.
> Confirm against the real switch (see *Assumptions & Open Questions*). All depths are in **millimetres**.

### Rapid Trigger

Reference: [images/Rapid Trigger.png](<images/Rapid Trigger.png>) — **light theme**, three-card row.
Rapid Trigger continuously re-actuates/resets a key based on travel *direction*, ideal for fast
re-presses (gaming). All controls apply to the **current key selection**; if none are selected the
cards are disabled and the helper caption reads *"To adjust Rapid Trigger, please select one or more keys first."*

**Layout mapping**

```
Rapid Trigger ⓘ        TO ADJUST RAPID TRIGGER, SELECT KEYS FIRST  [Select all keys] [Discard]
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────────────┐
│ Enable Rapid    [⚲] │ │ Rapid Trigger  [Split│ │ Continuous Rapid       [⚲]  │
│ Trigger             │ │ Sensitivity   toggle]│ │ Trigger                     │
│ <description copy>  │ │ SENSITIVITY          │ │ <description copy>           │
│                     │ │  ●────────────  0.45 │ │  ┌───────────────────────┐  │
│ ENABLED ON 0 KEYS   │ │ HIGH          LOW mm │ │  │ ⓘ info callout text   │  │
└─────────────────────┘ └─────────────────────┘ │  └───────────────────────┘  │
                                                 └─────────────────────────────┘
```

| Component | Type | Range / values | Default | Validation / behavior |
|---|---|---|---|---|
| **Enable Rapid Trigger** | Toggle (card header) | on / off | **off** | Enables RT on all selected keys. Card footer shows `ENABLED ON {n} KEYS` (count across profile). When off, Sensitivity & Continuous controls are visually de-emphasized. |
| Description | Static text | — | "Rapid Trigger dynamically actuates and resets your key based on your intention to press or release the key. Rapid Trigger starts and ends after the actuation point." | — |
| **Split sensitivity** | Toggle + ⓘ (Sensitivity card header) | on / off | **off** | When on, the single sensitivity slider becomes **two** sliders: **Press** and **Release**. |
| **Sensitivity** | `ValueSlider` | **0.1 – 2.0 mm**, step **0.05** | **0.5 mm** | Axis labels **HIGH** (left/small value) ↔ **LOW** (right/large value); value bubble shows `x.xx mm`. Smaller = more sensitive. Clamp to range. |
| Press sensitivity | `ValueSlider` (split only) | 0.1 – 2.0 mm, step 0.05 | 0.5 mm | Re-actuate threshold while pressing down. |
| Release sensitivity | `ValueSlider` (split only) | 0.1 – 2.0 mm, step 0.05 | 0.5 mm | Reset threshold while releasing. |
| **Continuous Rapid Trigger** | Toggle (card header) | on / off | **off** | "When enabled, Rapid Trigger ends when the entire key is released. When disabled, Rapid Trigger ends at the actuation point." |
| Info callout | `InfoCallout` (blue box) | — | "Enable this feature if you wish to continuously spam a key without worrying about the actuation point." | Bottom of the Continuous card. |

**Acceptance:** With ≥1 key selected, toggling Enable updates `ENABLED ON n KEYS`; the sensitivity
slider shows a live `mm` bubble between HIGH/LOW; Split reveals two sliders; the layout/colors match
the light-theme reference.

### Actuation Point

Reference: [images/Actuation Point.png](<images/Actuation Point.png>) — **dark theme**, two-card row.
Actuation Point sets the depth at which each selected key registers. Controls apply to the **current
selection**; the helper caption reads *"To adjust Actuation Point, please select one or more keys first."*

**Layout mapping**

```
Actuation Point ⓘ      TO ADJUST ACTUATION POINT, SELECT KEYS FIRST   [Select all keys]
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│ Set Actuation Point               │ │ Visual Feedback                    │
│ <description copy>                │ │                                    │
│ CHANGING ACTUATION POINT FOR N    │ │   ⌨  Connect a keyboard to see     │
│   ┌────────┐                      │ │       the visual feedback          │
│   │ switch │  ▮ 1.5 mm  ◀ slider  │ │   (live per-key depth bars when    │
│   │  3D    │  ▮                    │ │    connected — mock stream now)    │
│   └────────┘  ▮                    │ │                                    │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

| Component | Type | Range / values | Default | Validation / behavior |
|---|---|---|---|---|
| **Set Actuation Point** | `SwitchTravelControl` (SVG switch illustration + vertical depth slider) | **0.1 – 4.0 mm**, step **0.1** | **1.5 mm** | Dragging the slider moves an indicator down the switch illustration and updates the mm readout. Applies to all selected keys. Clamp 0.1–4.0; reject NaN. |
| Caption | Static text | — | `CHANGING ACTUATION POINT FOR {n} keys` | Reflects selection count; reads "0 keys" (disabled) when empty. |
| Description | Static text | — | "Customize the actuation point by setting the exact distance a key must be pressed before it registers a keypress." | — |
| Numeric entry (optional) | Number input beside slider | 0.1 – 4.0 mm, step 0.1 | mirrors slider | Typed values clamp to range on blur. |
| **Visual Feedback** | `VisualFeedbackPanel` | live depth 0 → MAX_TRAVEL per key | — | When disconnected: `EmptyState` "Connect a keyboard to see the visual feedback." When connected (mock): animated per-key bars/heatmap driven by `subscribeKeyState`, with a line marking the actuation point. |

**Acceptance:** Slider constrained to 0.1–4.0 mm in 0.1 steps; the switch illustration indicator and
readout track the value; the caption counts selected keys; Visual Feedback shows the empty state until
a (mock) device connects, then animates; dark-theme styling matches the reference.

### Keybinding / Remap

Reference: [images/Remap Keys.png](<images/Remap Keys.png>) — **dark theme**, Layers + presets + picker.
Remap reassigns physical keys to keycodes per **layer**. Unlike the other tabs, clicking a key here
selects it as the **edit/drop target** rather than multi-selecting.

**Layout mapping**

```
[Main Layer] [Fn Layer 1] [ + Add Layer ]                              ← LayerBar (top)
        ┌───────────────────────────────────────────────┐
        │  RAINBOW 60% KEY VISUALIZATION (drop targets)  │
        └───────────────────────────────────────────────┘
Remap
┌──────────────────────────────┐ ┌───────────────────────────────────────────┐
│ Remap keys                   │ │  Search for a keycode  🔍                   │
│ Changes made here will affect│ │  Basic Characters                           │
│ this profile and others…     │ │  ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐             │
│ Drag & drop keys from the    │ │  │A││B││C││D││…││…││…││…││…││…│  (draggable) │
│ right onto your keyboard.    │ │  └─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘└─┘             │
│ SELECT A PRESET              │ │  Modifiers / Media / Layer keys / Macros …  │
│ [Default][ASDF→Arr][AZERTY]… │ │                                             │
└──────────────────────────────┘ └───────────────────────────────────────────┘
```

| Component | Type | Range / values | Default | Validation / behavior |
|---|---|---|---|---|
| **Layer bar** | Segmented control + add | Main Layer + Fn Layer(s) | Main Layer active | `+ Add Layer` appends `Fn Layer N` (cap suggested: 4). Each layer holds its own keymap. Right-click/long-press a layer to rename/remove (not Main). |
| **Keyboard visualization** | `KeyboardVisualizer` (remap mode) | shows current layer's keycodes; rainbow per-key colors as in image | — | Click a key → edit target (highlight). Drag a keycode chip onto a key to assign it. |
| **Remap keys** card | Static copy + presets | — | "Changes made here will affect this profile and others that are linked." + drag/drop instructions | — |
| **Select a preset** | Preset cards | Default, ASDF→Arrows, AZERTY, Colemak (extensible — see `data/presets.ts`) | Default | Applying a preset overwrites the **current layer's** keymap; confirm via Dialog before overwrite. |
| **Keycode search** | Text input | filters the catalog | empty | Live filter by keycode name/label. |
| **Keycode catalog** | Categorized grid of draggable chips | Categories: **Basic Characters** (A–Z, 0–9, symbols), **Modifiers** (Ctrl/Alt/Shift/Win, L/R), **Media** (play/pause, vol±, mute), **Navigation** (arrows, Home/End/PgUp/PgDn), **Layer keys** (MO/TG/TO per layer), **Macros** (future, disabled placeholder) | — | Each chip is a `dnd-kit` draggable; dropping on a key writes `keymap[profile][layer][keyId] = keycode`. Invalid drops are ignored. |
| **Reset** | Button (per key / per layer) | — | — | Restores key(s) to default keycode for the layer. |

**Acceptance:** Switching layers swaps the displayed keymap; dragging a keycode chip onto a key
reassigns it and the keycap label updates; applying a preset (after confirm) rewrites the active
layer; search filters the catalog; dark-theme + rainbow keys match the reference.

---

## Implementation Phases

Phases are dependency-ordered. Each lists concrete deliverables and acceptance criteria. Earlier
phases must pass acceptance before the next begins.

### Phase 0 — Scaffold
1. `npm create vite@latest` (React + TS); add Tailwind, PostCSS, ESLint, Prettier.
2. Add `theme/tokens.css` with dark + light CSS variables; wire Tailwind to the tokens.
3. Create the folder structure from **Tech Stack → Recommended project layout**.
4. Add `ThemeToggle` and bootstrap `[data-theme="dark"]` on load.

**Deliverables:** Running Vite app, theme tokens, lint/format configured.
**Acceptance:** `npm run dev` serves a blank shell; toggling theme visibly switches dark/light; `npm run lint` passes.

### Phase 1 — App shell & navigation
1. Build `AppShell` (Sidebar + TopBar + routed Outlet).
2. Implement `Sidebar` (brand, nav groups, active indicator, version label) and `TopBar`
   (`ProfileSwitcher`, undo/redo, `DemoModeButton`, `ThemeToggle`).
3. Configure React Router routes per the **Architecture** table; non-scope tabs render `ComingSoon`.
4. Stub `DeviceSelector` and `ProfileSwitcher` with placeholder data.

**Deliverables:** Navigable shell matching the chrome layout in both themes.
**Acceptance:** Clicking sidebar items switches routes; active item is highlighted; demo device + profile show in chrome.

### Phase 2 — Device abstraction + mock
1. Define `DeviceService` interface and `device.ts` types.
2. Implement `MockDeviceService` (fake "Wooting 60HE Demo", simulated latency, `read/writeConfig` via
   store + `localStorage`, `subscribeKeyState` stream via `requestAnimationFrame`).
3. Create `DeviceProvider` context and `useConnectionStore`; wire `DemoModeButton` + `DeviceSelector`.

**Deliverables:** Working mock connect/disconnect and a live key-state stream.
**Acceptance:** "Connect"/"Exit Demo Mode" flips connection state and chrome; a subscriber receives
animated key-depth values (verifiable via a temporary debug readout).

### Phase 3 — KeyboardVisualizer
1. Author `data/layout60.ts` (60% ANSI descriptor with unit widths).
2. Build `Keycap` and `KeyboardVisualizer` (positioning, labels, theming).
3. Implement selection: click, shift/ctrl-click, drag-marquee, Select all, Discard; store in `useConfigStore.selection`.
4. Expose `renderKey`/`mode` hooks for per-key color and live-depth fill.

**Deliverables:** Reusable, selectable 60% grid in both themes.
**Acceptance:** All selection interactions work; selection count is readable by tabs; keys render correctly light/dark.

### Phase 4 — Actuation Point tab
1. Build `ActuationPointTab` with `SectionHeader` (caption + Select all).
2. Build `SwitchTravelControl` (SVG switch illustration + vertical `ValueSlider`, 0.1–4.0 mm / step 0.1, default 1.5).
3. Build `VisualFeedbackPanel` (empty state when disconnected; animated bars from `subscribeKeyState` when connected).
4. Persist per-key actuation values to the store; reflect `CHANGING … FOR n keys`.

**Deliverables:** Fully functional Actuation Point tab.
**Acceptance:** Matches the dark reference; slider clamps to range; values persist per key; Visual Feedback animates only when (mock) connected.

### Phase 5 — Rapid Trigger tab
1. Build `RapidTriggerTab` (three `ConfigCard`s) with `SectionHeader`.
2. Enable RT toggle + `ENABLED ON n KEYS` counter.
3. `SensitivitySlider` (0.1–2.0 mm, step 0.05, default 0.5, HIGH↔LOW labels, mm bubble); Split toggle → Press/Release sliders.
4. Continuous RT toggle + blue `InfoCallout`.

**Deliverables:** Fully functional Rapid Trigger tab.
**Acceptance:** Matches the light reference; counter updates with selection; split reveals two sliders; ranges clamp.

### Phase 6 — Remap tab
1. Build `LayerBar` (Main + Fn layers, add/rename/remove) and `activeLayer` state.
2. Build `KeycodePicker` (search + categorized draggable chips) from `data/keycodes.ts`.
3. Integrate `dnd-kit`: drag chip → drop on key → write keymap; update keycap labels.
4. Build `PresetList` from `data/presets.ts` with overwrite-confirm Dialog; add Reset.

**Deliverables:** Fully functional Remap tab.
**Acceptance:** Matches the dark reference; remapping a key updates its label; layer switching swaps keymaps; presets apply after confirm; search filters.

### Phase 7 — Polish
1. Theme parity pass against both reference images (spacing, radii, colors, typography).
2. ⓘ Popovers/tooltips, empty/disabled states ("select keys first", "connect a keyboard").
3. Accessibility: ARIA on sliders/switches/tabs, full keyboard navigation, focus rings, contrast checks.
4. Profile save/load/rename via `persist`; undo/redo; subtle transitions.
5. Vitest unit/component tests for store logic, selection, and value clamping.

**Deliverables:** Production-quality UI in both themes.
**Acceptance:** Side-by-side visual diff vs each reference is faithful; a11y checks pass; `npm test` green.

### Phase 8 — Future (documented, out of this milestone)
1. Wrap the app in a **Tauri** shell (Electron fallback).
2. Implement `WebHidDeviceService` / native-HID `DeviceService` against the real firmware protocol.
3. Integrate front + back end; replace mock; validate on hardware.

**Deliverables:** Desktop app talking to real firmware.
**Acceptance:** Real device connect/read/write/live-feedback works through the unchanged UI.

---

## Assumptions & Open Questions

| # | Assumption made | Why | Needs confirmation? |
|---|---|---|---|
| 1 | Keyboard is **60% ANSI** layout. | Sidebar shows "Wooting 60HE". | Confirm exact key matrix / variant (ISO? split spacebar?). |
| 2 | Total key travel **~4.0 mm**; **Actuation 0.1–4.0 mm**, step 0.1, default 1.5 mm. | Typical Lekker-class hall-effect switch. | Confirm against the *actual* custom switch. |
| 3 | **Rapid Trigger sensitivity 0.1–2.0 mm**, step 0.05, default 0.5 mm; HIGH = small value. | Matches the HIGH↔LOW slider in the reference; sensible analog range. | Confirm exact min/max/step the firmware will accept. |
| 4 | The theme mismatch across images (light vs dark) is the **same app in two themes**. | Otherwise the designs would be inconsistent. | Confirm: support both, dark default — as planned. |
| 5 | **Profiles stored locally** (`localStorage`) this milestone; on-device storage is future. | No firmware yet. | Confirm on-device profile model later. |
| 6 | **RGB Settings, Advanced Keys, Gamepad** are out of scope (placeholders only). | Not among the three required tabs. | Confirm scope; design later if needed. |
| 7 | Preset list = Default, ASDF→Arrows, AZERTY, Colemak (extensible). | Visible/typical in the reference. | Confirm the exact preset set required. |
| 8 | "Split sensitivity" splits into **Press** and **Release** thresholds. | Standard Wootility-style behavior; only the toggle is fully legible in the image. | Confirm exact split semantics. |
| 9 | Macros are a **future** keycode category (disabled placeholder). | Not required by the three tabs. | Confirm if macros are in scope. |
| **OPEN** | **Firmware / HID protocol is undefined**: report formats, command set, per-key addressing, config persistence, live-state packet shape, polling rate. | Firmware is built *after* the UI. | **Yes — primary open question.** The `DeviceService` interface is the agreed seam; finalize the protocol before Phase 8. |

### Notes for reviewers
- This document is a **specification only**; no application code is produced here.
- If any reference image is later found to contain detail not captured above (e.g., exact preset
  icons or the precise sensitivity bounds), update the corresponding tab table rather than guessing.
