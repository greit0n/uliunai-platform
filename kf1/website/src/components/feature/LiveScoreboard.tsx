import { useState, useEffect } from 'react';

interface MonsterKills {
  clot: number
  gorefast: number
  crawler: number
  stalker: number
  bloat: number
  siren: number
  husk: number
  scrake: number
  fleshpound: number
  boss: number
  other: number
}

interface PlayerData {
  name: string
  perk: string
  perkLevel: number
  kills: number
  monsterKills?: MonsterKills
  cash: number
  health: number
  maxHealth: number
  deaths: number
  ping: number
}

interface GameState {
  wave: { current: number; total: number; inProgress: boolean; traderTime: boolean }
  zeds: { alive: number; maxAtOnce: number }
  difficulty: string
  map: string
  players: PlayerData[]
  playerCount: number
}

const PERK_COLORS: Record<string, string> = {
  Berserker: 'text-red-400 bg-red-900/30',
  FieldMedic: 'text-blue-400 bg-blue-900/30',
  SupportSpec: 'text-lime-400 bg-lime-900/30',
  Sharpshooter: 'text-sky-300 bg-sky-900/30',
  Commando: 'text-green-400 bg-green-900/30',
  Firebug: 'text-orange-400 bg-orange-900/30',
  Demolitions: 'text-yellow-400 bg-yellow-900/30',
};

const MONSTER_COLS = [
  { key: 'clot', label: 'CLO', color: 'text-gray-300' },
  { key: 'gorefast', label: 'GOR', color: 'text-red-400' },
  { key: 'crawler', label: 'CRA', color: 'text-green-400' },
  { key: 'stalker', label: 'STA', color: 'text-purple-400' },
  { key: 'bloat', label: 'BLO', color: 'text-yellow-400' },
  { key: 'siren', label: 'SIR', color: 'text-pink-400' },
  { key: 'husk', label: 'HUS', color: 'text-orange-400' },
  { key: 'scrake', label: 'SCR', color: 'text-cyan-400' },
  { key: 'fleshpound', label: 'FP', color: 'text-red-500' },
  { key: 'boss', label: 'BOSS', color: 'text-yellow-300' },
] as const;

export default function LiveScoreboard() {
  const [data, setData] = useState<GameState | null>(null);
  const [online, setOnline] = useState(false);

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

    poll();
    const id = setInterval(poll, 5000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const totalKills = (p: PlayerData) =>
    p.monsterKills
      ? Object.values(p.monsterKills).reduce((a, b) => a + b, 0)
      : p.kills;

  const sorted = online && data ? [...data.players].sort((a, b) => totalKills(b) - totalKills(a)) : [];
  const hasPlayers = sorted.length > 0;

  return (
    <div className="horror-card backdrop-blur-sm border rounded-lg shadow-2xl bg-gradient-to-br from-red-950/20 to-black/60 border-red-800/30 overflow-hidden">
      {/* Status bar */}
      <div className="px-5 py-3 border-b border-red-900/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500/60'}`}></div>
          <span className="text-sm text-gray-400">
            {!online ? 'Server offline' : hasPlayers ? `${sorted.length} player${sorted.length !== 1 ? 's' : ''} online` : 'Server online — no players'}
          </span>
        </div>
        {online && data && (
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span><span className="text-gray-400">{data.map.replace('KF-', '')}</span></span>
            <span>Wave <span className="text-white font-mono">{data.wave.current}/{data.wave.total}</span></span>
            <span className="text-gray-400">{data.difficulty}</span>
          </div>
        )}
      </div>

      {!online ? (
        <div className="py-14 text-center">
          <i className="ri-server-line text-4xl text-gray-700 block mb-3"></i>
          <p className="text-gray-500">Server is currently offline</p>
          <p className="text-gray-600 text-xs mt-1">The scoreboard will appear when the server comes back online</p>
        </div>
      ) : !hasPlayers ? (
        <div className="py-14 text-center">
          <i className="ri-ghost-line text-4xl text-gray-700 block mb-3"></i>
          <p className="text-gray-500">No survivors in the field</p>
          <p className="text-gray-600 text-xs mt-1">Join the server and be the first!</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[696px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#1a0808] text-left">
                <th className="px-3 py-3 font-bold text-gray-300 w-8">#</th>
                <th className="px-3 py-3 font-bold text-gray-300">Player</th>
                <th className="px-3 py-3 font-bold text-gray-300">Perk</th>
                <th className="px-3 py-3 text-right font-bold text-white">Kills</th>
                {MONSTER_COLS.map(c => (
                  <th key={c.key} className={`px-2 py-3 text-right font-bold ${c.color}`}>
                    {c.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-bold text-yellow-400">Cash</th>
                <th className="px-3 py-3 text-right font-bold text-gray-300">HP</th>
                <th className="px-3 py-3 text-right font-bold text-gray-300">Ping</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const mk = p.monsterKills;
                const hpPct = p.maxHealth > 0 ? (p.health / p.maxHealth) * 100 : 0;
                const hpColor = hpPct > 60 ? 'text-green-400' : hpPct > 25 ? 'text-yellow-400' : 'text-red-400';
                return (
                  <tr key={i} className="border-t border-red-900/15 hover:bg-white/[0.03] transition-[background-color]">
                    <td className="px-3 py-2.5 text-gray-500 font-mono">{i + 1}</td>
                    <td className="px-3 py-2.5 text-white font-medium truncate max-w-[180px]">{p.name}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono ${PERK_COLORS[p.perk] || 'text-gray-300 bg-red-900/25'}`}>
                        {p.perk.replace('FieldMedic', 'Medic').replace('SupportSpec', 'Support')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-white font-mono font-bold">{totalKills(p)}</td>
                    {MONSTER_COLS.map(c => {
                      const val = mk ? mk[c.key] : 0;
                      return (
                        <td key={c.key} className={`px-2 py-2.5 text-right font-mono ${val > 0 ? c.color : 'text-gray-700'}`}>
                          {val}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right text-yellow-400/80 font-mono">£{p.cash}</td>
                    <td className={`px-3 py-2.5 text-right font-mono ${hpColor}`}>
                      {p.health > 0 ? p.health : <span className="text-red-600">DEAD</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-500 font-mono">{p.ping}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
