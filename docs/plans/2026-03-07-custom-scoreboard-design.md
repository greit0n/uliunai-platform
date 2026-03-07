# Custom In-Game ScoreBoard Design

Replace KF1's stock Tab scoreboard with a custom one showing per-monster kill breakdowns, matching the website's LiveScoreboard 1:1.

## Architecture

3 new UnrealScript classes + 1 modified:

| File | Purpose |
|------|---------|
| `UliunaiScoreBoard.uc` | Custom ScoreBoard — draws full table via Canvas |
| `UliunaiPRI.uc` | LinkedReplicationInfo — replicates 10 per-monster kill ints to clients |
| `UliunaiStats.uc` (modified) | Sets ScoreBoardType, spawns UliunaiPRI per player, updates on kills |
| `UliunaiStatsRules.uc` | No changes needed — kills flow through mutator to UliunaiPRI |

## Data Flow

```
Server: Monster killed
  -> UliunaiStatsRules.ScoreKill()
  -> UliunaiStats.RecordCumulativeKill() + KillTracking[] (existing)
  -> UliunaiPRI.Clot++ (replicated to all clients)

Client: Player presses Tab
  -> HUD sets bShowScoreBoard = true
  -> UliunaiScoreBoard.DrawScoreBoard(Canvas)
  -> Iterates all PRIs, finds each player's UliunaiPRI via LinkedReplicationInfo chain
  -> Draws the table with Canvas
```

## Replication (UliunaiPRI)

Standard UE2 LinkedReplicationInfo pattern. 10 replicated ints (Clot through Boss), chained to each player's PRI via `CustomReplicationInfo`. Mutator spawns one per player during session tracking.

## Layout (17 columns)

```
#  Player  Perk  Kills  CLO GOR CRA STA BLO SIR HUS SCR FP BOSS  Cash  HP  Ping
```

Header bar shows: map name, wave progress, difficulty, player count with status dot.

## Visual Style (Horror Theme)

- Background: semi-transparent dark red/black (#0a0000 at ~85% opacity)
- Header row: dark red (#1a0808)
- Monster column headers: per-type colors (gray, red, green, purple, yellow, pink, orange, cyan, red, yellow)
- Perk text: per-perk colors (red=Berserker, blue=Medic, lime=Support, sky=Sharp, green=Commando, orange=Firebug, yellow=Demo)
- HP: green >60%, yellow >25%, red below; "DEAD" if 0
- Zero values: dimmed gray

## ScoreBoard Replacement

`Level.Game.ScoreBoardType = class'UliunaiScoreBoard'` in mutator's PostBeginPlay(). Read when player HUD is created on connect.

## Decisions

- Deaths column dropped (website doesn't show it)
- Ping kept (useful in-game)
- Full 1:1 match with website columns
- Replaces stock Tab scoreboard entirely
- Horror theme first, stock KF1 style available as future option
