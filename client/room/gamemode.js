import { Players, Inventory, LeaderBoard, BuildBlocksSet, Spawns, Teams, Ui, Game, GameMode, TeamsBalancer, Properties, Timers, Damage, BreackGraph } from "pixel_combats/room";
import { DisplayValueHeader, Color } from "pixel_combats/basic";

// * Задаём константы, которые будут работать в режиме, для работоспособность игровых режимов. * //
const WaitingPlayersTime = 11;
const HideAndSeekTime = 31;
const GameModeTime = 301;
const WinTeamsTime = 16;
const End0fMatchTime = 11;
const blueCount = 0;
const redCount = 0;
const WaitingModeStateValue = `WaitingMode`;
const HideAndSeekStateValue = `HideAndSeek`;
const GameStateValue = `GameMode`;
const WinTeamsStateValue = `WinTeams`;
const End0fMatchStateValue = `End0fMatch`;
const mainTimer = Timers.GetContext().Get(`Main`);
const stateProp = Properties.GetContext().Get(`State`);

// * Игровые настройки параметров, и заданные настройки в игре. * //
Damage.GetContext().FriendliFire.Value = GameMode.Parameters.GetBool("FriendliFire");
BreackGraph.Damage = GameMode.Parameters.GetBool("BlocksDamage");
BreackGraph.BreackAll = GameMode.Parameters.GetBool("LoosenBlocks");
BreackGraph.PlayerBlockBoost = true;
Damage.GetContext().DamageOut.Value = true;
Damage.GetContext().DranadeTouchExplosive.Value = true;
Ui.GetContext().MainTimerId.Value = mainTimer.Id;

// * Создаем команды, из функции - команд создания.
const blueTeam = CreateNewTeam("Blue", "ВЫЖИВШИЕ\nЛюди в комнате.", new Color(0, 0, 125/255, 0), 1, BuildBlocksSet.Blue);
const redTeam = CreateNewTeam("Red", "НАДЗИРАТЕЛИ\nИскатели выживших.", new Color(125/255, 0, 0, 0), 2, BuildBlocksSet.Red);
const deadTeam = CreateNewTeam("Dead", "МЕРТВЫЕ\nУбитые выжившие в комнате.", new Color(0, 0, 0, 0), 3, BuildBlocksSet.Red);
// * Вносим в таблицу лидерборда значения, которые нужны в игре. * //
LeaberBoard.PlayerLeaberBoardValues = [
 new DisplayValueHeader("Kills", "\nКиллы", "\nКиллы"),
 new DisplayValueHeader("Deaths", "\nСмерти", "\nСмерти"),
 new DisplayValueHeader("Scores", "\nОчки", "\nОчки"),
 new DisplayValueHeader("Spawns", "\nСпавны", "\nСпавны")
];
// * Обрабатываем список лидирующих, для команд с наилучшими - значениями по смертям. * //
LeaberBoard.TeamWeightGetter.Set(function(t) {
 return t.Properties.Get("Deaths").Value;
});
// * Список лидирующих, для игроков по лучшими значениями дл киллов. * //
LeaberBoard.PlayersWeightGetter.Add(function(p) {
 return p.Properties.Get("Kills").Value;
});

// * Задаём вход в команды, для выбора команд - игроков. * //
Teams.OnRequestJoinTeam.Add(function(p) {
blueTeam.Add(p);
redTeam.Add(p);
deadTeam.Remove(p);
  if (p.Team == redTeam) ++redCount; 
  if (p.Team == blueTeam) ++blueCount;    
});
// * Сразу после входа в команду, респавним игрока - на спавн. * //
Teams.OnPlayerChangeTeam.Add(function(p) {p.Spawns.Spawn(); });
 
// * Обработчик бессмертия игрока, после респавна. * //
Spawns.GetContext().OnSpawn.Add(function(p) {
 p.Properties.Immortality.Value = true;
 p.Timers.Get(`Immortality`).Restart(3);
});
Timers.OnPlayerTimer.Add(function(t) {
 if (t.Id != `Immortality`) t.Player.Properties.Get("Immortality").Value = false;
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
   Spawns.GetContext(p).Despawn();
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

 blueTeam.Properties.Get("MaxPlayersBlue").Value = blueCount;
 Ui.GetContext().TeamProp1.Value = { Team: "Blue", Prop: "MaxPlayersBlue" };
 redTeam.Properties.Get("MaxPlayersRed").Value = redCount;
 Ui.GetContext().TeamProp2.Value = { Team: "Red", Prop: "MaxPlayersRed" };
 
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
  
 
