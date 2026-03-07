# Remove Dummy Data

Temporary dummy data was added for frontend testing while the UliunaiStats mutator
is not yet compiled and deployed. Remove all of it once real data is flowing.

## Server-side (Hetzner SSH)

### 1. Restore API STATS_PATH
The map-images API was pointed to a dummy file instead of the real mutator output.

- **File:** `/home/uliunai/kf1/map-images/api/server.js`
- **Change:** `STATS_PATH` variable — change it back from `UliunaiStats-dummy.log` to `UliunaiStats.log`
- **Then restart:** `systemctl restart kf1-map-images`

### 2. Delete dummy JSON files
- `ssh hetzner`
- `rm /home/uliunai/kf-server/UserLogs/UliunaiStats-dummy.log`
- `rm /home/uliunai/kf-server/UserLogs/UliunaiLeaderboard.log`

(The real mutator will recreate `UliunaiLeaderboard.log` with real data once deployed.)

## KF1 WebAdmin (kf1/webadmin/)

### 3. OverviewPage.vue (two blocks)
- **File:** `kf1/webadmin/src/pages/OverviewPage.vue`
- **Search for:** `// TODO: Remove dummy data` (appears twice)
- **Remove block 1:** The `if (gameData.value.players.length === 0) { ... }` block that injects 15 dummy PlayerStats
- **Remove block 2:** The `if (!gameState.value || gameState.value.players.length === 0) { ... }` block that injects 15 dummy GameStatePlayer objects for the live scoreboard

### 4. PlayersPage.vue
- **File:** `kf1/webadmin/src/pages/PlayersPage.vue`
- **Search for:** `// TODO: Remove dummy data`
- **Remove:** The entire `if (data.value.players.length === 0) { ... }` block that injects 6 dummy Player objects

### After removing, rebuild and deploy:
```bash
cd kf1/webadmin && npm run build
scp -r dist/* hetzner:/home/uliunai/kf1/webadmin/dist/
```

## KF1 Website (kf1/website/)

The website has NO dummy data in its source code — it reads from the API endpoints
(`/map-api/game-state` and `/map-api/leaderboard`) which serve the dummy JSON files
listed in steps 1-2 above. Once those are restored, the website automatically shows
real data. No code changes needed.

## Prerequisite: Deploy the mutator first

Before removing dummy data, the compiled mutator must be deployed so real data flows:

1. Compile: `ucc.exe make` (see CLAUDE.md for compilation steps)
2. Deploy: `scp kf1/mutator/UliunaiStats.u hetzner:/home/uliunai/kf-server/System/`
3. Restart KF1 server: `ssh hetzner 'systemctl restart kf1-server'`
4. Wait for players to join and verify data appears in the JSON files
5. Then remove all dummy data per the steps above
