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

// создаем команды
const blueTeam = CreateNewTeam("Blue", "ВЫЖИВШИЕ\nПрячущиеся и убегающие игроки.", new Color(0, 0, 125/255, 0), 1, BuildBlocksSet.Blue);
const redTeam = CreateNewTeam("Red", "НАДЗИРАТЕЛИ\nИскатели прячущихся игроков.", new Color(125/255, 0, 0, 0), 2, BuildBlocksSet.Red);
const deadTeam = CreateNewTeam("Dead", "МЕРТВЫЕ\nУбитые игроки в комнате.", new Color(0, 0, 0, 0), 3, BuildBlocksSet.Red);
// лидерборд команд
LeaberBoard.PlayerLeaberBoardValues = [
 new DisplayValueHeader("Kills", "\nКиллы", "\nКиллы"),
 new DisplayValueHeader("Deaths", "\nСмерти", "\nСмерти"),
 new DisplayValueHeader("Scores", "\nОчки", "\nОчки"),
 new DisplayValueHeader("Spawns", "\nСпавны", "\nСпавны")
];
// вес команды в лидерборде
LeaberBoard.TeamWeightGetter.Set(function(t) {
 return t.Properties.Get("Deaths").Value;
});
// вес игрока в лидерборде
LeaberBoard.PlayersWeightGetter.Add(function(p) {
 return p.Properties.Get("Kills").Value;
});

// щит игрока
Spawns.GetContext().OnSpawn.Add(function(p) {
 p.Properties.Get("Immortality").Value = true;
 p.Timers.Get("Immortality").Restart(3);
});
Timers.OnPlayerTimer.Add(function(t) {
 if (t.Id != "Immortality") p.Team.Properties.Get("Immortality").Value = false;
});

// счетчик спавнов
Spawns.OnSpawn.Add(function(p) {
 ++p.Properties.Spawns.Value;
});

// счетчик смертей
Damage.OnDeath.Add(function(p) {
 ++p.Properties.Deaths.Value;
  deadTeam.Add(p);
  redTeam.Remove(p);
  blueTeam.Remove(p);
  p.Ui.Hint.Value = "Ожидайте, конца матча!";
   p.Spawns.Despawn();
   p.Spawns.RespawnEnable.Value = false;
       if (blueTeam.Properties.Deaths.Value == 1) {
       WinRedTeam();
      }
       if (redTeam.Properties.Deaths.Value == 1) {
        WinBlueTeam();
     }
});

// счетчик убийств
Damage.OnKill.Add(function(k,p) {
 if (p.id != k.id) { ++p.Properties.Kills.Value;
  p.Properties.Scores.Value += 50;
   }
}); 

// таймер переключения режимов
mainTimer.OnTimer.Add(function() {
 switch (stateProp.Value) {
  case WaitingModeStateValue:
   SetHideAndSeek();
   break;
  case HideAndSeekStateValue:
   SetGameMode();
   break;
  case GameStateValue:
   WinBlueTeam();
   break;
  case End0fMatchStateValue:
   RestartGame();
   break;
       }
});

// задаем первое игровое состояние игры
SetWaitingMode();

// состояние игры:
function SetWaitingMode() {
 stateProp.Value = WaitingModeStateValue;
 Ui.GetContext().Hint.Value = "Ожиадние, всех - игроков...";
 Spawns.GetContext().Enable = false;
 mainTimer.Restart(WaitingPlayersTime);
}
functim 
 
