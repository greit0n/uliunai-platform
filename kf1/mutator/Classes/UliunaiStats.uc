///////////////////////////////////////////////////////////////////////////////
// UliunaiStats — Live game state + cumulative player statistics for KF1
//
// Two JSON outputs:
//   1. UliunaiStats.json  — live game state (every WriteInterval seconds)
//   2. UliunaiLeaderboard.json — cumulative all-time player stats (every 30s)
//
// Cumulative stats persist across map changes and server restarts via
// config(UliunaiStats) SaveConfig(). Data stored as pipe-delimited strings
// in SavedStats config array.
//
// Add to ServerActors in KillingFloor.ini.
///////////////////////////////////////////////////////////////////////////////
class UliunaiStats extends Mutator
    config(UliunaiStats);

var config float WriteInterval;
var config array<string> SavedStats;

var FileLog StatsFile;
var KFGameType KFGT;
var UliunaiStatsRules Rules;

// ─────────────────────────────────────────────────────────────────────────────
// Per-player monster kill tracking (resets each map — used for live JSON)
// ─────────────────────────────────────────────────────────────────────────────

struct MonsterKillData
{
    var Controller Player;
    var int Clot;
    var int Gorefast;
    var int Crawler;
    var int Stalker;
    var int Bloat;
    var int Siren;
    var int Husk;
    var int Scrake;
    var int Fleshpound;
    var int Boss;
    var int Other;
};
var array<MonsterKillData> KillTracking;

// ─────────────────────────────────────────────────────────────────────────────
// Cumulative all-time stats (persisted via SavedStats config array)
// ─────────────────────────────────────────────────────────────────────────────

struct CumulativeStats
{
    // Identity
    var string SteamID;
    var string PlayerName;
    var string FirstSeen;     // ISO date string
    var string LastSeen;

    // Kills — total + per monster
    var int TotalKills;
    var int Clot;
    var int Gorefast;
    var int Crawler;
    var int Stalker;
    var int Bloat;
    var int Siren;
    var int Husk;
    var int Scrake;
    var int Fleshpound;
    var int Boss;
    var int OtherKills;

    // Combat
    var int Headshots;
    var int Deaths;
    var int DamageDealt;

    // Games
    var int GamesPlayed;
    var int GamesWon;
    var int GamesLost;
    var int HighestWave;
    var int BestGameKills;
    var int LongestKillStreak;

    // Misc
    var int ZedTimetriggers;
    var int PlaytimeSeconds;
    var int CashEarned;

    // Per-perk stats (7 perks: Medic, Support, Sharpshooter, Commando, Berserker, Firebug, Demolitions)
    // Each perk: level, time played (seconds), kills
    var int PerkLevel_Medic;       var int PerkTime_Medic;       var int PerkKills_Medic;
    var int PerkLevel_Support;     var int PerkTime_Support;     var int PerkKills_Support;
    var int PerkLevel_Sharp;       var int PerkTime_Sharp;       var int PerkKills_Sharp;
    var int PerkLevel_Commando;    var int PerkTime_Commando;    var int PerkKills_Commando;
    var int PerkLevel_Berserker;   var int PerkTime_Berserker;   var int PerkKills_Berserker;
    var int PerkLevel_Firebug;     var int PerkTime_Firebug;     var int PerkKills_Firebug;
    var int PerkLevel_Demo;        var int PerkTime_Demo;        var int PerkKills_Demo;
};

var array<CumulativeStats> AllStats;

// ─────────────────────────────────────────────────────────────────────────────
// Active session tracking (per-player, resets on disconnect/map change)
// ─────────────────────────────────────────────────────────────────────────────

struct ActiveSession
{
    var Controller Player;
    var string SteamID;
    var string CurrentPerk;
    var float JoinTime;       // Level.TimeSeconds when joined
    var float PerkSwitchTime; // Level.TimeSeconds when perk last changed
    var int SessionKills;     // kills this session (for BestGameKills)
    var int CurrentStreak;    // current kill streak
    var bool bTracking;       // is this session active
};
var array<ActiveSession> Sessions;

// Zed time tracking
var bool bWasZedTime;
var Controller LastKiller;

// Leaderboard write timer
var float LeaderboardTimer;
var float LeaderboardInterval;

// Date helper
var string CurrentDate;

// ─────────────────────────────────────────────────────────────────────────────

