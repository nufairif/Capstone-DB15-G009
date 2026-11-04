'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-neutral-500">Memuat Toko Firaza...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <App />;
}

