export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#0b1220] flex items-center justify-center">
      {/* background glow */}
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl animate-pulse" />

      {/* grid effect */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff22_1px,transparent_1px),linear-gradient(to_bottom,#ffffff22_1px,transparent_1px)] bg-[size:36px_36px]" />

      <div className="relative flex flex-col items-center">
        {/* outer ring */}
        <div className="relative flex items-center justify-center h-32 w-32">
          <div className="absolute h-32 w-32 rounded-full border border-white/10" />
          <div className="absolute h-24 w-24 rounded-full border border-white/10" />

          {/* spinning ring */}
          <div className="absolute h-32 w-32 rounded-full border-[3px] border-transparent border-t-blue-500 border-r-orange-400 animate-spin" />

          {/* inner core */}
          <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 via-sky-500 to-orange-500 shadow-[0_0_40px_rgba(59,130,246,0.45)] animate-pulse" />

          {/* orbit dots */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.9)]" />
          <span className="absolute bottom-3 left-4 h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.9)]" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)]" />
        </div>

        {/* text */}
        <h2 className="mt-8 text-white text-2xl font-bold tracking-wide">
          Loading
        </h2>

        <div className="mt-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white animate-bounce" />
        </div>

        <p className="mt-4 text-sm text-white/70">
          Please wait while we load your page...
        </p>
      </div>
    </div>
  );
}