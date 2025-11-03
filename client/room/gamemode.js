import { Players, room, Inventory, LeaderBoard, BuildBlocksSet, Spawns, Teams, Ui, Game, GameMode, TeamsBalancer, Properties, Timers, Damage, BreackGraph, NewGame, NewGameVote } from "pixel_combats/room";
import { DisplayValueHeader, Color } from 'pixel_combats/basic';
import * as default_timer from './default_timer.js';
try {
// * Задаём константы, которые будут работать в режиме, для работоспособность игровых режимов. * //
room.PopupsEnable = true;
const WaitingPlayersTime = 11;
const HideAndSeekTime = 31;
const GameModeTime = default_timer.GameModeMatchTime();
const WinTeamsTime = 16;
const End0fMatchTime = 11;
const WINNER_SCORES = 30;
const LOOSER_SCORES = 15;
const WaitingModeStateValue = `WaitingMode`;
const HideAndSeekStateValue = `HideAndSeek`;
const GameStateValue = `GameMode`;
const WinTeamsStateValue = `WinTeams`;
const End0fMatchStateValue = `End0fMatch`;
const WaitingAllPlayersForHint = `<b>\nОжидание, всех - игроков...</b>`;
const ContextAllViborTeamsForHint = `<b>\nВыберите, команду!</b>`;
const BlueIschetMestoHidengiliBegForHint = `\nИщите место где спрятатся, или убегайте!`;
const RedSleditGdeBlueHidengIliBegaetForHint = `\nСледите где спрячутся выжившие, или где убегают!`;
const BlueHidendIliYrunsForHint = `\nПрячьтесь в укромном месте, или убегайте от надзирателей!`;
const RedIschetBluePlayersForHint = `\nНайдите, всех выживших!`;
const BlueWinnerTeamLoosersRedForHint = `\nВыжившие смогли продержатся, с надзирателями!`;
const RedWinnerTeamLoosersBlueForHint = `\nНадзиратели, нашли всех выживших!`;
const EndingeMatchForHint = `\nКонец, матча!`;
const mainTimer = Timers.GetContext().Get(`Main`);
const stateProp = Properties.GetContext().Get(`State`);

// * Игровые настройки параметров, и заданные настройки в игре. * //
const MapRotation = GameMode.Parameters.GetBool('MapRotation');
Damage.GetContext().FriendlyFire.Value = GameMode.Parameters.GetBool(`FriendlyFire`);
BreackGraph.Damage = GameMode.Parameters.GetBool(`BlocksDamage`);
BreackGraph.WeakBlocks = GameMode.Parameters.GetBool(`LoosenBlocks`);
Damage.GetContext().DamageOut.Value = true;
Damage.GetContext().GranadeTouchExplosion.Value = true;
Ui.GetContext().MainTimerId.Value = mainTimer.Id;

// * Создаем команды, из функции - команд создания.
const blueTeam = CreateNewTeam(`Blue`, `ВЫЖИВШИЕ\nЛюди в комнате.`, new Color(0, 0, 125/255, 0), 1, BuildBlocksSet.Blue);
const redTeam = CreateNewTeam(`Red`, `НАДЗИРАТЕЛИ\nИскатели выживших.`, new Color(125/255, 0, 0, 0), 2, BuildBlocksSet.Red);
const deadTeam = CreateNewTeam(`Dead`, `МЁРТВЫЕ\nУбитые выжившие в комнате.`, new Color(0, 0, 0, 0), 3, BuildBlocksSet.Red);

// * Вносим в лидерборд значения, которые необходимо вводить в таблицу. * //
LeaderBoard.PlayerLeaderBoardValues = [
 new DisplayValueHeader(`Kills`, `KILLS\nКиллы`, `KILLS\nКиллы`),
 new DisplayValueHeader(`Deaths`, `DEATHS\nСмерти`, `DEATHS\nСмерти`),
 new DisplayValueHeader(`Scores`, `SCORES\nОчки`, `SCORES\nОчки`),
 new DisplayValueHeader(`Spawns`, `SPAWNS\nСпавны`, `SPAWNS\nСпавны`)
];
// * Обрабатываем список лидирующих, для команд с наилучшими - значениями по смертям. * //
LeaderBoard.TeamWeightGetter.Set(function (t) {
 return t.Properties.Get(`Deaths`).Value;
});
// * Список лидирующих, для игроков по лучшими значениями дл киллов. * //
LeaderBoard.PlayersWeightGetter.Set(function (p) {
 return p.Properties.Get(`Kills`).Value;
});

// * Задаём вход в команды, для выбора команд - игроков. * //
Teams.OnRequestJoinTeam.Add(function(p, t) { t.Add(p); });
  
// * Сразу после входа в команду, респавним игрока - на спавн. * //
Teams.OnPlayerChangeTeam.Add(function(p, t) { p.Spawns.Spawn(); });
  
// * Обработчик бессмертия игрока, после респавна. * //
Spawns.GetContext().OnSpawn.Add(function(p) {
 p.Properties.Immortality.Value = true;
 p.Timers.Get(`Immortality`).Restart(3);
});
Timers.OnPlayerTimer.Add(function(t) {
 if (t.Id != `Immortality`) return;
 t.Player.Properties.Get(`Immortality`).Value = false;
});

// * Обработчик спавнов. * //
Spawns.OnSpawn.Add(function(p) {
 ++p.Properties.Spawns.Value;
});

// * Обработчик смертей. * //
Damage.OnDeath.Add(function(p) {
 ++p.Properties.Deaths.Value;
 blueTeam.Remove(p);
 redTeam.Remove(p);
 deadTeam.Add(p);
  p.Ui.Hint.Value = `\nОжидайте, конца матча!`;
  const spawns = Spawns.GetContext(p);
  spawns.Despawn();
  spawns.RespawnEnable.Value = false;
   if (blueTeam.Properties.Deaths.Value == 1) { WinRedTeam(); }
   if (redTeam.Properties.Deaths.Value == 1) { WinBlueTeam(); }
});

// * Обработчик киллов. * //
Damage.OnKill.Add(function(k,p) {
 if (p.id !== k.id) { 
 ++p.Properties.Kills.Value;
  p.Properties.Scores.Value += 50;
   }
}); 

// * Основной таймер, переключения режимов игры. * //
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
   START_VOTE();
  if (!GameMode.Parameters.GetBool('MapRotation')) RestartGame();
   break;
       }
});

