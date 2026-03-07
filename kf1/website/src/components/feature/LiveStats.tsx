import { useState, useEffect } from 'react';

interface GameState {
  wave: { current: number; total: number; inProgress: boolean; traderTime: boolean }
  zeds: { alive: number; maxAtOnce: number }
  difficulty: string
  map: string
  players: { name: string; perk: string; perkLevel: number; kills: number; cash: number; health: number; maxHealth: number; deaths: number; ping: number }[]
  playerCount: number
}

export default function LiveStats() {
  const [data, setData] = useState<GameState | null>(null);
  const [online, setOnline] = useState(false);
  const [mapImages, setMapImages] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch('/map-api/game-state');
        if (!res.ok) { setOnline(false); return; }
        const json = await res.json();
        if (json.error) { setOnline(false); return; }
        if (active) { setData(json); setOnline(true); }
      } catch {
        if (active) setOnline(false);
      }
    }

    async function loadMapImages() {
      try {
        const res = await fetch('/map-api/maps');
        if (res.ok) {
          const imgs = await res.json();
          if (active) setMapImages(imgs);
        }
      } catch { /* ignore */ }
    }

    poll();
    loadMapImages();
    const id = setInterval(poll, 5000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const waveLabel = data ? `${data.wave.current} / ${data.wave.total}` : '—';
  const waveStatus = data
    ? data.wave.traderTime ? 'Trader Time' : data.wave.inProgress ? 'In Progress' : 'Waiting'
    : '';

  const mapImgPath = data?.map ? mapImages[data.map] : null;
  const mapImgUrl = mapImgPath ? '/map-api' + mapImgPath : null;

  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch">
      {/* Left: Stats panel */}
      <div className="flex-1 horror-card backdrop-blur-sm border rounded-lg p-6 shadow-2xl bg-gradient-to-br from-red-950/40 to-black/60 border-red-800/40 text-center">
        <div className="flex items-center justify-center mb-5">
          <div className={`w-3 h-3 rounded-full mr-2 ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <h3 className="text-xl font-bold text-white font-orbitron">
            {online ? 'Server Live' : 'Server Offline'}
          </h3>
        </div>

        {online && data ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <div className="text-2xl font-bold text-red-400 font-orbitron">{data.playerCount}</div>
                <div className="text-gray-400 text-sm">Players</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white font-orbitron">{waveLabel}</div>
                <div className={`text-sm ${data.wave.traderTime ? 'text-green-400' : data.wave.inProgress ? 'text-red-400' : 'text-gray-400'}`}>
                  Wave {waveStatus && `· ${waveStatus}`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <div className="text-lg font-bold text-white font-orbitron">{data.map.replace('KF-', '')}</div>
                <div className="text-gray-400 text-sm">Current Map</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white font-orbitron">{data.difficulty}</div>
                <div className="text-gray-400 text-sm">Difficulty</div>
              </div>
            </div>

            {data.zeds.alive > 0 && (
              <div className="mb-4 px-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Zeds Alive</span>
                  <span className="text-red-400 font-mono">{data.zeds.alive}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (data.zeds.alive / Math.max(data.zeds.maxAtOnce, 1)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

          </>
        ) : (
          <div className="py-4 text-gray-500">
            <i className="ri-server-line text-3xl block mb-2"></i>
            <p className="text-sm">Server data unavailable</p>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <div>Server IP: <span className="text-red-400 font-mono">94.130.51.236:7707</span></div>
          <div>Discord: <span className="text-red-400">coming soon</span></div>
        </div>
      </div>

      {/* Right: Map image */}
      {online && data && mapImgUrl && (
        <div className="flex-1 horror-card backdrop-blur-sm border rounded-lg shadow-2xl bg-black/60 border-red-900/30 overflow-hidden flex flex-col">
          <div className="flex-1 relative">
            <img
              src={mapImgUrl}
              alt={data.map}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Now Playing</div>
              <div className="text-2xl font-bold text-white font-orbitron">{data.map}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
