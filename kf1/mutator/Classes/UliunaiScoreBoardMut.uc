///////////////////////////////////////////////////////////////////////////////
// UliunaiScoreBoardMut — Separate mutator for custom in-game scoreboard
//
// Replaces KF1's stock Tab scoreboard with a horror-themed table showing
// per-monster kill breakdowns. Reads kill data from UliunaiStats mutator.
//
// Add BOTH to ServerActors in KillingFloor.ini:
//   ServerActors=UliunaiStats.UliunaiStats
//   ServerActors=UliunaiStats.UliunaiScoreBoardMut
///////////////////////////////////////////////////////////////////////////////
class UliunaiScoreBoardMut extends Mutator;

var UliunaiStats StatsMutator;
var float SyncInterval;

function PostBeginPlay()
{
    Super.PostBeginPlay();

    // Replace stock scoreboard
    Level.Game.ScoreBoardType = "UliunaiStats.UliunaiScoreBoard";

    // Find the UliunaiStats mutator instance
    FindStatsMutator();

    // Sync PRI data periodically
    SyncInterval = 1.0;
    SetTimer(SyncInterval, true);

    Log("UliunaiScoreBoardMut: Active — custom scoreboard enabled, sync every "$SyncInterval$"s");
}

function Timer()
{
    // Re-find if lost (e.g., map change)
    if (StatsMutator == None)
        FindStatsMutator();

    SpawnMissingPRIs();
    SyncAllKillsToPRI();
}

// ─────────────────────────────────────────────────────────────────────────────
// Find the UliunaiStats mutator in the actor list
// ─────────────────────────────────────────────────────────────────────────────

function FindStatsMutator()
{
    local UliunaiStats S;

    // ServerActors may not be in the BaseMutator chain — use AllActors
    foreach AllActors(class'UliunaiStats', S)
    {
        StatsMutator = S;
        Log("UliunaiScoreBoardMut: Found UliunaiStats instance");
        return;
    }

    Log("UliunaiScoreBoardMut: WARNING — UliunaiStats not found. Scoreboard will show basic kills only.");
}

// ─────────────────────────────────────────────────────────────────────────────
// Spawn UliunaiPRI for players who don't have one yet
// ─────────────────────────────────────────────────────────────────────────────

function SpawnMissingPRIs()
{
    local Controller C;
    local PlayerController PC;

    for (C = Level.ControllerList; C != None; C = C.NextController)
    {
        PC = PlayerController(C);
        if (PC == None) continue;
        if (PC.PlayerReplicationInfo == None) continue;
        if (PC.PlayerReplicationInfo.bOnlySpectator) continue;

        if (FindUliunaiPRI(PC.PlayerReplicationInfo) == None)
            SpawnUliunaiPRI(PC);
    }
}

/** Spawn a UliunaiPRI and chain it to the player's CustomReplicationInfo. */
function SpawnUliunaiPRI(PlayerController PC)
{
    local UliunaiPRI NewPRI;
    local PlayerReplicationInfo PRI;

    PRI = PC.PlayerReplicationInfo;
    if (PRI == None) return;

    NewPRI = Spawn(class'UliunaiPRI');
    if (NewPRI == None) return;

    NewPRI.NextReplicationInfo = PRI.CustomReplicationInfo;
    PRI.CustomReplicationInfo = NewPRI;
}

/** Walk the LinkedReplicationInfo chain to find an UliunaiPRI. */
function UliunaiPRI FindUliunaiPRI(PlayerReplicationInfo PRI)
{
    local LinkedReplicationInfo LRI;

    if (PRI == None) return None;

    LRI = PRI.CustomReplicationInfo;
    while (LRI != None)
    {
        if (UliunaiPRI(LRI) != None)
            return UliunaiPRI(LRI);
        LRI = LRI.NextReplicationInfo;
    }
    return None;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync kill data from UliunaiStats.KillTracking to each player's UliunaiPRI
// ─────────────────────────────────────────────────────────────────────────────

function SyncAllKillsToPRI()
{
    local Controller C;
    local PlayerController PC;
    local UliunaiPRI UPRI;
    local int i;

    if (StatsMutator == None) return;

    for (C = Level.ControllerList; C != None; C = C.NextController)
    {
        PC = PlayerController(C);
        if (PC == None) continue;
        if (PC.PlayerReplicationInfo == None) continue;
        if (PC.PlayerReplicationInfo.bOnlySpectator) continue;

        UPRI = FindUliunaiPRI(PC.PlayerReplicationInfo);
        if (UPRI == None) continue;

        // Find matching KillTracking entry
        for (i = 0; i < StatsMutator.KillTracking.Length; i++)
        {
            if (StatsMutator.KillTracking[i].Player == C)
            {
                UPRI.Clot       = StatsMutator.KillTracking[i].Clot;
                UPRI.Gorefast   = StatsMutator.KillTracking[i].Gorefast;
                UPRI.Crawler    = StatsMutator.KillTracking[i].Crawler;
                UPRI.Stalker    = StatsMutator.KillTracking[i].Stalker;
                UPRI.Bloat      = StatsMutator.KillTracking[i].Bloat;
                UPRI.Siren      = StatsMutator.KillTracking[i].Siren;
                UPRI.Husk       = StatsMutator.KillTracking[i].Husk;
                UPRI.Scrake     = StatsMutator.KillTracking[i].Scrake;
                UPRI.Fleshpound = StatsMutator.KillTracking[i].Fleshpound;
                UPRI.Boss       = StatsMutator.KillTracking[i].Boss;
                break;
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────

defaultproperties
{
    GroupName="KF-UliunaiScoreBoard"
    FriendlyName="Uliunai Custom Scoreboard"
    Description="Replaces the stock Tab scoreboard with a horror-themed monster kill breakdown."
}
