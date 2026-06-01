# Hall-Effect Keyboard

Firmware and configuration software for a custom hall-effect keyboard.

Hall-effect switches report **analog key travel**, enabling per-key features mechanical boards can't:
**Rapid Trigger**, an adjustable **Actuation Point**, and flexible **Keybinding / Remap**.

## Repository layout

- [`configurator/`](configurator/) — the configuration **UI** (React + TypeScript + Vite). UI-first
  milestone with a mocked device layer, so it runs end-to-end with no hardware.
- [`DESIGN.md`](DESIGN.md) — the UI **design specification** (reference analysis, tech stack,
  architecture, per-tab specs, implementation phases).
- [`Dummy-UI-demo.md`](Dummy-UI-demo.md) — a **demo log** with screenshots and per-phase status.
- [`images/`](images/) — reference images that guided the design.
- _Firmware_ — to come. The UI talks to hardware through a swappable `DeviceService`; the real
  HID implementation lands in a later phase.

## Run the configurator

```bash
cd configurator
npm install
npm run dev      # http://localhost:5173
```

Other scripts: `npm run build` (typecheck + build), `npm run test` (Vitest), `npm run typecheck`.

The app boots in **Demo Mode** — click **Connect demo device** to simulate a keyboard and watch the
live Visual Feedback. See [Dummy-UI-demo.md](Dummy-UI-demo.md) for a guided tour.
