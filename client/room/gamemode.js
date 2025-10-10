import { Players, Inventory, LeaderBoard, BuildBlocksSet, Spawns, Teams, Ui, Game, GameMode, TeamsBalancer, Properties, Timers, Damage, BreackGraph } from "pixel_combats/room";
import { DisplayValueHeader, Color } from "pixel_combats/basic";

// константы
const WaitingPlayersTime = 10;
const HideAndSeekTime = 20;
const GameModeTime = 300;
const End0fMatchTime = 10;
const WaitingModeStateValue = "WaitingMode";
const HideAndSeekStateValue = "HideAndSeek";
const GameStateValue = "GameMode";
const End0fMatchStateValue = "End0fMatch";
const mainTimer = Timers.GetContext().Get("Main");
const stateProp = Properties.GetContext().Get("State");

// настройки 
Damage.GetContext().FriendliFire.Value = GameMode.Parameters.GetBool("FriendliFire");
BreackGraph.Damage = GameMode.Parameters.GetBool("BlocksDamage");
BreackGraph.BreackAll = GameMode.Parameters.GetBool("LoosenBlocks");
BreackGraph.PlayerBlockBoost = true;
Damage.GetContext().DamageOut.Value = true;
Damage.GetContext().DranadeTouchExplosive.Value = true;
Ui.GetContext().MainTimerId.Value = mainTimer.Id;
TeamsBalancer.IsAutoBalance = true;

// создаем команды
const blueTeam = CreateNewTeam("Blue", "ВЫЖИВШИЕ\nПрячущиеся и убегающие игроки.", new Color(0, 0, 125/255, 0), 1, BuildBlocksSet.Blue);
const redTeam = CreateNewTeam("Red", "НАДЗИРАТЕЛИ\nИскатели прячущихся игроков.", new Color(125/255, 0, 0, 0), 2, BuildBlocksSet.Red);
const DeadTeam = CreateNewTeam("Dead", "МЕРТВЫЕ\nУбитые игроки в комнате.", new Color(0, 0, 0, 0), 3, BuildBlocksSet.Red);
// лидерборд команд
LeaberBoard.PlayerLeaberBoardValues = [
 new DisplayValueHeader("Kills", "\nКиллы", "\nКиллы"),
 new DisplayValueHeader("Deaths", "\nСмерти", "\nСмерти"),
 new DisplayValueHeader("Scores", "\nОчки", "\nОчки"),
 new DisplayValueHeader("Spawns", "\nСпавны", "\nСпавны")
];
LeaberBoard.TeamWeightGetter.Set
