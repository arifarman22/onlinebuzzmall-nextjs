export default function PageLoader({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-4`}>
      <div className="relative w-12 h-12">
        <div className={`absolute inset-0 rounded-full border-4 ${dark ? 'border-slate-700' : 'border-gray-200'}`} />
        <div className={`absolute inset-0 rounded-full border-4 border-transparent ${dark ? 'border-t-emerald-400' : 'border-t-indigo-600'} animate-spin`} />
      </div>
      <p className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-gray-400'}`}>Loading...</p>
    </div>
  );
}
