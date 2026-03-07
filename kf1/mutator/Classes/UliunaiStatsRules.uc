///////////////////////////////////////////////////////////////////////////////
// UliunaiStatsRules — GameRules subclass for kill/damage/game-end tracking
//
// KF1's Mutator class doesn't have ScoreKill, but GameRules does.
// Also hooks NetDamage for damage tracking and CheckEndGame for win/loss.
// Spawned by UliunaiStats mutator, registered in the game rules chain.
///////////////////////////////////////////////////////////////////////////////
class UliunaiStatsRules extends GameRules;

var UliunaiStats StatsMutator;

function ScoreKill(Controller Killer, Controller Other)
{
    local KFMonster M;
    local int idx;
    local string MonsterType;
    local bool bHeadshot;

    Super.ScoreKill(Killer, Other);

    if (StatsMutator == None) return;
    if (Killer == None || Other == None) return;
    if (PlayerController(Killer) == None) return;
    if (Other.Pawn == None) return;

    M = KFMonster(Other.Pawn);
    if (M == None)
    {
        // Player killed by another player (PvP death) — record death only
        if (PlayerController(Other) != None)
            StatsMutator.RecordCumulativeDeath(Other);
        return;
    }

    // Determine monster type
    MonsterType = ClassifyMonster(M);

    // Detect headshot (decapitation)
    bHeadshot = M.bDecapitated;

    // Update live per-session kill tracking
    idx = StatsMutator.GetKillIndex(Killer);
    if (MonsterType == "CLOT")           StatsMutator.KillTracking[idx].Clot++;
    else if (MonsterType == "GOREFAST")  StatsMutator.KillTracking[idx].Gorefast++;
    else if (MonsterType == "CRAWLER")   StatsMutator.KillTracking[idx].Crawler++;
    else if (MonsterType == "STALKER")   StatsMutator.KillTracking[idx].Stalker++;
    else if (MonsterType == "BLOAT")     StatsMutator.KillTracking[idx].Bloat++;
    else if (MonsterType == "SIREN")     StatsMutator.KillTracking[idx].Siren++;
    else if (MonsterType == "HUSK")      StatsMutator.KillTracking[idx].Husk++;
    else if (MonsterType == "SCRAKE")    StatsMutator.KillTracking[idx].Scrake++;
    else if (MonsterType == "FLESHPOUND") StatsMutator.KillTracking[idx].Fleshpound++;
    else if (MonsterType == "BOSS")      StatsMutator.KillTracking[idx].Boss++;
    else                                 StatsMutator.KillTracking[idx].Other++;

    // Update cumulative stats
    StatsMutator.RecordCumulativeKill(Killer, MonsterType, bHeadshot);
}

/** Called when a player dies (killed by monster). */
function bool PreventDeath(Pawn Killed, Controller Killer, class<DamageType> DamageType, vector HitLocation)
{
    // Track player deaths from monsters
    if (StatsMutator != None && Killed != None && Killed.Controller != None)
    {
        if (PlayerController(Killed.Controller) != None && (Killer == None || PlayerController(Killer) == None))
            StatsMutator.RecordCumulativeDeath(Killed.Controller);
    }

    return Super.PreventDeath(Killed, Killer, DamageType, HitLocation);
}

/** Track damage dealt by players to monsters. */
function int NetDamage(int OriginalDamage, int Damage, Pawn Injured, Pawn InstigatedBy, vector HitLocation, out vector Momentum, class<DamageType> DamageType)
{
    // Only track player -> monster damage
    if (StatsMutator != None && InstigatedBy != None && InstigatedBy.Controller != None && Injured != None)
    {
        if (PlayerController(InstigatedBy.Controller) != None && KFMonster(Injured) != None)
            StatsMutator.RecordDamage(InstigatedBy.Controller, Damage);
    }

    return Super.NetDamage(OriginalDamage, Damage, Injured, InstigatedBy, HitLocation, Momentum, DamageType);
}

/** Detect game end — determine if players won or lost. */
function bool CheckEndGame(PlayerReplicationInfo Winner, string Reason)
{
    local bool bWon;

    if (StatsMutator != None)
    {
        // In KF1, if the game ends and players survived all waves, they won
        // "WaveComplete" or similar reason, or check if final wave was beaten
        if (StatsMutator.KFGT != None)
            bWon = (StatsMutator.KFGT.WaveNum >= StatsMutator.KFGT.FinalWave);

        StatsMutator.RecordGameEnd(bWon);
    }

    return Super.CheckEndGame(Winner, Reason);
}

function string ClassifyMonster(KFMonster M)
{
    local string cn;
    cn = Caps(string(M.Class.Name));

    if (InStr(cn, "CLOT") >= 0 && InStr(cn, "BLOAT") < 0) return "CLOT";
    if (InStr(cn, "GOREFAST") >= 0)    return "GOREFAST";
    if (InStr(cn, "CRAWLER") >= 0)     return "CRAWLER";
    if (InStr(cn, "STALKER") >= 0)     return "STALKER";
    if (InStr(cn, "BLOAT") >= 0)       return "BLOAT";
    if (InStr(cn, "SIREN") >= 0)       return "SIREN";
    if (InStr(cn, "HUSK") >= 0)        return "HUSK";
    if (InStr(cn, "SCRAKE") >= 0)      return "SCRAKE";
    if (InStr(cn, "FLESHPOUND") >= 0 || InStr(cn, "FLESH") >= 0) return "FLESHPOUND";
    if (InStr(cn, "BOSS") >= 0 || InStr(cn, "PATRIARCH") >= 0)   return "BOSS";
    return "OTHER";
}

defaultproperties
{
}
