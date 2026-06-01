import { useConnectionStore } from '../../store/useConnectionStore';
import { useDevice } from '../../device/DeviceProvider';

export function DemoModeButton() {
  const isDemo = useConnectionStore((s) => s.isDemo);
  const setDemo = useConnectionStore((s) => s.setDemo);
  const status = useConnectionStore((s) => s.status);
  const { disconnect } = useDevice();

  const onClick = async () => {
    if (isDemo) {
      if (status === 'connected') await disconnect();
      setDemo(false);
    } else {
      setDemo(true);
    }
  };

  return (
    <button
      onClick={() => void onClick()}
      className="rounded-md bg-demo px-3 py-1.5 text-xs font-semibold text-demo-fg transition-[filter] hover:brightness-95"
    >
      {isDemo ? 'Exit Demo Mode' : 'Enter Demo Mode'}
    </button>
  );
}
