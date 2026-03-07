# UliunaiStats — KF1 Live Game State Exporter

Server-side mutator that writes live game data to a JSON file every 2 seconds. Any external tool (Node.js API, website, Discord bot) can read the file for real-time stats.

## Data Exported

- **Wave**: current number, total waves, in-progress vs trader time
- **Players**: name, perk, perk level, kills, cash, health, deaths, ping
- **Zeds**: alive count, max simultaneous
- **Game**: difficulty, map name

## Output

Writes to `<KF_DIR>/UliunaiStats.json`:

```json
{
  "wave": { "current": 3, "total": 10, "inProgress": true, "traderTime": false },
  "zeds": { "alive": 12, "maxAtOnce": 16 },
  "difficulty": "Hard",
  "difficultyNum": 4,
  "map": "KF-BioticsLab",
  "players": [
    {
      "name": "Player1",
      "perk": "Berserker",
      "perkLevel": 6,
      "kills": 45,
      "cash": 1500,
      "health": 100,
      "maxHealth": 100,
      "deaths": 0,
      "ping": 30
    }
  ],
  "playerCount": 1
}
```

## Compile

1. Copy the `UliunaiStats/` folder (with `Classes/`) into your KF directory:

   ```
   KillingFloor/
   ├── System/
   │   └── KillingFloor.ini
   └── UliunaiStats/         ← this folder
       └── Classes/
           └── UliunaiStats.uc
   ```

2. Edit `KillingFloor.ini`, under `[Editor.EditorEngine]` add:

   ```ini
   EditPackages=UliunaiStats
   ```

3. Compile:

   ```cmd
   cd System
   ucc.exe make
   ```

   This produces `System/UliunaiStats.u`.

## Install on Any Server

1. Copy `UliunaiStats.u` and `UliunaiStats.int` to the server's `System/` directory
2. Add to server launch command:

   ```
   ?Mutator=UliunaiStats.UliunaiStats
   ```

   Or if you already have mutators:

   ```
   ?Mutator=ExistingMut.ExistingMut,UliunaiStats.UliunaiStats
   ```

## Configuration

After first run, `UliunaiStats.ini` is created in `System/`:

```ini
[UliunaiStats.UliunaiStats]
WriteInterval=2.0
```

Change `WriteInterval` to adjust how often the JSON file is written (in seconds).

## Performance

Writing a ~1KB JSON file every 2 seconds has negligible impact on server performance. KF1 dedicated servers typically use <5% CPU on modern hardware.