function PostBeginPlay()
{
    Super.PostBeginPlay();

    KFGT = KFGameType(Level.Game);

    if (WriteInterval <= 0)
        WriteInterval = 2.0;

    LeaderboardInterval = 30.0;
    LeaderboardTimer = 0;

    CurrentDate = GetDateString();

    // Load persisted stats from config
    LoadStats();

    // Spawn GameRules for ScoreKill/NetDamage/CheckEndGame callbacks
    Rules = Spawn(class'UliunaiStatsRules');
    if (Rules != None)
    {
        Rules.StatsMutator = Self;
        if (Level.Game.GameRulesModifiers == None)
            Level.Game.GameRulesModifiers = Rules;
        else
            Level.Game.GameRulesModifiers.AddGameRules(Rules);
    }

    SetTimer(WriteInterval, true);
    Log("UliunaiStats: Active — live every "$WriteInterval$"s, leaderboard every "$LeaderboardInterval$"s, "$AllStats.Length$" players loaded");
}

function Destroyed()
{
    // Finalize all active sessions before map change
    FinalizeAllSessions();
    PersistStats();
    Super.Destroyed();
}

function Timer()
{
    TrackSessions();
    TrackZedTime();
    WriteGameState();

    LeaderboardTimer += WriteInterval;
    if (LeaderboardTimer >= LeaderboardInterval)
    {
        LeaderboardTimer = 0;
        WriteLeaderboard();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session tracking — detect joins, leaves, perk switches
// ─────────────────────────────────────────────────────────────────────────────

function TrackSessions()
{
    local Controller C;
    local PlayerController PC;
    local KFPlayerReplicationInfo KFPRI;
    local string steamID;
    local string perkName;
    local int si, ci;
    local bool found;
    local ActiveSession NewSess;

    if (KFGT == None) return;

    // Mark all sessions as potentially stale
    for (si = 0; si < Sessions.Length; si++)
        Sessions[si].bTracking = false;

    // Iterate current players
    for (C = Level.ControllerList; C != None; C = C.NextController)
    {
        PC = PlayerController(C);
        if (PC == None) continue;
        if (PC.PlayerReplicationInfo == None) continue;
        if (PC.PlayerReplicationInfo.bOnlySpectator) continue;

        KFPRI = KFPlayerReplicationInfo(PC.PlayerReplicationInfo);
        if (KFPRI == None) continue;

        steamID = PC.GetPlayerIDHash();
        if (steamID == "") continue;

        perkName = PerkName(KFPRI);

        // Find existing session
        found = false;
        for (si = 0; si < Sessions.Length; si++)
        {
            if (Sessions[si].SteamID == steamID)
            {
                Sessions[si].bTracking = true;
                Sessions[si].Player = C;

                // Detect perk switch
                if (Sessions[si].CurrentPerk != perkName)
                {
                    // Credit time to old perk
                    ci = GetCumulativeIndex(steamID);
                    if (ci >= 0)
                        AddPerkTime(ci, Sessions[si].CurrentPerk, int(Level.TimeSeconds - Sessions[si].PerkSwitchTime));

                    Sessions[si].CurrentPerk = perkName;
                    Sessions[si].PerkSwitchTime = Level.TimeSeconds;
                }

                // Update cumulative name/date/perk level
                ci = GetCumulativeIndex(steamID);
                if (ci >= 0)
                {
                    AllStats[ci].PlayerName = KFPRI.PlayerName;
                    AllStats[ci].LastSeen = CurrentDate;
                    UpdatePerkLevel(ci, perkName, KFPRI.ClientVeteranSkillLevel);
                }

                found = true;
                break;
            }
        }

        if (!found)
        {
            // New session — player just joined
            NewSess.Player = C;
            NewSess.SteamID = steamID;
            NewSess.CurrentPerk = perkName;
            NewSess.JoinTime = Level.TimeSeconds;
            NewSess.PerkSwitchTime = Level.TimeSeconds;
            NewSess.SessionKills = 0;
            NewSess.CurrentStreak = 0;
            NewSess.bTracking = true;

            si = Sessions.Length;
            Sessions.Length = si + 1;
            Sessions[si] = NewSess;

            // Ensure cumulative entry exists
            ci = GetOrCreateCumulative(steamID, KFPRI.PlayerName);
            AllStats[ci].LastSeen = CurrentDate;
            UpdatePerkLevel(ci, perkName, KFPRI.ClientVeteranSkillLevel);
        }
    }

    // Finalize sessions for disconnected players
    for (si = Sessions.Length - 1; si >= 0; si--)
    {
        if (!Sessions[si].bTracking)
        {
            FinalizeSession(si);
            Sessions.Remove(si, 1);
        }
    }
}

function FinalizeSession(int si)
{
    local int ci;

    ci = GetCumulativeIndex(Sessions[si].SteamID);
    if (ci < 0) return;

    // Credit remaining perk time
    AddPerkTime(ci, Sessions[si].CurrentPerk, int(Level.TimeSeconds - Sessions[si].PerkSwitchTime));

    // Credit total playtime
    AllStats[ci].PlaytimeSeconds += int(Level.TimeSeconds - Sessions[si].JoinTime);

    // Update best game kills
    if (Sessions[si].SessionKills > AllStats[ci].BestGameKills)
        AllStats[ci].BestGameKills = Sessions[si].SessionKills;

    // Update longest kill streak
    if (Sessions[si].CurrentStreak > AllStats[ci].LongestKillStreak)
        AllStats[ci].LongestKillStreak = Sessions[si].CurrentStreak;
}

function FinalizeAllSessions()
{
    local int i;
    for (i = 0; i < Sessions.Length; i++)
        FinalizeSession(i);
    Sessions.Length = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zed time tracking
// ─────────────────────────────────────────────────────────────────────────────

function TrackZedTime()
{
    local int ci;
    local string steamID;

    if (KFGT == None) return;

    // Detect transition from no-zed-time to zed-time
    if (KFGT.bZEDTimeActive && !bWasZedTime)
    {
        // Credit the last killer
        if (LastKiller != None && PlayerController(LastKiller) != None)
        {
            steamID = PlayerController(LastKiller).GetPlayerIDHash();
            ci = GetCumulativeIndex(steamID);
            if (ci >= 0)
                AllStats[ci].ZedTimeTriggers++;
        }
    }
    bWasZedTime = KFGT.bZEDTimeActive;
}

// ─────────────────────────────────────────────────────────────────────────────
// Kill tracking helpers (called by UliunaiStatsRules)
// ─────────────────────────────────────────────────────────────────────────────

/** Find or create kill tracking entry for a controller (live stats). */
function int GetKillIndex(Controller C)
{
    local int i;
    local MonsterKillData NewData;

    for (i = 0; i < KillTracking.Length; i++)
    {
        if (KillTracking[i].Player == C)
            return i;
    }

    NewData.Player = C;
    i = KillTracking.Length;
    KillTracking.Length = i + 1;
    KillTracking[i] = NewData;
    return i;
}

/** Record a kill in cumulative stats. Called by UliunaiStatsRules.ScoreKill. */
function RecordCumulativeKill(Controller Killer, string MonsterType, bool bHeadshot)
{
    local string steamID;
    local int ci, si;

    if (PlayerController(Killer) == None) return;
    steamID = PlayerController(Killer).GetPlayerIDHash();
    if (steamID == "") return;

    ci = GetCumulativeIndex(steamID);
    if (ci < 0) return;

    AllStats[ci].TotalKills++;

    // Per-monster type
    if (MonsterType == "CLOT")           AllStats[ci].Clot++;
    else if (MonsterType == "GOREFAST")  AllStats[ci].Gorefast++;
    else if (MonsterType == "CRAWLER")   AllStats[ci].Crawler++;
    else if (MonsterType == "STALKER")   AllStats[ci].Stalker++;
    else if (MonsterType == "BLOAT")     AllStats[ci].Bloat++;
    else if (MonsterType == "SIREN")     AllStats[ci].Siren++;
    else if (MonsterType == "HUSK")      AllStats[ci].Husk++;
    else if (MonsterType == "SCRAKE")    AllStats[ci].Scrake++;
    else if (MonsterType == "FLESHPOUND") AllStats[ci].Fleshpound++;
    else if (MonsterType == "BOSS")      AllStats[ci].Boss++;
    else                                 AllStats[ci].OtherKills++;

    if (bHeadshot)
        AllStats[ci].Headshots++;

    // Per-perk kills
    for (si = 0; si < Sessions.Length; si++)
    {
        if (Sessions[si].SteamID == steamID)
        {
            AddPerkKill(ci, Sessions[si].CurrentPerk);
            Sessions[si].SessionKills++;
            Sessions[si].CurrentStreak++;
            break;
        }
    }

    // Track last killer for zed time attribution
    LastKiller = Killer;
}

/** Record a death in cumulative stats. */
function RecordCumulativeDeath(Controller Killed)
{
    local string steamID;
    local int ci, si;

    if (PlayerController(Killed) == None) return;
    steamID = PlayerController(Killed).GetPlayerIDHash();
    if (steamID == "") return;

    ci = GetCumulativeIndex(steamID);
    if (ci < 0) return;

    AllStats[ci].Deaths++;

    // Reset kill streak on death
    for (si = 0; si < Sessions.Length; si++)
    {
        if (Sessions[si].SteamID == steamID)
        {
            if (Sessions[si].CurrentStreak > AllStats[ci].LongestKillStreak)
                AllStats[ci].LongestKillStreak = Sessions[si].CurrentStreak;
            Sessions[si].CurrentStreak = 0;
            break;
        }
    }
}

/** Record damage dealt. Called by UliunaiStatsRules.NetDamage. */
function RecordDamage(Controller Dealer, int Amount)
{
    local string steamID;
    local int ci;

    if (PlayerController(Dealer) == None) return;
    steamID = PlayerController(Dealer).GetPlayerIDHash();
    if (steamID == "") return;

    ci = GetCumulativeIndex(steamID);
    if (ci < 0) return;

    AllStats[ci].DamageDealt += Amount;
}

/** Record cash earned. Called periodically to track score changes. */
function RecordCashForAllPlayers()
{
    // Cash tracking is done via periodic score snapshots — deferred for now
    // The PRI.Score value resets each round so it's not straightforward
}

/** Record game end — win or loss for each active player. */
function RecordGameEnd(bool bWon)
{
    local int i, ci;
    local int waveReached;

    if (KFGT != None)
        waveReached = KFGT.WaveNum + 1;

    for (i = 0; i < Sessions.Length; i++)
    {
        ci = GetCumulativeIndex(Sessions[i].SteamID);
        if (ci < 0) continue;

        AllStats[ci].GamesPlayed++;
        if (bWon)
            AllStats[ci].GamesWon++;
        else
            AllStats[ci].GamesLost++;

        if (waveReached > AllStats[ci].HighestWave)
            AllStats[ci].HighestWave = waveReached;
    }

    PersistStats();
}

// ─────────────────────────────────────────────────────────────────────────────
// Cumulative stats helpers
// ─────────────────────────────────────────────────────────────────────────────

function int GetCumulativeIndex(string SteamID)
{
    local int i;
    for (i = 0; i < AllStats.Length; i++)
    {
        if (AllStats[i].SteamID == SteamID)
            return i;
    }
    return -1;
}

function int GetOrCreateCumulative(string SteamID, string Name)
{
    local int i;
    local CumulativeStats NewEntry;

    i = GetCumulativeIndex(SteamID);
    if (i >= 0) return i;

    NewEntry.SteamID = SteamID;
    NewEntry.PlayerName = Name;
    NewEntry.FirstSeen = CurrentDate;
    NewEntry.LastSeen = CurrentDate;

    i = AllStats.Length;
    AllStats.Length = i + 1;
    AllStats[i] = NewEntry;
    return i;
}

function UpdatePerkLevel(int ci, string Perk, int Level)
{
    if (Perk ~= "FieldMedic" || Perk ~= "Medic")         { if (Level > AllStats[ci].PerkLevel_Medic) AllStats[ci].PerkLevel_Medic = Level; }
    else if (Perk ~= "SupportSpec" || Perk ~= "Support")  { if (Level > AllStats[ci].PerkLevel_Support) AllStats[ci].PerkLevel_Support = Level; }
    else if (Perk ~= "Sharpshooter")                      { if (Level > AllStats[ci].PerkLevel_Sharp) AllStats[ci].PerkLevel_Sharp = Level; }
    else if (Perk ~= "Commando")                          { if (Level > AllStats[ci].PerkLevel_Commando) AllStats[ci].PerkLevel_Commando = Level; }
    else if (Perk ~= "Berserker")                         { if (Level > AllStats[ci].PerkLevel_Berserker) AllStats[ci].PerkLevel_Berserker = Level; }
    else if (Perk ~= "Firebug")                           { if (Level > AllStats[ci].PerkLevel_Firebug) AllStats[ci].PerkLevel_Firebug = Level; }
    else if (Perk ~= "Demolitions" || Perk ~= "Demo")     { if (Level > AllStats[ci].PerkLevel_Demo) AllStats[ci].PerkLevel_Demo = Level; }
}

function AddPerkTime(int ci, string Perk, int Seconds)
{
    if (Seconds <= 0) return;
    if (Perk ~= "FieldMedic" || Perk ~= "Medic")         AllStats[ci].PerkTime_Medic += Seconds;
    else if (Perk ~= "SupportSpec" || Perk ~= "Support")  AllStats[ci].PerkTime_Support += Seconds;
    else if (Perk ~= "Sharpshooter")                      AllStats[ci].PerkTime_Sharp += Seconds;
    else if (Perk ~= "Commando")                          AllStats[ci].PerkTime_Commando += Seconds;
    else if (Perk ~= "Berserker")                         AllStats[ci].PerkTime_Berserker += Seconds;
    else if (Perk ~= "Firebug")                           AllStats[ci].PerkTime_Firebug += Seconds;
    else if (Perk ~= "Demolitions" || Perk ~= "Demo")     AllStats[ci].PerkTime_Demo += Seconds;
}

function AddPerkKill(int ci, string Perk)
{
    if (Perk ~= "FieldMedic" || Perk ~= "Medic")         AllStats[ci].PerkKills_Medic++;
    else if (Perk ~= "SupportSpec" || Perk ~= "Support")  AllStats[ci].PerkKills_Support++;
    else if (Perk ~= "Sharpshooter")                      AllStats[ci].PerkKills_Sharp++;
    else if (Perk ~= "Commando")                          AllStats[ci].PerkKills_Commando++;
    else if (Perk ~= "Berserker")                         AllStats[ci].PerkKills_Berserker++;
    else if (Perk ~= "Firebug")                           AllStats[ci].PerkKills_Firebug++;
    else if (Perk ~= "Demolitions" || Perk ~= "Demo")     AllStats[ci].PerkKills_Demo++;
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence — pipe-delimited strings in config array
// ─────────────────────────────────────────────────────────────────────────────

function LoadStats()
{
    local int i;
    local array<string> Parts;
    local CumulativeStats S;

    AllStats.Length = 0;

    for (i = 0; i < SavedStats.Length; i++)
    {
        Split(SavedStats[i], "|", Parts);
        if (Parts.Length < 49) continue;

        S.SteamID           = Parts[0];
        S.PlayerName        = Parts[1];
        S.FirstSeen         = Parts[2];
        S.LastSeen          = Parts[3];
        S.TotalKills        = int(Parts[4]);
        S.Clot              = int(Parts[5]);
        S.Gorefast          = int(Parts[6]);
        S.Crawler           = int(Parts[7]);
        S.Stalker           = int(Parts[8]);
        S.Bloat             = int(Parts[9]);
        S.Siren             = int(Parts[10]);
        S.Husk              = int(Parts[11]);
        S.Scrake            = int(Parts[12]);
        S.Fleshpound        = int(Parts[13]);
        S.Boss              = int(Parts[14]);
        S.OtherKills        = int(Parts[15]);
        S.Headshots         = int(Parts[16]);
        S.Deaths            = int(Parts[17]);
        S.DamageDealt       = int(Parts[18]);
        S.GamesPlayed       = int(Parts[19]);
        S.GamesWon          = int(Parts[20]);
        S.GamesLost         = int(Parts[21]);
        S.HighestWave       = int(Parts[22]);
        S.BestGameKills     = int(Parts[23]);
        S.LongestKillStreak = int(Parts[24]);
        S.ZedTimeTriggers   = int(Parts[25]);
        S.PlaytimeSeconds   = int(Parts[26]);
        S.CashEarned        = int(Parts[27]);
        S.PerkLevel_Medic      = int(Parts[28]);
        S.PerkTime_Medic       = int(Parts[29]);
        S.PerkKills_Medic      = int(Parts[30]);
        S.PerkLevel_Support    = int(Parts[31]);
        S.PerkTime_Support     = int(Parts[32]);
        S.PerkKills_Support    = int(Parts[33]);
        S.PerkLevel_Sharp      = int(Parts[34]);
        S.PerkTime_Sharp       = int(Parts[35]);
        S.PerkKills_Sharp      = int(Parts[36]);
        S.PerkLevel_Commando   = int(Parts[37]);
        S.PerkTime_Commando    = int(Parts[38]);
        S.PerkKills_Commando   = int(Parts[39]);
        S.PerkLevel_Berserker  = int(Parts[40]);
        S.PerkTime_Berserker   = int(Parts[41]);
        S.PerkKills_Berserker  = int(Parts[42]);
        S.PerkLevel_Firebug    = int(Parts[43]);
        S.PerkTime_Firebug     = int(Parts[44]);
        S.PerkKills_Firebug    = int(Parts[45]);
        S.PerkLevel_Demo       = int(Parts[46]);
        S.PerkTime_Demo        = int(Parts[47]);
        S.PerkKills_Demo       = int(Parts[48]);

        AllStats[AllStats.Length] = S;
    }

    Log("UliunaiStats: Loaded "$AllStats.Length$" player records from config");
}

function PersistStats()
{
    local int i;

    SavedStats.Length = AllStats.Length;
    for (i = 0; i < AllStats.Length; i++)
        SavedStats[i] = SerializeStats(AllStats[i]);

    SaveConfig();
    Log("UliunaiStats: Persisted "$AllStats.Length$" player records");
}

function string SerializeStats(CumulativeStats S)
{
    return S.SteamID          $ "|" $ S.PlayerName        $ "|" $ S.FirstSeen         $ "|" $ S.LastSeen
        $ "|" $ S.TotalKills  $ "|" $ S.Clot              $ "|" $ S.Gorefast          $ "|" $ S.Crawler
        $ "|" $ S.Stalker     $ "|" $ S.Bloat             $ "|" $ S.Siren             $ "|" $ S.Husk
        $ "|" $ S.Scrake      $ "|" $ S.Fleshpound        $ "|" $ S.Boss              $ "|" $ S.OtherKills
        $ "|" $ S.Headshots   $ "|" $ S.Deaths            $ "|" $ S.DamageDealt
        $ "|" $ S.GamesPlayed $ "|" $ S.GamesWon          $ "|" $ S.GamesLost
        $ "|" $ S.HighestWave $ "|" $ S.BestGameKills     $ "|" $ S.LongestKillStreak
        $ "|" $ S.ZedTimeTriggers $ "|" $ S.PlaytimeSeconds $ "|" $ S.CashEarned
        $ "|" $ S.PerkLevel_Medic     $ "|" $ S.PerkTime_Medic     $ "|" $ S.PerkKills_Medic
        $ "|" $ S.PerkLevel_Support   $ "|" $ S.PerkTime_Support   $ "|" $ S.PerkKills_Support
        $ "|" $ S.PerkLevel_Sharp     $ "|" $ S.PerkTime_Sharp     $ "|" $ S.PerkKills_Sharp
        $ "|" $ S.PerkLevel_Commando  $ "|" $ S.PerkTime_Commando  $ "|" $ S.PerkKills_Commando
        $ "|" $ S.PerkLevel_Berserker $ "|" $ S.PerkTime_Berserker $ "|" $ S.PerkKills_Berserker
        $ "|" $ S.PerkLevel_Firebug   $ "|" $ S.PerkTime_Firebug   $ "|" $ S.PerkKills_Firebug
        $ "|" $ S.PerkLevel_Demo      $ "|" $ S.PerkTime_Demo      $ "|" $ S.PerkKills_Demo;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON export — live game state (every WriteInterval seconds)
// ─────────────────────────────────────────────────────────────────────────────

/** Build JSON object for a player's monster kill breakdown. */
function string KillsJSON(Controller C)
{
    local int i;

    for (i = 0; i < KillTracking.Length; i++)
    {
        if (KillTracking[i].Player == C)
        {
            return "{"
                $ Q("clot")        $ ":" $ KillTracking[i].Clot        $ ","
                $ Q("gorefast")    $ ":" $ KillTracking[i].Gorefast    $ ","
                $ Q("crawler")     $ ":" $ KillTracking[i].Crawler     $ ","
                $ Q("stalker")     $ ":" $ KillTracking[i].Stalker     $ ","
                $ Q("bloat")       $ ":" $ KillTracking[i].Bloat       $ ","
                $ Q("siren")       $ ":" $ KillTracking[i].Siren       $ ","
                $ Q("husk")        $ ":" $ KillTracking[i].Husk        $ ","
                $ Q("scrake")      $ ":" $ KillTracking[i].Scrake      $ ","
                $ Q("fleshpound")  $ ":" $ KillTracking[i].Fleshpound  $ ","
                $ Q("boss")        $ ":" $ KillTracking[i].Boss        $ ","
                $ Q("other")       $ ":" $ KillTracking[i].Other
                $ "}";
        }
    }

    return "{" $ Q("clot") $ ":0," $ Q("gorefast") $ ":0," $ Q("crawler") $ ":0,"
        $ Q("stalker") $ ":0," $ Q("bloat") $ ":0," $ Q("siren") $ ":0,"
        $ Q("husk") $ ":0," $ Q("scrake") $ ":0," $ Q("fleshpound") $ ":0,"
        $ Q("boss") $ ":0," $ Q("other") $ ":0}";
}

function WriteGameState()
{
    local Controller C;
    local PlayerController PC;
    local KFPlayerReplicationInfo KFPRI;
    local string json;
    local bool bFirst;
    local int playerCount;

    if (KFGT == None)
    {
        KFGT = KFGameType(Level.Game);
        if (KFGT == None) return;
    }

    StatsFile = Spawn(class'FileLog');
    if (StatsFile == None) return;

    StatsFile.OpenLog("UliunaiStats", ".json", true);

    json = "{";

    // Wave info
    json $= Q("wave") $ ":{";
    json $= Q("current")     $ ":" $ (KFGT.WaveNum + 1)  $ ",";
    json $= Q("total")       $ ":" $ (KFGT.FinalWave + 1) $ ",";
    json $= Q("inProgress")  $ ":" $ B(KFGT.bWaveInProgress) $ ",";
    json $= Q("traderTime")  $ ":" $ B(KFGT.bTradingDoorsOpen);
    json $= "},";

    // Zed info
    json $= Q("zeds") $ ":{";
    json $= Q("alive")       $ ":" $ KFGT.NumMonsters $ ",";
    json $= Q("maxAtOnce")   $ ":" $ KFGT.MaxMonsters;
    json $= "},";

    // Difficulty
    json $= Q("difficulty")     $ ":" $ Q(DiffName(Level.Game.GameDifficulty)) $ ",";
    json $= Q("difficultyNum")  $ ":" $ int(Level.Game.GameDifficulty) $ ",";

    // Map name
    json $= Q("map") $ ":" $ Q(Esc(string(Level.Outer.Name))) $ ",";

    // Players array
    json $= Q("players") $ ":[";
    bFirst = true;
    playerCount = 0;

    for (C = Level.ControllerList; C != None; C = C.NextController)
    {
        PC = PlayerController(C);
        if (PC == None) continue;
        if (PC.PlayerReplicationInfo == None) continue;
        if (PC.PlayerReplicationInfo.bOnlySpectator) continue;

        KFPRI = KFPlayerReplicationInfo(PC.PlayerReplicationInfo);
        if (KFPRI == None) continue;

        if (!bFirst) json $= ",";
        bFirst = false;
        playerCount++;

        json $= "{";
        json $= Q("name")         $ ":" $ Q(Esc(KFPRI.PlayerName))  $ ",";
        json $= Q("perk")         $ ":" $ Q(PerkName(KFPRI))        $ ",";
        json $= Q("perkLevel")    $ ":" $ KFPRI.ClientVeteranSkillLevel $ ",";
        json $= Q("kills")        $ ":" $ KFPRI.Kills               $ ",";
        json $= Q("monsterKills") $ ":" $ KillsJSON(PC)             $ ",";
        json $= Q("cash")         $ ":" $ int(KFPRI.Score)          $ ",";
        json $= Q("health")       $ ":" $ HP(PC)                    $ ",";
        json $= Q("maxHealth")    $ ":" $ MaxHP(PC)                 $ ",";
        json $= Q("deaths")       $ ":" $ KFPRI.Deaths              $ ",";
        json $= Q("ping")         $ ":" $ KFPRI.Ping;
        json $= "}";
    }

    json $= "],";
    json $= Q("playerCount") $ ":" $ playerCount;
    json $= "}";

    StatsFile.Logf(json);
    StatsFile.CloseLog();
    StatsFile.Destroy();
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON export — leaderboard (every 30 seconds)
// ─────────────────────────────────────────────────────────────────────────────

function WriteLeaderboard()
{
    local FileLog LBFile;
    local string json;
    local int i;
    local CumulativeStats S;

    LBFile = Spawn(class'FileLog');
    if (LBFile == None) return;

    LBFile.OpenLog("UliunaiLeaderboard", ".json", true);

    json = "{" $ Q("players") $ ":[";

    for (i = 0; i < AllStats.Length; i++)
    {
        S = AllStats[i];
        if (i > 0) json $= ",";
        json $= "{";
        json $= Q("steamId")      $ ":" $ Q(Esc(S.SteamID))     $ ",";
        json $= Q("name")         $ ":" $ Q(Esc(S.PlayerName))  $ ",";
        json $= Q("firstSeen")    $ ":" $ Q(S.FirstSeen)        $ ",";
        json $= Q("lastSeen")     $ ":" $ Q(S.LastSeen)         $ ",";
        json $= Q("totalKills")   $ ":" $ S.TotalKills           $ ",";
        json $= Q("monsterKills") $ ":{";
        json $=   Q("clot")       $ ":" $ S.Clot       $ ",";
        json $=   Q("gorefast")   $ ":" $ S.Gorefast   $ ",";
        json $=   Q("crawler")    $ ":" $ S.Crawler    $ ",";
        json $=   Q("stalker")    $ ":" $ S.Stalker    $ ",";
        json $=   Q("bloat")      $ ":" $ S.Bloat      $ ",";
        json $=   Q("siren")      $ ":" $ S.Siren      $ ",";
        json $=   Q("husk")       $ ":" $ S.Husk       $ ",";
        json $=   Q("scrake")     $ ":" $ S.Scrake     $ ",";
        json $=   Q("fleshpound") $ ":" $ S.Fleshpound $ ",";
        json $=   Q("boss")       $ ":" $ S.Boss       $ ",";
        json $=   Q("other")      $ ":" $ S.OtherKills;
        json $= "},";
        json $= Q("headshots")         $ ":" $ S.Headshots          $ ",";
        json $= Q("deaths")            $ ":" $ S.Deaths             $ ",";
        json $= Q("damageDealt")        $ ":" $ S.DamageDealt        $ ",";
        json $= Q("gamesPlayed")       $ ":" $ S.GamesPlayed        $ ",";
        json $= Q("gamesWon")          $ ":" $ S.GamesWon           $ ",";
        json $= Q("gamesLost")         $ ":" $ S.GamesLost          $ ",";
        json $= Q("highestWave")       $ ":" $ S.HighestWave        $ ",";
        json $= Q("bestGameKills")     $ ":" $ S.BestGameKills      $ ",";
        json $= Q("longestKillStreak") $ ":" $ S.LongestKillStreak  $ ",";
        json $= Q("zedTimeTriggers")   $ ":" $ S.ZedTimeTriggers    $ ",";
        json $= Q("playtimeSeconds")   $ ":" $ S.PlaytimeSeconds    $ ",";
        json $= Q("cashEarned")        $ ":" $ S.CashEarned         $ ",";
        json $= Q("perks") $ ":{";
        json $=   Q("medic")      $ ":{" $ Q("level") $ ":" $ S.PerkLevel_Medic      $ "," $ Q("time") $ ":" $ S.PerkTime_Medic      $ "," $ Q("kills") $ ":" $ S.PerkKills_Medic      $ "},";
        json $=   Q("support")    $ ":{" $ Q("level") $ ":" $ S.PerkLevel_Support    $ "," $ Q("time") $ ":" $ S.PerkTime_Support    $ "," $ Q("kills") $ ":" $ S.PerkKills_Support    $ "},";
        json $=   Q("sharpshooter") $ ":{" $ Q("level") $ ":" $ S.PerkLevel_Sharp    $ "," $ Q("time") $ ":" $ S.PerkTime_Sharp    $ "," $ Q("kills") $ ":" $ S.PerkKills_Sharp    $ "},";
        json $=   Q("commando")   $ ":{" $ Q("level") $ ":" $ S.PerkLevel_Commando   $ "," $ Q("time") $ ":" $ S.PerkTime_Commando   $ "," $ Q("kills") $ ":" $ S.PerkKills_Commando   $ "},";
        json $=   Q("berserker")  $ ":{" $ Q("level") $ ":" $ S.PerkLevel_Berserker  $ "," $ Q("time") $ ":" $ S.PerkTime_Berserker  $ "," $ Q("kills") $ ":" $ S.PerkKills_Berserker  $ "},";
        json $=   Q("firebug")    $ ":{" $ Q("level") $ ":" $ S.PerkLevel_Firebug    $ "," $ Q("time") $ ":" $ S.PerkTime_Firebug    $ "," $ Q("kills") $ ":" $ S.PerkKills_Firebug    $ "},";
        json $=   Q("demolitions") $ ":{" $ Q("level") $ ":" $ S.PerkLevel_Demo      $ "," $ Q("time") $ ":" $ S.PerkTime_Demo      $ "," $ Q("kills") $ ":" $ S.PerkKills_Demo      $ "}";
        json $= "}";
        json $= "}";
    }

    json $= "]," $ Q("totalPlayers") $ ":" $ AllStats.Length $ "}";

    LBFile.Logf(json);
    LBFile.CloseLog();
    LBFile.Destroy();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

static function string Q(coerce string s)
{
    return "\"" $ s $ "\"";
}

static function string B(bool b)
{
    if (b) return "true";
    return "false";
}

function string Esc(string s)
{
    s = Repl(s, "\\", "\\\\");
    s = Repl(s, "\"", "\\\"");
    return s;
}

function string DiffName(float d)
{
    if (d <= 1.0) return "Beginner";
    if (d <= 2.0) return "Normal";
    if (d <= 4.0) return "Hard";
    if (d <= 5.0) return "Suicidal";
    return "Hell on Earth";
}

function string PerkName(KFPlayerReplicationInfo KFPRI)
{
    local string s;

    if (KFPRI.ClientVeteranSkill == None)
        return "None";

    s = string(KFPRI.ClientVeteranSkill);

    if (InStr(s, ".") >= 0)
        s = Mid(s, InStr(s, ".") + 1);

    if (Left(s, 5) ~= "KFVet")
        s = Mid(s, 5);

    return s;
}

function int HP(PlayerController PC)
{
    if (PC.Pawn != None)
        return PC.Pawn.Health;
    return 0;
}

function int MaxHP(PlayerController PC)
{
    if (PC.Pawn != None)
        return PC.Pawn.HealthMax;
    return 0;
}

function string GetDateString()
{
    return Level.Year $ "-" $ Pad(Level.Month) $ "-" $ Pad(Level.Day);
}

function string Pad(int N)
{
    if (N < 10) return "0" $ N;
    return string(N);
}

// ─────────────────────────────────────────────────────────────────────────────

defaultproperties
{
    WriteInterval=2.0
    LeaderboardInterval=30.0
    GroupName="KF-UliunaiStats"
    FriendlyName="Uliunai Live Stats"
    Description="Exports live game state and cumulative player statistics as JSON."
}
