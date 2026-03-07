# Custom In-Game ScoreBoard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace KF1's stock Tab scoreboard with a custom one showing per-monster kill breakdowns matching the website's LiveScoreboard.

**Architecture:** LinkedReplicationInfo subclass replicates 10 monster kill ints per player to all clients. Custom ScoreBoard class draws the table via Canvas. Mutator sets ScoreBoardType and manages UliunaiPRI lifecycle.

**Tech Stack:** UnrealScript (UE2), KF1 SDK classes (KFGameType, KFPlayerReplicationInfo, KFMonster)

---

### Task 1: Create UliunaiPRI (replicated kill data)

**Files:**
- Create: `kf1/mutator/Classes/UliunaiPRI.uc`

**Step 1: Create the LinkedReplicationInfo subclass**

10 replicated ints matching MonsterKillData in UliunaiStats. Reliable server->client replication.

**Step 2: Commit**

```bash
git add kf1/mutator/Classes/UliunaiPRI.uc
git commit -m "feat: add UliunaiPRI replicated kill data class"
```

---

### Task 2: Create UliunaiScoreBoard (Canvas drawing)

**Files:**
- Create: `kf1/mutator/Classes/UliunaiScoreBoard.uc`

**Step 1: Create the ScoreBoard subclass**

Override `DrawScoreBoard(Canvas C)`. Layout:
- Header bar: map name, wave/total, difficulty, player count with status dot
- Column headers: #, Player, Perk, Kills, CLO, GOR, CRA, STA, BLO, SIR, HUS, SCR, FP, BOSS, Cash, HP, Ping
- Player rows: sorted by total kills descending
- Colors matching website: per-perk colors, per-monster header colors, HP color thresholds
- Background: semi-transparent dark red/black

Helper: `FindUliunaiPRI(PRI)` walks LinkedReplicationInfo chain to find UliunaiPRI.

**Step 2: Commit**

```bash
git add kf1/mutator/Classes/UliunaiScoreBoard.uc
git commit -m "feat: add custom scoreboard with monster kill breakdown"
```

---

### Task 3: Wire UliunaiPRI into UliunaiStats

**Files:**
- Modify: `kf1/mutator/Classes/UliunaiStats.uc`

**Step 1: Set ScoreBoardType in PostBeginPlay**

Add `Level.Game.ScoreBoardType = class'UliunaiScoreBoard';` after KFGT assignment.

**Step 2: Spawn UliunaiPRI for each player in TrackSessions**

When a new session is created (player joins), spawn UliunaiPRI and link to their PRI via CustomReplicationInfo chain.

**Step 3: Add UpdateUliunaiPRI helper**

Called after KillTracking is updated in RecordCumulativeKill or from a new helper. Finds the player's UliunaiPRI and syncs the kill counts from KillTracking.

**Step 4: Call UpdateUliunaiPRI from ScoreKill flow**

After KillTracking[idx] is incremented in UliunaiStatsRules.ScoreKill, also update the UliunaiPRI. Simplest: add a `SyncPRI(Controller)` function in UliunaiStats called from ScoreKill via StatsMutator.

**Step 5: Commit**

```bash
git add kf1/mutator/Classes/UliunaiStats.uc
git commit -m "feat: wire UliunaiPRI spawning and kill sync into mutator"
```

---

### Task 4: Final commit and compilation notes

**Step 1: Verify all files**

Ensure UliunaiPRI and UliunaiScoreBoard are in `kf1/mutator/Classes/`.

**Step 2: Commit design doc + plan**

```bash
git add docs/plans/
git commit -m "docs: add custom scoreboard design and implementation plan"
```

**Compilation (manual, on dev machine):**
```bash
cd "D:/SteamLibrary/steamapps/common/KillingFloorBeta/System"
rm -f steam_appid.txt
./ucc.exe make
```

**Deployment:**
```bash
scp kf1/mutator/UliunaiStats.u hetzner:/home/uliunai/kf-server/System/
scp kf1/mutator/UliunaiStats.int hetzner:/home/uliunai/kf-server/System/
systemctl restart kf1-server
```
