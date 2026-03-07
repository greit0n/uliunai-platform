///////////////////////////////////////////////////////////////////////////////
// UliunaiPRI — Per-player monster kill replication for custom scoreboard
//
// LinkedReplicationInfo subclass that replicates per-monster kill counts
// from the server to all clients. Attach to each player's PRI chain so
// the custom scoreboard can read and display kill breakdowns.
///////////////////////////////////////////////////////////////////////////////
class UliunaiPRI extends LinkedReplicationInfo;

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

replication
{
    reliable if (Role == ROLE_Authority)
        Clot, Gorefast, Crawler, Stalker, Bloat, Siren, Husk, Scrake, Fleshpound, Boss;
}

defaultproperties
{
}