// * Первеночальное, игровое состояние игры. * //
SetWaitingMode();

// * Состояние, игровых режимов игры. * //
function SetWaitingMode() {
 stateProp.Value = WaitingModeStateValue;
 Ui.GetContext().Hint.Value = WaitingAllPlayersForHint;
 Spawns.GetContext().Enable = false;
 mainTimer.Restart(WaitingPlayersTime);
}
function SetHideAndSeek() {
 stateProp.Value = HideAndSeekStateValue;
 Ui.GetContext().Hint.Value = ContextAllViborTeamsForHint;
 blueTeam.Ui.Hint.Value = BlueIschetMestoHidengiliBegForHint;
 redTeam.Ui.Hint.Value = RedSleditGdeBlueHidengIliBegaetForHint;
 
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
 deadTeam.Remove(p);
 SpawnTeams();
}
function SetGameMode() {
 stateProp.Value = GameStateValue;
 blueTeam.Ui.Hint.Value = BlueHidendIliYrunsForHint;
 redTeam.Ui.Hint.Value = RedIschetBluePlayersForHint;

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

 Spawns.GetContext().Despawn();
 mainTimer.Restart(GameModeTime);
 SpawnTeams();
}
function WinBlueTeam() {
 stateProp.Value = WinTeamsStateValue;
 Ui.GetContext().Hint.Value = BlueWinnerTeamLoosersRedForHint;
 blueTeam.Properties.Scores.Value += WINNER_SCORES;
 redTeam.Properties.Scores.Value += LOOSER_SCORES;
 
 Spawns.GetContext().Spawn();
 Game.GameOver(redTeam);
 mainTimer.Restart(WinTeamsTime);
}
function WinRedTeam() {
 stateProp.Value = WinTeamsStateValue;
 Ui.GetContext().Hint.Value = RedWinnerTeamLoosersBlueForHint;
 redTeam.Properties.Scores.Value += WINNER_SCORES;
 blueTeam.Properties.Scores.Value += LOOSER_SCORES;
 
 Spawns.GetContext().Spawn();
 Game.GameOver(blueTeam);
 mainTimer.Restart(WinTeamsTime);
}
function SetEnd0fMatch() {
 stateProp.Value = End0fMatchStateValue;
 Ui.GetContext().Hint.Value = EndingeMatchForHint;

 const spawns = Spawns.GetContext();
 spawns.Enable = false;
 spawns.Despawn();

 mainTimer.Restart(End0fMatchTime);
}

function OnVoteResult(v) {
if (v.Result === null) return;
 NewGame.RestartGame(v.Result);
}
NewGameVote.OnResult.Add(OnVoteResult);

function START_VOTE() {
 NewGameVote.Start({
  Variants: [{ MapId: 0 }],
  Timer: VoteTime
 }, MapRotation ? 3 : 0);
}

function RestartGame() {
 Game.RestartGame();
}
function CreateNewTeam(TeamName, TeamDisplayName, TeamColor, TeamSpawnPointGroup, TeamBuildBlocksSet) {
Teams.Add(TeamName, TeamDisplayName, TeamColor);
 let NewTeam = Teams.Get(TeamName);
  NewTeam.Spawns.SpawnPointsGroups.Add(TeamSpawnPointGroup);
  NewTeam.Build.BlocksSet.Value = TeamBuildBlocksSet;
   return NewTeam;
}
function SpawnTeams() {
 for (const t of Teams) {
  Spawns.GetContext(t).Spawn();
    }
}

} catch (e) {
 for (const p of Players.All) { 
   p.PopUp(`${e.name}: ${e.message}: ${e.stack}`);
             }
}
  
 
