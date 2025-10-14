import { Players, Inventory, LeaderBoard, BuildBlocksSet, Spawns, Teams, Ui, Game, GameMode, TeamsBalancer, Properties, Timers, Damage, BreackGraph } from "pixel_combats/room";
import { DisplayValueHeader, Color } from "pixel_combats/basic";

// константы
const WaitingPlayersTime = 10;
const HideAndSeekTime = 20;
const GameModeTime = 300;
const WinTeamsTime = 15;
const End0fMatchTime = 10;
const WaitingModeStateValue = "WaitingMode";
const HideAndSeekStateValue = "HideAndSeek";
const GameStateValue = "GameMode";
const WinTeamsStateValue = "WinTeams";
const End0fMatchStateValue = "End0fMatch";
const maxPlayers = 
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

// вход в команды по запросу
Teams.OnRequestJoinTeam.Add(function(p) {
 blueTeam.Add(p);
 redTeam.Add(p);
 deadTeam.Remove(p);
});
// спавн по входу в команду
Teams.OnPlayerChangeTeam.Add(function(p) {
 p.Spawns.Spawn();
 Spawns.GetContext(p).RespawnEnable = true;
});
 
// щит игрока
Spawns.GetContext().OnSpawn.Add(function(p) {
 p.Properties.Immortality.Value = true;
 p.Timers.Get("Immortality").Restart(3);
});
Timers.OnPlayerTimer.Add(function(t) {
 if (t.Id != "Immortality") return;
  t.Player.Properties.Get("Immortality").Value = false;
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
   Spawns.GetContext(p).RespawnEnable.Value = false;
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
  case WinTeamsStateValue:
   SetEnd0fMatch();
   break;
  case End0fMatchStateValue:
   RestartGame();
       }
});

// задаем первое игровое состояние игры
SetWaitingMode();

// состояние игры:
function SetWaitingMode() {
 stateProp.Value = WaitingModeStateValue;
 Ui.GetContext().Hint.Value = "Ожидание, всех - игроков...";
 Spawns.GetContext().Enable = false;
 mainTimer.Restart(WaitingPlayersTime);
}
function SetHideAndSeek() {
 stateProp.Value = HideAndSeekStateValue;
 Ui.GetContext().Hint.Value = "Выберите, команду!";
 blueTeam.Ui.Hint.Value = "Ищите место, где спрятатся!\nНайдите укромное место, или убегайте.";
 redTeam.Ui.Hint.Value = "Помешайте выжившим, спрятатся!\nПриследуйте выживших.";

 blueTeam.Inventory.Melee.Value = false;
 blueTeam.Inventory.Secondary.Value = false;
 blueTeam.Inventory.Main.Value = false;
 blueTeam.Inventory.Explosive.Value = false;
 blueTeam.Inventory.Build.Value = false;
 redTeam.Inventory.Melee.Value = false;
 redTeam.Inventory.Secondary.Value = false;
 redTeam.Inventory.Main.Value = false;
 redTeam.Inventory.Explosive.Value = false;
 redTeam.Inventory.Build.Value = false;

 mainTimer.Restart(HideAndSeekTime);
 Spawns.GetContext().Enable = true;
 TeamsBalancer.IsAutoBalance = false;
 SpawnTeams();
}
function SetGameMode() {
 stateProp.Value = GameStateValue;
 blueTeam.Ui.Hint.Value = "Избегайте надзирателей!\nПрячьтесь или убегайте, от надзирателей.";
 redTeam.Ui.Hint.Value = "Ищите, всех выживших!\nНайдите всех прячущихся, или убегающих.";

 blueTeam.Inventory.Melee.Value = false;
 blueTeam.Inventory.Secondary.Value = false;
 blueTeam.Inventory.Main.Value = false;
 blueTeam.Inventory.Explosive.Value = false;
 blueTeam.Inventory.Build.Value = false;
 redTeam.Inventory.Melee.Value = true;
 redTeam.Inventory.Secondary.Value = true;
 redTeam.Inventory.Main.Value = false;
 redTeam.Inventory.Explosive.Value = false;
 redTeam.Inventory.Build.Value = true;

 blueTeam.Properties.Get("MaxPlayers").Value = maxPlayers;
 Ui.GetContext().TeamProp1.Value = { Team: "Blue", Prop: "MaxPlayers" };
 redTeam.Properties.Get("MaxPlayers").Value = maxPlayers;
 Ui.GetContext().TeamProp2.Value = { Team: "Red", Prop: "MaxPlayers" };
 
 Spawns.GetContext().Despawn();
 mainTimer.Restart(GameModeTime);
 TeamsBalancer.BalanceTeams();
 TeamsBalancer.IsAutoBalance = true;
 SpawnTeams();
}
function WinBlueTeam() {
 stateProp.Value = WinTeamsStateValue;
 Ui.GetContext().Hint.Value = "Время вышло.\nВыжишие спаслись, от надзирателей!";
 blueTeam.Properties.Scores.Value += 30;
 redTeam.Properties.Scores.Value -= 30;

 Spawns.GetContext().Spawn();
 Game.GameOver(redTeam);
 mainTimer.Restart(WinTeamsTime);
}
function WinRedTeam() {
 stateProp.Value = WinTeamsStateValue;
 Ui.GetContext().Hint.Value = "Все выжившие мертвы!\nНадзиратели нашли, всех выживших!";
 redTeam.Properties.Scores.Value += 30;
 blueTeam.Properties.Scores.Value -= 30;

 Spawns.GetContext().Spawn();
 Game.GameOver(blueTeam);
 mainTimer.Restart(WinTeamsTime);
}
function SetEnd0fMatch() {
 stateProp.Value = End0fMatchStateValue;
 Ui.GetContext().Hint.Value = "Конец матча!";

 const spawns = Spawns.GetContext();
 spawns.Enable = false;
 spawns.Despawn();

 MainTimer.Restart(End0fMatchTime);
}
function RestartGame() {
 Game.RestartGame();
}

function SpawnTeams() {
 for (const t of Teams) {
  Spawns.GetContext(t).Spawn();
    }
}
  
 
