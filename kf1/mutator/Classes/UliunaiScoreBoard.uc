///////////////////////////////////////////////////////////////////////////////
// UliunaiScoreBoard — Custom in-game scoreboard for Killing Floor 1
//
// Replaces the stock Tab scoreboard with a table matching the website's
// LiveScoreboard layout. Shows per-monster kill breakdowns, perk info,
// health, cash, and ping — all color-coded with the horror theme.
//
// Columns (matching website 1:1):
//   #  Player  Perk  Kills  CLO GOR CRA STA BLO SIR HUS SCR FP BOSS  Cash HP Ping
//
// Reads per-monster kills from UliunaiPRI (LinkedReplicationInfo chain).
// Falls back to KFPRI.Kills if no UliunaiPRI is attached.
///////////////////////////////////////////////////////////////////////////////
class UliunaiScoreBoard extends ScoreBoard;

// ─────────────────────────────────────────────────────────────────────────────
// Player data struct for sorting (fixed-size array, max 16 players)
// ─────────────────────────────────────────────────────────────────────────────

struct SBPlayerData
{
    var string PlayerName;
    var string PerkName;
    var int    PerkLevel;
    var int    TotalKills;
    var int    Clot;
    var int    Gorefast;
    var int    Crawler;
    var int    Stalker;
    var int    Bloat;
    var int    Siren;
    var int    Husk;
    var int    Scrake;
    var int    Fleshpound;
    var int    Boss;
    var int    Cash;
    var int    Health;
    var int    MaxHealth;
    var int    Ping;
    var bool   bValid;
};

// Maximum players we support displaying
const MAX_PLAYERS = 16;

// Cached font (loaded once, reused)
var Font ScoreFont;

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point — DrawScoreBoard
// ─────────────────────────────────────────────────────────────────────────────

simulated event DrawScoreBoard(Canvas C)
{
    local SBPlayerData Players[16];
    local int PlayerCount;
    local float TableX, TableY, TableW, TableH;
    local float RowH, HeaderBarH, ColHeaderH;
    local float ScaleX, ScaleY;

    if (C == None) return;

    // Scaling factors relative to 1024x768 reference resolution
    ScaleX = C.ClipX / 1024.0;
    ScaleY = C.ClipY / 768.0;

    // Load a larger font — try several sizes, fallback to SmallFont
    if (ScoreFont == None)
    {
        ScoreFont = Font(DynamicLoadObject("UT2003Fonts.FontEurostile21", class'Font'));
        if (ScoreFont == None)
            ScoreFont = Font(DynamicLoadObject("UT2003Fonts.FontEurostile17", class'Font'));
        if (ScoreFont == None)
            ScoreFont = Font(DynamicLoadObject("UT2003Fonts.FontEurostile14", class'Font'));
        if (ScoreFont == None)
            ScoreFont = Font(DynamicLoadObject("UT2003Fonts.jFontLarge", class'Font'));
        if (ScoreFont == None)
            ScoreFont = Font(DynamicLoadObject("UT2003Fonts.jFontMedium", class'Font'));
        if (ScoreFont == None)
            ScoreFont = C.SmallFont;
    }

    // Layout dimensions
    TableW = C.ClipX * 0.85;
    TableX = (C.ClipX - TableW) * 0.5;
    RowH = 26.0 * ScaleY;
    HeaderBarH = 36.0 * ScaleY;
    ColHeaderH = 28.0 * ScaleY;

    // Collect and sort player data
    PlayerCount = CollectPlayers(Players);
    SortPlayersByKills(Players, PlayerCount);

    // Total table height: header bar + column headers + player rows
    TableH = HeaderBarH + ColHeaderH + (FMax(PlayerCount, 1) * RowH) + (4.0 * ScaleY);

    // Center table vertically
    TableY = (C.ClipY - TableH) * 0.5;
    if (TableY < 20.0 * ScaleY)
        TableY = 20.0 * ScaleY;

    // Draw subtle transparent background (no red tint, no borders)
    DrawBackground(C, TableX, TableY, TableW, TableH);

    // Draw header status bar
    DrawHeaderBar(C, TableX, TableY, TableW, HeaderBarH, PlayerCount);

    // Draw column headers
    DrawColumnHeaders(C, TableX, TableY + HeaderBarH, TableW, ColHeaderH, ScaleX);

    // Draw player rows
    DrawPlayerRows(C, Players, PlayerCount, TableX, TableY + HeaderBarH + ColHeaderH,
                   TableW, RowH, ScaleX);
}

