import { Players, room, Inventory, contextedProperties, LeaderBoard, BuildBlocksSet, Spawns, Teams, Ui, Game, GameMode, TeamsBalancer, Properties, Timers, Damage, BreackGraph, NewGame, NewGameVote } from "pixel_combats/room";
import { DisplayValueHeader, Color } from 'pixel_combats/basic';
import * as game_timer from './default_timer.js';
import * as vote_types from 'pixel_combats/types/new_game_vote';

try {
	
room.PopupsEnable = true;

// * длинна таймера каждого режима: отдальный отсчёт времени в режиме. * //
const WaitingPlayersTime = 11;
const HideAndSeekTime = 31;
const GameModeTime = game_timer.game_mode_length_time(); // * Выбор класса таймера. * //
const WinTeamsTime = 16;
const End0fMatchTime = 11;

const WINNER_SCORES = 30;
const LOOSER_SCORES = 15;
const ui = Ui.GetContext(); const damage = Damage.GetContext(); const properties = Properties.GetContext(); const spawns = Spawns.GetContext(); const timer = Timers.GetContext(); const spawns_player = Spawns.GetContext(p);

// * Имена используемых объектов. * //
const WaitingModeStateValue = `WaitingMode`;
const HideAndSeekStateValue = `HideAndSeek`;
const GameStateValue = `Game`;
const WinTeamsStateValue = `WinTeams`;
const End0fMatchStateValue = `End0fMatch`;

// * обработчики классов: константы переменных таймера и характеристик. * //
const mainTimer = timer.Get(`Main`);
const game_timer = timer.Get('GameTimer');
const scores_timer = timer.Get('Scores');
const stateProp = properties.Get(`State`);

// * Игровые настройки параметров, и заданные настройки в игре. * //
const MapRotation = GameMode.Parameters.GetBool('MapRotation');
damage.FriendlyFire.Value = GameMode.Parameters.GetBool(`FriendlyFire`);
BreackGraph.Damage = GameMode.Parameters.GetBool(`BlocksDamage`);
BreackGraph.WeakBlocks = GameMode.Parameters.GetBool(`LoosenBlocks`);

// * Опции игровых режимов. * //
damage.DamageOut.Value = true;
damage.GranadeTouchExplosion.Value = true;
ui.MainTimerId.Value = mainTimer.Id;
// * Создаем команды, из функции - команд создания.
const blueTeam = CreateNewTeam(`Blue`, `Teams/Blue`, new Color(0, 0, 125/255, 0), 1, BuildBlocksSet.Blue);
const redTeam = CreateNewTeam(`Red`, `Teams/Red`, new Color(125/255, 0, 0, 0), 2, BuildBlocksSet.Red);
// * Интерфейс команд: макс синих и красных в интерфейсе. * //
blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
redTeam.Properties.Get('Deaths').Value = redTeam.Count;
ui.TeamProp1.Value = { Team: 'Red', Prop: 'Deaths' }; 
ui.TeamProp2.Value = { Team: 'Blue', Prop: 'Deaths' };	
// * Лидерборд команд: статистика каждой команды в таблице. * //
LeaderBoard.PlayerLeaderBoardValues = [
  new DisplayValueHeader("Kills", "Statistics/Kills", "Statistics/Kills"),
  new DisplayValueHeader("Deaths", "Statistics/Deaths", "Statistics/Deaths"),
  new DisplayValueHeader("Spawns", "Statistics/Spawns", "Statistics/Spawns"),
  new DisplayValueHeader("Scores", "Statistics/Scores", "Statistics/Scores")];
// * Списки игроков, за наибольшие/наилучшие смерти/киллы у игрока в команде. * //
LeaderBoard.TeamWeightGetter.Set(t => {
 return t.Properties.Get(`Deaths`).Value;});
LeaderBoard.PlayersWeightGetter.Set(p => {
 return p.Properties.Get(`Kills`).Value;
});

// * Быстрый заход в команду. * //
Teams.OnRequestJoinTeam.Add(p => {
 // * Если после старта входят игроки, то выдаём команду красную. * //
 if (stateProp.Value == GameStateValue) redTeam.Add(p);else { // * До старта матча, вход разрешен для синих. * //
 blueTeam.Add(p);
 spawns_player.Spawn();}}); // * Быстрый респаун и вход в синию команду. * //
// * Респавним игрока после входа в команду. * //
Teams.OnPlayerChangeTeam.Add(p => {
 // * Моментальный респаун игроков. * //
 spawns_player.Spawn();
 // * Глобальный отсчёт прибавления смертей в интерфейс: для синих и красных после захода в команду. * //
 blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
 redTeam.Properties.Get('Deaths').Value = redTeam.Count;});
// * За уход с команды, отномаем смерти команды.  * //
Players.OnPlayerDisconnected.Add(p => {
 blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
 redTeam.Properties.Get('Deaths').Value = redTeam.Count;
});

// * Обработчик спавнов: авто-бессмертие после респавна игрока. (Т3) * //
spawns.OnSpawn.Add(p => {
// * Засчёт спавнов игрока после респавна. * //
++p.Properties.Spawns.Value;
// * Бессмертие игрока после респавна. * //
 p.Properties.Immortality.Value = true;
 p.Timers.Get('Immortality').Restart(4);
});
// * Если стёк таймер бессмертия, то отключаем защиту. * //
Timers.OnPlayerTimer.Add(t => {
 if (t.Id != 'Immortality') return t.Player.Properties.Immortality.Value = false;
});
	
// * Обработчик смертей: по правилам (Т3). * //
Damage.OnDeath.Add(p => {
 // * Ограничители игровых режимов. * //
if (stateProp.Value != HideAndSeekStateValue && stateProp.Value != WaitingModeStateValue) return;
 // * Засчитываем смерти игроков. * //
 ++p.Properties.Deaths.Value;
// * После каждой смерти синих, они становятся красными. (Т3) * //
if (stateProp.Value == GameStateValue && p.Team == blueTeam) redTeam.Add(p); return;
 // * Макс синих и красных в смертях. * //
 blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
 redTeam.Properties.Get('Deaths').Value = redTeam.Count;
 // * Моментальный респаун игроков после смерти. * //
 spawns_player.Spawn();
});

// * Обработчик киллов: дальний отсчёт по убийству * //
Damage.OnKill.Add(function (p, k) {
 // * Счётчик засчитывания киллов игрока. * //
 if (p.Id !== k.Id) ++p.Properties.Kills.Value;
  // * Выводим очки игроку: за убийста другово. * //
  p.Properties.Scores.Value += 10;
}); 

// * Таймер обработчика очков, за время в комнате. * //
scores_timer.OnTimer.Add(t => {
 // * Ограничители игровых режимов. * //
 if (stateProp.Value != WaitingModeStateValue && stateProp.Value != WinTeamsStateValue && stateProp.Value != End0fMatchStateValue) return;
 // * Выводим макс игроков в комнате. * //
 Players.All.forEach(p => {
 // * Начисляем очки игроку, за время в команте. * //
	p.Properties.Scores.Value += 5;
});
 // * Запуск отсчёта таймера: 10 сек. * //
  scores_timer.Restart(10);
  // * Интервал таймера очков. * //
 scores_timer.RestartLoop(40);
});
	
 // * Таймер после продолжения игры с игроками в командах. (Т3) * //
game_timer.OnTimer.Add(t => {
 // * Ограничители игровых режимов. * //
if (stateProp.Value != HideAndSeekStateValue && stateProp.Value != WaitingModeStateValue && stateProp.Value != WinTeamsStateValue && stateProp.Value != End0fMatchStateValue) return;
 // * Ищем макс синих и красных в смертях. * //
 blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
 redTeam.Properties.Get('Deaths').Value = redTeam.Count;
  // * Событие у синих: если все синие пойманы, игра завершается в пользу красных. * //
  if (blueTeam.Count < 1 && blueTeam.Count <= 0 && redTeam.Count >= 1) {
   return WinRedTeam();
 }
  // * Событие у красных: если основной таймер истёк, то игра завершается в пользу синих. * //
  if (mainTimer <= 0 || blueTeam.Count >= 1) {
   return WinBlueTeam();	
 }       
 // * Интеврал таймера игры. * //
 game_timer.RestartLoop(11);
});
	
// * Основной таймер, переключения режимов игры. * //
mainTimer.OnTimer.Add(t => {
 switch (stateProp.Value) {
  case WaitingModeStateValue:
if (Players.Count < 2) {
   return SetWaitingMode();
 } else SetHideAndSeek();
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
   break;
       }
});
	
// * Первеночальное, игровое состояние игры. * //
SetWaitingMode();

// * Состояние, игровых режимов игры. * //
function SetWaitingMode(p) {
 stateProp.Value = WaitingModeStateValue;
 if (Players.Count == 1) ui.Hint.Value = "Hint/WaitingPlayersCount2";
 if (Players.Count == 2) ui.Hint.Value = "Hint/WaitingPlayerCount1";
 ui.Hint.Value = "Hint/MatchGame";
	
 Inventory.GetContext().Melee.Value = false;
 Inventory.GetContext().Secondary.Value = false;
 Inventory.GetContext().Main.Value = false;
 Inventory.GetContext().Explosive.Value = false;
 Inventory.GetContext().Build.Value = false;

 mainTimer.Restart(4);
 spawns.enable = true;
}
function SetHideAndSeek() {
 stateProp.Value = HideAndSeekStateValue;
 ui.Hint.Value = "Hint/TeamsRequest";
 blueTeam.Ui.Hint.Value = "Hint/SearchPlaceBlue";
 redTeam.Ui.Hint.Value = "Hint/SearchWhereHidBlue";

 Inventory.GetContext(blueTeam).Melee.Value = false;
 Inventory.GetContext(blueTeam).Secondary.Value = false;
 Inventory.GetContext(blueTeam).Main.Value = false;
 Inventory.GetContext(blueTeam).Explosive.Value = false;
 Inventory.GetContext(blueTeam).Build.Value = false;
 Inventory.GetContext(redTeam).Melee.Value = false;
 Inventory.GetContext(redTeam).Secondary.Value = false;
 Inventory.GetContext(redTeam).Main.Value = false;
 Inventory.GetContext(redTeam).Explosive.Value = false;
 Inventory.GetContext(redTeam).Build.Value = false;
		
 mainTimer.Restart(41);
 spawns.enable = true;
 spawns.Spawn();
}
function SetGameMode() {
 stateProp.Value = GameStateValue;
 blueTeam.Ui.Hint.Value = "Hint/HidensBlueTeam";
 redTeam.Ui.Hint.Value = "Hint/SearchTeamBlue";

 Inventory.GetContext(blueTeam).Melee.Value = false;
 Inventory.GetContext(blueTeam).Secondary.Value = false;
 Inventory.GetContext(blueTeam).Main.Value = false;
 Inventory.GetContext(blueTeam).Explosive.Value = false;
 Inventory.GetContext(blueTeam).Build.Value = false;
 Inventory.GetContext(redTeam).Melee.Value = true;
 Inventory.GetContext(redTeam).Secondary.Value = true;
 Inventory.GetContext(redTeam).Main.Value = false;
 Inventory.GetContext(redTeam).Explosive.Value = false;
 Inventory.GetContext(redTeam).Build.Value = false;
		
 TeamsBalancer.BalanceTeams();
 mainTimer.Restart(GameModeTime);
}
function WinBlueTeam() {
 stateProp.Value = WinTeamsStateValue;
 ui.Hint.Value = "Hint/LoserTeamRed";
 blueTeam.Properties.Scores.Value += WINNER_SCORES;
 redTeam.Properties.Scores.Value += LOOSER_SCORES;	

 Inventory.GetContext().Melee.Value = false;
 Inventory.GetContext().Secondary.Value = false;
 Inventory.GetContext().Main.Value = false;
 Inventory.GetContext().Explosive.Value = false;
 Inventory.GetContext().Build.Value = false;
	
 spawns.Spawn();
 damage.DamageOut.Value = false;
 damage.FriendlyFire.Value = false;
 mainTimer.Restart(11);
}
function WinRedTeam() {
 stateProp.Value = WinTeamsStateValue;
 ui.Hint.Value = "Hint/LoserTeamBlue";
 redTeam.Properties.Scores.Value += WINNER_SCORES;
 blueTeam.Properties.Scores.Value += LOOSER_SCORES;	

 Inventory.GetContext().Melee.Value = false;
 Inventory.GetContext().Secondary.Value = false;
 Inventory.GetContext().Main.Value = false;
 Inventory.GetContext().Explosive.Value = false;
 Inventory.GetContext().Build.Value = false;
	
 spawns.Spawn();
 damage.DamageOut.Value = false;
 damage.FriendlyFire.Value = false;
 mainTimer.Restart(11);
}
function SetEnd0fMatch() {
 stateProp.Value = End0fMatchStateValue;
 ui.Hint.Value = "Hint/EndMatch";
	
 spawns.enable = false;
 spawns.Despawn();

 Game.GameOver(LeaderBoard.GetTeams());
 mainTimer.Restart(11);
}

function OnVoteResult(v) {
if (v.Result === null) return;
 NewGame.RestartGame(v.Result);
}
NewGameVote.OnResult.Add(OnVoteResult);

function START_VOTE() {
 const VARIANTS = [
		new vote_types.SameVariant(),	
		new vote_types.OnlyUniqueVariants(true, false)]; 
	if (MapRotation) variants.push(new vote_types.FromOfficialMapLists(3));
	NewGameVote.Start(VARIANTS, 15);
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
function blueTeamAll(p) {
 for (const p of Players.All) {
	if (p.Team == null || p.Team == redTeam) blueTeam.Add(p);
    }
}
	
} catch (e) {
 for (var p of Players.All) { 
   p.PopUp(`${e.name}: ${e.message}: ${e.stack}`);
             }
	 }
