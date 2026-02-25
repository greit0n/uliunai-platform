import { useState, useEffect } from 'react';
import Card from '../base/Card';

/**
 * Server statistics data structure.
 * 
 * @interface ServerStats
 * @property {number} playerCount - Current number of players online
 * @property {number} maxPlayers - Maximum number of players the server supports
 * @property {string} currentMap - Name of the currently active map
 * @property {'online' | 'offline'} status - Server connection status
 */
interface ServerStats {
  playerCount: number;
  maxPlayers: number;
  currentMap: string;
  status: 'online' | 'offline';
}

/**
 * LiveStats component displaying real-time server information.
 * 
 * @description Shows current server status including player count, maximum players,
 * current map, and online/offline status. Updates automatically every 10 seconds
 * with simulated data. In production, this would connect to a real server API.
 * 
 * @returns {JSX.Element} A card displaying live server statistics
 */
export default function LiveStats() {
  const [stats, setStats] = useState<ServerStats>({
    playerCount: 24,
    maxPlayers: 32,
    currentMap: 'KF-BioticsLab',
    status: 'online'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        playerCount: Math.floor(Math.random() * 32) + 1,
        currentMap: ['KF-BioticsLab', 'KF-Manor', 'KF-WestLondon', 'KF-Farm'][Math.floor(Math.random() * 4)]
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card variant="blood" className="text-center">
      <div className="flex items-center justify-center mb-4">
        <div className={`w-3 h-3 rounded-full mr-2 ${stats.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <h3 className="text-xl font-bold text-white font-orbitron">Server Status</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-red-400 font-orbitron">{stats.playerCount}/{stats.maxPlayers}</div>
          <div className="text-gray-400 text-sm">Players Online</div>
        </div>
        <div>
          <div className="text-lg font-bold text-white font-orbitron">{stats.currentMap}</div>
          <div className="text-gray-400 text-sm">Current Map</div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Server IP: <span className="text-red-400 font-mono">uliunai.lt:7707</span>
      </div>
    </Card>
  );
}
