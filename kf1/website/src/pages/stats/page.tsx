import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../../components/feature/Navigation';
import Footer from '../../components/feature/Footer';

interface PerkStats {
  level: number;
  time: number;
  kills: number;
}

interface MonsterKills {
  clot: number;
  gorefast: number;
  crawler: number;
  stalker: number;
  bloat: number;
  siren: number;
  husk: number;
  scrake: number;
  fleshpound: number;
  boss: number;
  other: number;
}

interface PlayerStats {
  steamId: string;
  name: string;
  firstSeen: string;
  lastSeen: string;
  totalKills: number;
  monsterKills: MonsterKills;
  headshots: number;
  deaths: number;
  damageDealt: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  highestWave: number;
  bestGameKills: number;
  longestKillStreak: number;
  zedTimeTriggers: number;
  playtimeSeconds: number;
  cashEarned: number;
  perks: Record<string, PerkStats>;
}

interface LeaderboardData {
  players: PlayerStats[];
  totalPlayers: number;
}

type Tab = 'general' | 'enemies' | 'misc';

const PERK_NAMES: Record<string, string> = {
  medic: 'Medic',
  support: 'Support',
  sharpshooter: 'Sharpshooter',
  commando: 'Commando',
  berserker: 'Berserker',
  firebug: 'Firebug',
  demolitions: 'Demolitions',
};

const PERK_COLORS: Record<string, string> = {
  medic: 'text-blue-400',
  support: 'text-lime-400',
  sharpshooter: 'text-sky-300',
  commando: 'text-green-400',
  berserker: 'text-red-400',
  firebug: 'text-orange-400',
  demolitions: 'text-yellow-400',
};

const PERK_BG: Record<string, string> = {
  medic: 'bg-blue-900/20',
  support: 'bg-lime-900/20',
  sharpshooter: 'bg-sky-900/20',
  commando: 'bg-green-900/20',
  berserker: 'bg-red-900/20',
  firebug: 'bg-orange-900/20',
  demolitions: 'bg-yellow-900/20',
};

const MONSTER_COLS = [
  { key: 'clot', label: 'Clot', color: 'text-gray-300' },
  { key: 'gorefast', label: 'Gorefast', color: 'text-red-400' },
  { key: 'crawler', label: 'Crawler', color: 'text-green-400' },
  { key: 'stalker', label: 'Stalker', color: 'text-purple-400' },
  { key: 'bloat', label: 'Bloat', color: 'text-yellow-400' },
  { key: 'siren', label: 'Siren', color: 'text-pink-400' },
  { key: 'husk', label: 'Husk', color: 'text-orange-400' },
  { key: 'scrake', label: 'Scrake', color: 'text-cyan-400' },
  { key: 'fleshpound', label: 'FP', color: 'text-red-500' },
  { key: 'boss', label: 'Boss', color: 'text-yellow-300' },
] as const;

