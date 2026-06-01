import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ActuationPointTab } from './features/actuation/ActuationPointTab';
import { RapidTriggerTab } from './features/rapidtrigger/RapidTriggerTab';
import { RemapTab } from './features/remap/RemapTab';
import { ComingSoon } from './features/placeholder/ComingSoon';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/config/actuation-point" replace />} />
        <Route path="/config/actuation-point" element={<ActuationPointTab />} />
        <Route path="/config/rapid-trigger" element={<RapidTriggerTab />} />
        <Route path="/config/remap" element={<RemapTab />} />
        <Route path="/config/rgb" element={<ComingSoon title="RGB Settings" />} />
        <Route path="/advanced" element={<ComingSoon title="Advanced Keys" />} />
        <Route path="/gamepad" element={<ComingSoon title="Gamepad" />} />
        <Route path="/quick-settings" element={<ComingSoon title="Quick Settings" />} />
        <Route path="/profiles" element={<ComingSoon title="My Profiles" />} />
        <Route path="*" element={<Navigate to="/config/actuation-point" replace />} />
      </Route>
    </Routes>
  );
}
