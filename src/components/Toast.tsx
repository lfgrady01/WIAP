import { useApp } from '../context';

export default function Toast() {
  const { toast } = useApp();
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-200 ${
        toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <div className="bg-[#0E2841] text-white text-sm px-4 py-2.5 rounded-md shadow-lg whitespace-nowrap">
        {toast}
      </div>
    </div>
  );
}