function formatTime(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function getFavoritePerk(perks: Record<string, PerkStats>): string {
  let best = '';
  let bestTime = 0;
  for (const [key, val] of Object.entries(perks)) {
    if (val.time > bestTime) { bestTime = val.time; best = key; }
  }
  return best;
}

function winRate(p: PlayerStats): string {
  if (p.gamesPlayed === 0) return '0%';
  return Math.round((p.gamesWon / p.gamesPlayed) * 100) + '%';
}

function kd(p: PlayerStats): string {
  if (p.deaths === 0) return p.totalKills > 0 ? '∞' : '0';
  return (p.totalKills / p.deaths).toFixed(1);
}

export default function StatsPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('general');
  const [sortKey, setSortKey] = useState<string>('totalKills');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  useEffect(() => {
    fetch('/map-api/leaderboard')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const players = data?.players ?? [];

  const sorted = [...players].sort((a, b) => {
    let va: number | string = 0;
    let vb: number | string = 0;
    switch (sortKey) {
      case 'name': va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break;
      case 'totalKills': va = a.totalKills; vb = b.totalKills; break;
      case 'headshots': va = a.headshots; vb = b.headshots; break;
      case 'deaths': va = a.deaths; vb = b.deaths; break;
      case 'kd': va = a.deaths > 0 ? a.totalKills / a.deaths : a.totalKills; vb = b.deaths > 0 ? b.totalKills / b.deaths : b.totalKills; break;
      case 'damageDealt': va = a.damageDealt; vb = b.damageDealt; break;
      case 'gamesPlayed': va = a.gamesPlayed; vb = b.gamesPlayed; break;
      case 'gamesWon': va = a.gamesWon; vb = b.gamesWon; break;
      case 'winRate': va = a.gamesPlayed > 0 ? a.gamesWon / a.gamesPlayed : 0; vb = b.gamesPlayed > 0 ? b.gamesWon / b.gamesPlayed : 0; break;
      case 'highestWave': va = a.highestWave; vb = b.highestWave; break;
      case 'bestGameKills': va = a.bestGameKills; vb = b.bestGameKills; break;
      case 'longestKillStreak': va = a.longestKillStreak; vb = b.longestKillStreak; break;
      case 'zedTimeTriggers': va = a.zedTimeTriggers; vb = b.zedTimeTriggers; break;
      case 'playtimeSeconds': va = a.playtimeSeconds; vb = b.playtimeSeconds; break;
      default:
        if (sortKey in a.monsterKills) {
          va = a.monsterKills[sortKey as keyof MonsterKills];
          vb = b.monsterKills[sortKey as keyof MonsterKills];
        }
    }
    if (typeof va === 'string' && typeof vb === 'string')
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return null;
    return <span className="inline-block w-0 overflow-visible text-red-400 whitespace-nowrap"><span className="ml-1">{sortDir === 'desc' ? '▼' : '▲'}</span></span>;
  }

  const totalKills = players.reduce((s, p) => s + p.totalKills, 0);
  const totalPlaytime = players.reduce((s, p) => s + p.playtimeSeconds, 0);
  const totalWins = players.reduce((s, p) => s + p.gamesWon, 0);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'general', label: 'General', icon: 'ri-sword-line' },
    { key: 'enemies', label: 'Enemy Kills', icon: 'ri-skull-2-line' },
    { key: 'misc', label: 'Misc', icon: 'ri-trophy-line' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main className="relative z-10 pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Link to="/" className="text-gray-400 hover:text-red-400 transition-colors text-sm mb-4 inline-block">
              <i className="ri-arrow-left-s-line"></i> Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold font-orbitron horror-heading">
              <span className="text-red-500">Player</span> Statistics
            </h1>
            <p className="text-gray-400 mt-2">Cumulative stats tracked across all games on the Uliunai server. Click a player to see their perks.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="horror-card backdrop-blur-sm border rounded-lg p-5 bg-gradient-to-br from-red-950/30 to-black/60 border-red-800/40 text-center">
              <div className="text-3xl font-bold text-red-400 font-orbitron">{players.length}</div>
              <div className="text-gray-400 text-sm mt-1">Players Tracked</div>
            </div>
            <div className="horror-card backdrop-blur-sm border rounded-lg p-5 bg-gradient-to-br from-red-950/30 to-black/60 border-red-800/40 text-center">
              <div className="text-3xl font-bold text-white font-orbitron">{formatNumber(totalKills)}</div>
              <div className="text-gray-400 text-sm mt-1">Total Kills</div>
            </div>
            <div className="horror-card backdrop-blur-sm border rounded-lg p-5 bg-gradient-to-br from-red-950/30 to-black/60 border-red-800/40 text-center">
              <div className="text-3xl font-bold text-green-400 font-orbitron">{formatTime(totalPlaytime)}</div>
              <div className="text-gray-400 text-sm mt-1">Total Playtime</div>
            </div>
            <div className="horror-card backdrop-blur-sm border rounded-lg p-5 bg-gradient-to-br from-red-950/30 to-black/60 border-red-800/40 text-center">
              <div className="text-3xl font-bold text-yellow-400 font-orbitron">{totalWins}</div>
              <div className="text-gray-400 text-sm mt-1">Total Victories</div>
            </div>
          </div>

          <div className="horror-card backdrop-blur-sm border rounded-lg shadow-2xl bg-gradient-to-br from-red-950/20 to-black/60 border-red-800/40 overflow-hidden">
            <div className="flex border-b border-red-900/20 px-2">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setExpandedPlayer(null); setSortKey(t.key === 'general' ? 'totalKills' : t.key === 'enemies' ? 'totalKills' : 'gamesPlayed'); setSortDir('desc'); }}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 border-b-2 -mb-px ${
                    tab === t.key
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <i className={t.icon}></i>
                  {t.label}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="py-20 text-center">
                <i className="ri-loader-4-line text-3xl text-red-500 animate-spin block mb-3"></i>
                <p className="text-gray-400">Loading statistics...</p>
              </div>
            ) : players.length === 0 ? (
              <div className="py-20 text-center">
                <i className="ri-bar-chart-grouped-line text-4xl text-gray-600 block mb-3"></i>
                <p className="text-gray-400 text-lg">No player data yet</p>
                <p className="text-gray-600 text-sm mt-1">Stats will appear once players join the server</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[696px] overflow-y-auto">
                {tab === 'general' && <GeneralTable players={sorted} toggleSort={toggleSort} SortIcon={SortIcon} expandedPlayer={expandedPlayer} setExpandedPlayer={setExpandedPlayer} />}
                {tab === 'enemies' && <EnemiesTable players={sorted} toggleSort={toggleSort} SortIcon={SortIcon} expandedPlayer={expandedPlayer} setExpandedPlayer={setExpandedPlayer} />}
                {tab === 'misc' && <MiscTable players={sorted} toggleSort={toggleSort} SortIcon={SortIcon} expandedPlayer={expandedPlayer} setExpandedPlayer={setExpandedPlayer} />}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

interface TableProps {
  players: PlayerStats[];
  toggleSort: (key: string) => void;
  SortIcon: React.FC<{ col: string }>;
  expandedPlayer: string | null;
  setExpandedPlayer: (id: string | null) => void;
}

function ThButton({ col, label, className, toggleSort, SortIcon }: { col: string; label: string; className?: string; toggleSort: (k: string) => void; SortIcon: React.FC<{ col: string }> }) {
  return (
    <th className={`px-3 py-3 font-bold cursor-pointer hover:text-white transition-colors select-none ${className ?? ''}`} onClick={() => toggleSort(col)}>
      {label}<SortIcon col={col} />
    </th>
  );
}

function PerkExpansion({ player }: { player: PlayerStats }) {
  const perks = Object.entries(PERK_NAMES)
    .map(([key, label]) => ({ key, label, ...(player.perks[key] || { level: 0, time: 0, kills: 0 }) }))
    .filter(p => p.level > 0 || p.time > 0 || p.kills > 0);

  if (perks.length === 0) {
    return (
      <div className="px-6 py-4 text-gray-500 text-sm text-center">No perk data available</div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {perks.map(p => (
          <div key={p.key} className={`rounded-lg p-3 ${PERK_BG[p.key] || 'bg-white/5'} border border-white/5`}>
            <div className={`text-sm font-bold ${PERK_COLORS[p.key] || 'text-gray-300'}`}>{p.label}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Level</span>
                <span className="text-white font-mono font-bold">{p.level}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Time</span>
                <span className="text-gray-300 font-mono">{formatTime(p.time)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Kills</span>
                <span className="text-gray-300 font-mono">{p.kills.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tables ──────────────────────────────────────────────────────────────────

function GeneralTable({ players, toggleSort, SortIcon, expandedPlayer, setExpandedPlayer }: TableProps) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="bg-[#1a0808] text-gray-300 text-left">
          <th className="px-3 py-3 font-bold w-8">#</th>
          <ThButton col="name" label="Player" className="text-left" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="totalKills" label="Kills" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="headshots" label="Headshots" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="deaths" label="Deaths" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="kd" label="K/D" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="damageDealt" label="Damage" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="playtimeSeconds" label="Playtime" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <th className="px-3 py-3 font-bold text-right">Fav Perk</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p, i) => {
          const fav = getFavoritePerk(p.perks);
          const isExpanded = expandedPlayer === p.steamId;
          return (
            <ExpandableRow key={p.steamId} player={p} isExpanded={isExpanded} onToggle={() => setExpandedPlayer(isExpanded ? null : p.steamId)} colSpan={9}>
              <td className="px-3 py-2.5 text-gray-500 font-mono">{i + 1}</td>
              <td className="px-3 py-2.5 text-white font-medium truncate max-w-[180px]">
                {p.name}
                <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line ml-1.5 text-gray-600 text-xs`}></i>
              </td>
              <td className="px-3 py-2.5 text-right text-white font-mono font-bold">{p.totalKills.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right text-yellow-400 font-mono">{p.headshots.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right text-gray-400 font-mono">{p.deaths.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-right text-green-400 font-mono">{kd(p)}</td>
              <td className="px-3 py-2.5 text-right text-orange-400 font-mono">{formatNumber(p.damageDealt)}</td>
              <td className="px-3 py-2.5 text-right text-gray-300 font-mono">{formatTime(p.playtimeSeconds)}</td>
              <td className="px-3 py-2.5 text-right">
                {fav && (
                  <span className={`${PERK_COLORS[fav] || 'text-gray-400'} ${PERK_BG[fav] || 'bg-white/5'} px-2 py-0.5 rounded text-xs font-mono`}>
                    {PERK_NAMES[fav] || fav}
                  </span>
                )}
              </td>
            </ExpandableRow>
          );
        })}
      </tbody>
    </table>
  );
}

function EnemiesTable({ players, toggleSort, SortIcon, expandedPlayer, setExpandedPlayer }: TableProps) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="bg-[#1a0808] text-gray-300 text-left">
          <th className="px-3 py-3 font-bold w-8">#</th>
          <ThButton col="name" label="Player" className="text-left" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="totalKills" label="Total" className="text-right text-white" toggleSort={toggleSort} SortIcon={SortIcon} />
          {MONSTER_COLS.map(c => (
            <ThButton key={c.key} col={c.key} label={c.label} className={`text-right font-bold ${c.color}`} toggleSort={toggleSort} SortIcon={SortIcon} />
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((p, i) => {
          const isExpanded = expandedPlayer === p.steamId;
          return (
            <ExpandableRow key={p.steamId} player={p} isExpanded={isExpanded} onToggle={() => setExpandedPlayer(isExpanded ? null : p.steamId)} colSpan={3 + MONSTER_COLS.length}>
              <td className="px-3 py-2.5 text-gray-500 font-mono">{i + 1}</td>
              <td className="px-3 py-2.5 text-white font-medium truncate max-w-[160px]">
                {p.name}
                <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line ml-1.5 text-gray-600 text-xs`}></i>
              </td>
              <td className="px-3 py-2.5 text-right text-white font-mono font-bold">{p.totalKills.toLocaleString()}</td>
              {MONSTER_COLS.map(c => {
                const val = p.monsterKills[c.key as keyof MonsterKills];
                return (
                  <td key={c.key} className={`px-2 py-2.5 text-right font-mono ${val > 0 ? c.color : 'text-gray-700'}`}>
                    {val.toLocaleString()}
                  </td>
                );
              })}
            </ExpandableRow>
          );
        })}
      </tbody>
    </table>
  );
}

function MiscTable({ players, toggleSort, SortIcon, expandedPlayer, setExpandedPlayer }: TableProps) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10">
        <tr className="bg-[#1a0808] text-gray-300 text-left">
          <th className="px-3 py-3 font-bold w-8">#</th>
          <ThButton col="name" label="Player" className="text-left" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="gamesPlayed" label="Games" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="gamesWon" label="Wins" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="winRate" label="Win %" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="highestWave" label="Best Wave" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="bestGameKills" label="Best Game" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="longestKillStreak" label="Kill Streak" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <ThButton col="zedTimeTriggers" label="ZT Triggers" className="text-right" toggleSort={toggleSort} SortIcon={SortIcon} />
          <th className="px-3 py-3 font-bold text-right">First Seen</th>
          <th className="px-3 py-3 font-bold text-right">Last Seen</th>
        </tr>
      </thead>
      <tbody>
        {players.map((p, i) => {
          const isExpanded = expandedPlayer === p.steamId;
          return (
            <ExpandableRow key={p.steamId} player={p} isExpanded={isExpanded} onToggle={() => setExpandedPlayer(isExpanded ? null : p.steamId)} colSpan={11}>
              <td className="px-3 py-2.5 text-gray-500 font-mono">{i + 1}</td>
              <td className="px-3 py-2.5 text-white font-medium truncate max-w-[160px]">
                {p.name}
                <i className={`ri-arrow-${isExpanded ? 'up' : 'down'}-s-line ml-1.5 text-gray-600 text-xs`}></i>
              </td>
              <td className="px-3 py-2.5 text-right text-gray-300 font-mono">{p.gamesPlayed}</td>
              <td className="px-3 py-2.5 text-right text-green-400 font-mono">{p.gamesWon}</td>
              <td className="px-3 py-2.5 text-right text-yellow-400 font-mono">{winRate(p)}</td>
              <td className="px-3 py-2.5 text-right text-cyan-400 font-mono">{p.highestWave}</td>
              <td className="px-3 py-2.5 text-right text-orange-400 font-mono">{p.bestGameKills}</td>
              <td className="px-3 py-2.5 text-right text-red-400 font-mono">{p.longestKillStreak}</td>
              <td className="px-3 py-2.5 text-right text-purple-400 font-mono">×{p.zedTimeTriggers}</td>
              <td className="px-3 py-2.5 text-right text-gray-500 font-mono text-xs">{p.firstSeen}</td>
              <td className="px-3 py-2.5 text-right text-gray-500 font-mono text-xs">{p.lastSeen}</td>
            </ExpandableRow>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Expandable Row ──────────────────────────────────────────────────────────

function ExpandableRow({ player, isExpanded, onToggle, colSpan, children }: {
  player: PlayerStats;
  isExpanded: boolean;
  onToggle: () => void;
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-t border-red-900/15 cursor-pointer transition-[background-color] ${isExpanded ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
      >
        {children}
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={colSpan} className="bg-black/40 border-t border-red-900/10">
            <PerkExpansion player={player} />
          </td>
        </tr>
      )}
    </>
  );
}