// ─────────────────────────────────────────────────────────────────────────────
// Background panel
// ─────────────────────────────────────────────────────────────────────────────

simulated function DrawBackground(Canvas C, float X, float Y, float W, float H)
{
    // Subtle transparent black — just enough to read text over game world
    C.SetDrawColor(0, 0, 0, 120);
    C.SetPos(X, Y);
    C.DrawRect(Texture'Engine.WhiteSquareTexture', W, H);
}

// ─────────────────────────────────────────────────────────────────────────────
// Header bar — "ULIUNAI" title + map / wave / difficulty / player count
// ─────────────────────────────────────────────────────────────────────────────

simulated function DrawHeaderBar(Canvas C, float X, float Y, float W, float H,
                                  int PlayerCount)
{
    local KFGameType KFGT;
    local KFGameReplicationInfo KFGRI;
    local PlayerController LocalPC;
    local string MapName;
    local string WaveStr;
    local string DiffStr;
    local string CountStr;
    local string RightText;
    local float TitleXL, TitleYL;
    local float RightXL, RightYL;

    // Subtle dark header background
    C.SetDrawColor(0, 0, 0, 160);
    C.SetPos(X, Y);
    C.DrawRect(Texture'Engine.WhiteSquareTexture', W, H);

    C.Font = ScoreFont;

    // "ULIUNAI" title — blood red with glow feel
    C.SetDrawColor(220, 38, 38, 255);
    C.TextSize("ULIUNAI", TitleXL, TitleYL);
    C.SetPos(X + 12, Y + (H - TitleYL) * 0.5);
    C.DrawText("ULIUNAI");

    // Right side: map, wave, difficulty, player count

    // Map name — strip "KF-" prefix
    MapName = string(Level.Outer.Name);
    if (Left(MapName, 3) ~= "KF-")
        MapName = Mid(MapName, 3);

    // Try server-side KFGameType first (works on listen server)
    KFGT = KFGameType(Level.Game);
    if (KFGT != None)
    {
        WaveStr = "Wave " $ (KFGT.WaveNum + 1) $ "/" $ (KFGT.FinalWave + 1);
        DiffStr = GetDifficultyName(Level.Game.GameDifficulty);
    }
    else
    {
        // Client-side: try KFGameReplicationInfo (replicated)
        LocalPC = Level.GetLocalPlayerController();
        if (LocalPC != None)
            KFGRI = KFGameReplicationInfo(LocalPC.GameReplicationInfo);

        if (KFGRI != None)
        {
            WaveStr = "Wave " $ (KFGRI.WaveNumber + 1) $ "/" $ (KFGRI.FinalWave + 1);
            DiffStr = "";
        }
        else
        {
            WaveStr = "";
            DiffStr = "";
        }
    }

    CountStr = PlayerCount $ " player";
    if (PlayerCount != 1)
        CountStr = CountStr $ "s";

    RightText = MapName;
    if (WaveStr != "")
        RightText = RightText $ "   |   " $ WaveStr;
    if (DiffStr != "")
        RightText = RightText $ "   |   " $ DiffStr;
    RightText = RightText $ "   |   " $ CountStr;

    C.SetDrawColor(180, 180, 180, 255);
    C.TextSize(RightText, RightXL, RightYL);
    C.SetPos(X + W - RightXL - 12, Y + (H - RightYL) * 0.5);
    C.DrawText(RightText);
}

// ─────────────────────────────────────────────────────────────────────────────
// Column headers row
// ─────────────────────────────────────────────────────────────────────────────

