export default function Loading() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black to-purple-950 flex flex-col items-center justify-center text-white font-mono">
      <div className="w-24 h-24 border-4 border-t-cyan-500 border-r-pink-500 border-b-purple-500 border-l-transparent rounded-full animate-spin mb-8"></div>
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 text-transparent bg-clip-text drop-shadow-[0_0_10px_rgba(255,0,255,0.5)] mb-4">
        IFC Playground
      </h1>
      <p className="text-cyan-400 animate-pulse">Loading environment...</p>
    </div>
  )
}