simulated function DrawColumnHeaders(Canvas C, float X, float Y, float W, float H,
                                      float ScaleX)
{
    local float CurX;
    local float XL, YL;

    // Subtle dark row background for column headers
    C.SetDrawColor(0, 0, 0, 140);
    C.SetPos(X, Y);
    C.DrawRect(Texture'Engine.WhiteSquareTexture', W, H);

    C.Font = ScoreFont;
    C.TextSize("X", XL, YL);

    CurX = X;

    // #  (3%)
    C.SetDrawColor(180, 180, 180, 255);
    DrawCellRight(C, "#", CurX, Y, W * 0.03, H, YL);
    CurX += W * 0.03;

    // Player (14%)
    C.SetDrawColor(180, 180, 180, 255);
    DrawCellLeft(C, "Player", CurX + 4, Y, W * 0.14, H, YL);
    CurX += W * 0.14;

    // Perk (9%)
    C.SetDrawColor(180, 180, 180, 255);
    DrawCellLeft(C, "Perk", CurX + 4, Y, W * 0.09, H, YL);
    CurX += W * 0.09;

    // Kills (5%)
    C.SetDrawColor(255, 255, 255, 255);
    DrawCellRight(C, "Kills", CurX, Y, W * 0.05, H, YL);
    CurX += W * 0.05;

    // Monster columns (4.5% each = 45%)
    C.SetDrawColor(180, 180, 180, 255);
    DrawCellRight(C, "CLO", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(248, 113, 113, 255);
    DrawCellRight(C, "GOR", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(74, 222, 128, 255);
    DrawCellRight(C, "CRA", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(192, 132, 252, 255);
    DrawCellRight(C, "STA", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(250, 204, 21, 255);
    DrawCellRight(C, "BLO", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(244, 114, 182, 255);
    DrawCellRight(C, "SIR", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(251, 146, 60, 255);
    DrawCellRight(C, "HUS", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(34, 211, 238, 255);
    DrawCellRight(C, "SCR", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(239, 68, 68, 255);
    DrawCellRight(C, "FP", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;
    C.SetDrawColor(253, 224, 71, 255);
    DrawCellRight(C, "BOSS", CurX, Y, W * 0.045, H, YL);
    CurX += W * 0.045;

    // Cash (7%)
    C.SetDrawColor(250, 204, 21, 255);
    DrawCellRight(C, "Cash", CurX, Y, W * 0.07, H, YL);
    CurX += W * 0.07;

    // HP (5%)
    C.SetDrawColor(180, 180, 180, 255);
    DrawCellRight(C, "HP", CurX, Y, W * 0.05, H, YL);
    CurX += W * 0.05;

    // Ping (5%)
    C.SetDrawColor(180, 180, 180, 255);
    DrawCellRight(C, "Ping", CurX, Y, W * 0.05, H, YL);
}

// ─────────────────────────────────────────────────────────────────────────────
// Player rows
// ─────────────────────────────────────────────────────────────────────────────

simulated function DrawPlayerRows(Canvas C, out SBPlayerData Players[16], int PlayerCount,
                                   float X, float Y, float W, float RowH, float ScaleX)
{
    local int i;
    local float RowY;

    if (PlayerCount == 0)
    {
        // No players — show empty message
        C.Font = ScoreFont;
        C.SetDrawColor(120, 120, 120, 255);
        C.SetPos(X + W * 0.5 - 60, Y + RowH * 0.5);
        C.DrawText("No survivors in the field");
        return;
    }

    for (i = 0; i < PlayerCount; i++)
    {
        RowY = Y + (i * RowH);

        // Subtle alternating row backgrounds (no red tint)
        if (i % 2 == 0)
            C.SetDrawColor(0, 0, 0, 60);
        else
            C.SetDrawColor(0, 0, 0, 90);
        C.SetPos(X, RowY);
        C.DrawRect(Texture'Engine.WhiteSquareTexture', W, RowH);

        DrawPlayerRow(C, Players[i], i, X, RowY, W, RowH);
    }
}

simulated function DrawPlayerRow(Canvas C, SBPlayerData P, int Index,
                                  float X, float Y, float W, float RowH)
{
    local float CurX;
    local float XL, YL;
    local float HpPct;
    local string PerkDisplay;
    local string CashStr;
    local byte PR, PG, PB;

    C.Font = ScoreFont;
    C.TextSize("X", XL, YL);

    CurX = X;

    // # — rank number (3%)
    C.SetDrawColor(120, 120, 120, 255);
    DrawCellRight(C, string(Index + 1), CurX, Y, W * 0.03, RowH, YL);
    CurX += W * 0.03;

    // Player name — white (14%)
    C.SetDrawColor(255, 255, 255, 255);
    DrawCellLeftClipped(C, P.PlayerName, CurX + 4, Y, W * 0.14 - 8, RowH, YL);
    CurX += W * 0.14;

    // Perk — colored by perk type (9%)
    GetPerkColor(P.PerkName, PR, PG, PB);
    PerkDisplay = GetPerkDisplayName(P.PerkName);
    if (P.PerkLevel > 0)
        PerkDisplay = PerkDisplay $ " " $ P.PerkLevel;
    C.SetDrawColor(PR, PG, PB, 255);
    DrawCellLeftClipped(C, PerkDisplay, CurX + 4, Y, W * 0.09 - 8, RowH, YL);
    CurX += W * 0.09;

    // Total Kills — white (5%)
    C.SetDrawColor(255, 255, 255, 255);
    DrawCellRight(C, string(P.TotalKills), CurX, Y, W * 0.05, RowH, YL);
    CurX += W * 0.05;

    // Monster kill columns (4.5% each)
    DrawMonsterCell(C, P.Clot, 180, 180, 180, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Gorefast, 248, 113, 113, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Crawler, 74, 222, 128, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Stalker, 192, 132, 252, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Bloat, 250, 204, 21, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Siren, 244, 114, 182, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Husk, 251, 146, 60, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Scrake, 34, 211, 238, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Fleshpound, 239, 68, 68, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;
    DrawMonsterCell(C, P.Boss, 253, 224, 71, CurX, Y, W * 0.045, RowH, YL);
    CurX += W * 0.045;

    // Cash — yellow with pound sign (7%)
    CashStr = Chr(163) $ string(P.Cash);
    C.SetDrawColor(250, 204, 21, 200);
    DrawCellRight(C, CashStr, CurX, Y, W * 0.07, RowH, YL);
    CurX += W * 0.07;

    // HP — color-coded by percentage (5%)
    if (P.Health <= 0)
    {
        C.SetDrawColor(220, 38, 38, 255);
        DrawCellRight(C, "DEAD", CurX, Y, W * 0.05, RowH, YL);
    }
    else
    {
        if (P.MaxHealth > 0)
            HpPct = (float(P.Health) / float(P.MaxHealth)) * 100.0;
        else
            HpPct = 100.0;

        if (HpPct > 60.0)
            C.SetDrawColor(74, 222, 128, 255);
        else if (HpPct > 25.0)
            C.SetDrawColor(250, 204, 21, 255);
        else
            C.SetDrawColor(248, 113, 113, 255);

        DrawCellRight(C, string(P.Health), CurX, Y, W * 0.05, RowH, YL);
    }
    CurX += W * 0.05;

    // Ping — gray (5%)
    C.SetDrawColor(120, 120, 120, 255);
    DrawCellRight(C, string(P.Ping), CurX, Y, W * 0.05, RowH, YL);
}

// ─────────────────────────────────────────────────────────────────────────────
// Monster kill cell helper — uses column color or dimmed gray for zeros
// ─────────────────────────────────────────────────────────────────────────────

simulated function DrawMonsterCell(Canvas C, int Value, byte R, byte G, byte B,
                                    float X, float Y, float W, float H, float YL)
{
    if (Value > 0)
        C.SetDrawColor(R, G, B, 255);
    else
        C.SetDrawColor(80, 80, 80, 255);

    DrawCellRight(C, string(Value), X, Y, W, H, YL);
}

// ─────────────────────────────────────────────────────────────────────────────
// Text drawing helpers — left-aligned and right-aligned cells
// ─────────────────────────────────────────────────────────────────────────────

/** Draw text right-aligned within a cell of given width. */
simulated function DrawCellRight(Canvas C, string Text, float X, float Y,
                                  float W, float H, float FontH)
{
    local float TXL, TYL;

    C.TextSize(Text, TXL, TYL);
    C.SetPos(X + W - TXL - 2, Y + (H - FontH) * 0.5);
    C.DrawText(Text);
}

/** Draw text left-aligned within a cell. */
simulated function DrawCellLeft(Canvas C, string Text, float X, float Y,
                                 float W, float H, float FontH)
{
    C.SetPos(X, Y + (H - FontH) * 0.5);
    C.DrawText(Text);
}

/** Draw text left-aligned, clipped to cell width (truncates with ".."). */
simulated function DrawCellLeftClipped(Canvas C, string Text, float X, float Y,
                                        float MaxW, float H, float FontH)
{
    local float TXL, TYL;
    local string Truncated;

    C.TextSize(Text, TXL, TYL);

    if (TXL <= MaxW)
    {
        C.SetPos(X, Y + (H - FontH) * 0.5);
        C.DrawText(Text);
        return;
    }

    // Truncate until it fits with ".." suffix
    Truncated = Text;
    while (Len(Truncated) > 1)
    {
        Truncated = Left(Truncated, Len(Truncated) - 1);
        C.TextSize(Truncated $ "..", TXL, TYL);
        if (TXL <= MaxW)
        {
            C.SetPos(X, Y + (H - FontH) * 0.5);
            C.DrawText(Truncated $ "..");
            return;
        }
    }

    // Fallback: just draw what we can
    C.SetPos(X, Y + (H - FontH) * 0.5);
    C.DrawText(Left(Text, 1));
}

// ─────────────────────────────────────────────────────────────────────────────
// Collect player data from replication info
// ─────────────────────────────────────────────────────────────────────────────

/** Gather all non-spectator players into the fixed-size array. Returns count. */
simulated function int CollectPlayers(out SBPlayerData Players[16])
{
    local int Count;
    local int i;
    local PlayerReplicationInfo PRI;
    local KFPlayerReplicationInfo KFPRI;
    local UliunaiPRI UPRI;
    local string PerkStr;
    local GameReplicationInfo MyGRI;
    local PlayerController LocalPC;

    Count = 0;

    // Access GRI via local PlayerController (works on client, unlike Level.Game.GRI)
    LocalPC = Level.GetLocalPlayerController();
    if (LocalPC != None)
        MyGRI = LocalPC.GameReplicationInfo;

    if (MyGRI == None)
        return 0;

    for (i = 0; i < MyGRI.PRIArray.Length; i++)
    {
        if (Count >= MAX_PLAYERS) break;

        PRI = MyGRI.PRIArray[i];
        if (PRI == None) continue;
        if (PRI.bOnlySpectator) continue;

        KFPRI = KFPlayerReplicationInfo(PRI);
        if (KFPRI == None) continue;

        // Get perk info
        PerkStr = GetPerkNameFromPRI(KFPRI);

        // Try to find UliunaiPRI for monster kill breakdown
        UPRI = FindUliunaiPRI(PRI);

        Players[Count].PlayerName = PRI.PlayerName;
        Players[Count].PerkName = PerkStr;
        Players[Count].PerkLevel = KFPRI.ClientVeteranSkillLevel;
        Players[Count].Cash = int(PRI.Score);
        Players[Count].Ping = PRI.Ping;
        Players[Count].bValid = true;

        // Monster kills from UliunaiPRI
        if (UPRI != None)
        {
            Players[Count].Clot       = UPRI.Clot;
            Players[Count].Gorefast   = UPRI.Gorefast;
            Players[Count].Crawler    = UPRI.Crawler;
            Players[Count].Stalker    = UPRI.Stalker;
            Players[Count].Bloat      = UPRI.Bloat;
            Players[Count].Siren      = UPRI.Siren;
            Players[Count].Husk       = UPRI.Husk;
            Players[Count].Scrake     = UPRI.Scrake;
            Players[Count].Fleshpound = UPRI.Fleshpound;
            Players[Count].Boss       = UPRI.Boss;

            // Total kills = sum of all monster types
            Players[Count].TotalKills = UPRI.Clot + UPRI.Gorefast + UPRI.Crawler
                                      + UPRI.Stalker + UPRI.Bloat + UPRI.Siren
                                      + UPRI.Husk + UPRI.Scrake + UPRI.Fleshpound
                                      + UPRI.Boss;
        }
        else
        {
            // Fallback: use KFPRI.Kills as total, no per-monster breakdown
            Players[Count].TotalKills = KFPRI.Kills;
        }

        // Health — find the pawn via controller list
        FindPlayerHealth(PRI, Players[Count].Health, Players[Count].MaxHealth);

        Count++;
    }

    return Count;
}

// ─────────────────────────────────────────────────────────────────────────────
// Find UliunaiPRI in the LinkedReplicationInfo chain
// ─────────────────────────────────────────────────────────────────────────────

/** Walk the PRI.CustomReplicationInfo linked list looking for UliunaiPRI. */
simulated function UliunaiPRI FindUliunaiPRI(PlayerReplicationInfo PRI)
{
    local LinkedReplicationInfo LRI;
    local UliunaiPRI UPRI;

    if (PRI == None) return None;

    LRI = PRI.CustomReplicationInfo;
    while (LRI != None)
    {
        UPRI = UliunaiPRI(LRI);
        if (UPRI != None)
            return UPRI;
        LRI = LRI.NextReplicationInfo;
    }

    return None;
}

// ─────────────────────────────────────────────────────────────────────────────
// Find player health by walking the controller list
// ─────────────────────────────────────────────────────────────────────────────

/** Find health by iterating all Pawns (works client-side). */
simulated function FindPlayerHealth(PlayerReplicationInfo PRI,
                                     out int OutHealth, out int OutMaxHealth)
{
    local Pawn P;

    OutHealth = 0;
    OutMaxHealth = 100;

    foreach DynamicActors(class'Pawn', P)
    {
        if (P.PlayerReplicationInfo == PRI)
        {
            OutHealth = P.Health;
            OutMaxHealth = P.HealthMax;
            return;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sort players by total kills (descending) — bubble sort
// ─────────────────────────────────────────────────────────────────────────────

simulated function SortPlayersByKills(out SBPlayerData Players[16], int Count)
{
    local int i, j;
    local SBPlayerData Temp;
    local bool bSwapped;

    if (Count <= 1) return;

    // Simple bubble sort — perfectly fine for max 6-16 players
    for (i = 0; i < Count - 1; i++)
    {
        bSwapped = false;
        for (j = 0; j < Count - 1 - i; j++)
        {
            if (Players[j].TotalKills < Players[j + 1].TotalKills)
            {
                // Swap
                Temp = Players[j];
                Players[j] = Players[j + 1];
                Players[j + 1] = Temp;
                bSwapped = true;
            }
        }
        // Early exit if no swaps occurred
        if (!bSwapped) break;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Perk name extraction
// ─────────────────────────────────────────────────────────────────────────────

/** Extract perk name from KFPRI — strips package prefix and "KFVet" prefix. */
simulated function string GetPerkNameFromPRI(KFPlayerReplicationInfo KFPRI)
{
    local string S;

    if (KFPRI.ClientVeteranSkill == None)
        return "None";

    S = string(KFPRI.ClientVeteranSkill);

    // Strip package prefix (everything before and including ".")
    if (InStr(S, ".") >= 0)
        S = Mid(S, InStr(S, ".") + 1);

    // Strip "KFVet" prefix
    if (Left(S, 5) ~= "KFVet")
        S = Mid(S, 5);

    return S;
}

/** Get a shortened display name for perks (matching website display). */
simulated function string GetPerkDisplayName(string PerkName)
{
    if (PerkName ~= "FieldMedic")   return "Medic";
    if (PerkName ~= "SupportSpec")  return "Support";
    if (PerkName ~= "Sharpshooter") return "Sharp";
    if (PerkName ~= "Berserker")    return "Berserker";
    if (PerkName ~= "Commando")     return "Commando";
    if (PerkName ~= "Firebug")      return "Firebug";
    if (PerkName ~= "Demolitions")  return "Demo";
    if (PerkName ~= "None")         return "None";
    return PerkName;
}

// ─────────────────────────────────────────────────────────────────────────────
// Perk color mapping (matching website PERK_COLORS)
// ─────────────────────────────────────────────────────────────────────────────

/** Return RGB color for a given perk name. */
simulated function GetPerkColor(string PerkName, out byte R, out byte G, out byte B)
{
    if (PerkName ~= "Berserker")
    {
        R = 248; G = 113; B = 113;     // red-400
    }
    else if (PerkName ~= "FieldMedic")
    {
        R = 96;  G = 165; B = 250;     // blue-400
    }
    else if (PerkName ~= "SupportSpec")
    {
        R = 163; G = 230; B = 53;      // lime-400
    }
    else if (PerkName ~= "Sharpshooter")
    {
        R = 125; G = 211; B = 252;     // sky-300
    }
    else if (PerkName ~= "Commando")
    {
        R = 74;  G = 222; B = 128;     // green-400
    }
    else if (PerkName ~= "Firebug")
    {
        R = 251; G = 146; B = 60;      // orange-400
    }
    else if (PerkName ~= "Demolitions")
    {
        R = 250; G = 204; B = 21;      // yellow-400
    }
    else
    {
        // Default / None — gray
        R = 180; G = 180; B = 180;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Difficulty name helper
// ─────────────────────────────────────────────────────────────────────────────

simulated function string GetDifficultyName(float Diff)
{
    if (Diff <= 1.0) return "Beginner";
    if (Diff <= 2.0) return "Normal";
    if (Diff <= 4.0) return "Hard";
    if (Diff <= 5.0) return "Suicidal";
    return "HoE";
}

// ─────────────────────────────────────────────────────────────────────────────

defaultproperties
{
}
