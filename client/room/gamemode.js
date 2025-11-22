import { Players, room, Inventory, contextedProperties, LeaderBoard, BuildBlocksSet, Spawns, Teams, Ui, Game, GameMode, TeamsBalancer, Properties, Timers, Damage, BreackGraph, NewGame, NewGameVote } from "pixel_combats/room";
import { DisplayValueHeader, Color } from 'pixel_combats/basic';
import * as timer from './default_timer.js';
import * as vote_types from 'pixel_combats/types/new_game_vote';

try {
	
// * Задаём константы, которые будут работать в режиме, для работоспособность игровых режимов. * //
room.PopupsEnable = true;
const WaitingPlayersTime = 11;
const HideAndSeekTime = 31;
const GameModeTime = timer.game_mode_length_time();
const WinTeamsTime = 16;
const End0fMatchTime = 11;
const WINNER_SCORES = 30;
const LOOSER_SCORES = 15;
const WaitingModeStateValue = `WaitingMode`;
const HideAndSeekStateValue = `HideAndSeek`;
const GameStateValue = `Game`;
const WinTeamsStateValue = `WinTeams`;
const End0fMatchStateValue = `End0fMatch`;
const mainTimer = Timers.GetContext().Get(`Main`);
const deadTimer = Timers.GetContext().Get('Timer');
const stateProp = Properties.GetContext().Get(`State`);

// * Игровые настройки параметров, и заданные настройки в игре. * //
const MapRotation = GameMode.Parameters.GetBool('MapRotation');
Damage.GetContext().FriendlyFire.Value = GameMode.Parameters.GetBool(`FriendlyFire`);
BreackGraph.Damage =GameMode.Parameters.GetBool(`BlocksDamage`);
BreackGraph.WeakBlocks = GameMode.Parameters.GetBool(`LoosenBlocks`);
Damage.GetContext().DamageOut.Value = true;
Damage.GetContext().GranadeTouchExplosion.Value = true;
Ui.GetContext().MainTimerId.Value = mainTimer.Id;

// * Создаем команды, из функции - команд создания.
const blueTeam = CreateNewTeam(`Blue`, `Teams/Blue`, new Color(0, 0, 125/255, 0), 1, BuildBlocksSet.Blue);
const redTeam = CreateNewTeam(`Red`, `Teams/Red`, new Color(125/255, 0, 0, 0), 2, BuildBlocksSet.Red);
// * Интерфейс команд. * //
const BLUE_TEXT_UI = '\n<b><size=220><color=#0d177c>ß</color><color=#03088c>l</color><color=#0607b0>ᴜ</color><color=#1621ae>E</color></size></b>';
const RED_TEXT_UI = '\n<b><size=220><color=#962605>尺</color><color=#9a040c>ᴇ</color><color=#8110b>D</color></size></b>';
blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
redTeam.Properties.Get('Deaths').Value = redTeam.Count;
Ui.GetContext().TeamProp1.Value = { Team: 'Red', Prop: 'Deaths' }; 
Ui.GetContext().TeamProp2.Value = { Team: 'Blue', Prop: 'Deaths' };	
// * Р”Р°РЅРЅС‹Рµ Р»РёРґРµСЂР±РѕСЂРґР° РєРѕРјР°РЅРґ, РєРѕС‚РѕСЂС‹Рµ РїСЂРёРіРѕРґСЏС‚СЃСЏ РІ РєР»Р°СЃСЃРёС‡РµСЃРєРѕРј РјР°С‚С‡Рµ. * //
LeaderBoard.PlayerLeaderBoardValues = [
  new DisplayValueHeader("Kills", "Statistics/Kills", "Statistics/Kills"),
  new DisplayValueHeader("Deaths", "Statistics/Deaths", "Statistics/Deaths"),
  new DisplayValueHeader("Spawns", "Statistics/Spawns", "Statistics/Spawns"),
  new DisplayValueHeader("Scores", "Statistics/Scores", "Statistics/Scores")
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
Teams.OnRequestJoinTeam.Add(p => {
 if (stateProp.Value == GameStateValue) redTeam.Add(p);
else {
 blueTeam.Add(p);
  } else Spawns.GetContext(p).Spawn();
 blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
 redTeam.Properties.Get('Deaths').Value = redTeam.Count;
});
// * Сразу после входа в команду, респавним игрока - на спавн. * //
Teams.OnPlayerChangeTeam.Add(function(p, t) {
	p.Spawns.Spawn();
});
Players.OnPlayerDisconnected.Add(function(p) {
blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
redTeam.Properties.Get('Deaths').Value = redTeam.Count;
});

// * Обработчик спавнов: авто-бессмертие после респавна игрока. (Т3) * //
Spawns.GetContext().OnSpawn.Add(p => {
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
	
// * Обработчик смертей. * //
Damage.OnDeath.Add(function(p) {
if (stateProp.Value != HideAndSeekStateValue && stateProp.Value != WaitingModeStateValue) {
 ++p.Properties.Deaths.Value;
if (stateProp.Value == GameStateValue && p.Team == blueTeam) redTeam.Add(p);
}
 blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
 redTeam.Properties.Get('Deaths').Value = redTeam.Count;
 Spawns.GetContext(p).Spawn();
});

// * Обработчик киллов. * //
Damage.OnKill.Add(function(k,p) {
 if (p.id !== k.id) { 
 ++p.Properties.Kills.Value;
  p.Properties.Scores.Value += 50;
   }
}); 

const S = Timers.GetContext().Get('Scores');
S.OnTimer.Add(function () {
 for (const p of Players.All) {
if (p.Team == null) continue;
	p.Properties.Scores.Value += 5;
   }
  S.Restart(10);
});
	
const Timer = Timers.GetContext().Get('Timer');
Timer.OnTimer.Add(function (Time) {
if (stateProp.Value != HideAndSeekStateValue && stateProp.Value != WaitingModeStateValue) {
 blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
 redTeam.Properties.Get('Deaths').Value = redTeam.Count;
if (blueTeam.Count < 1 || blueTeam.Count == 0 && redTeam.Count >= 1) {
 WinRedTeam();
	return;
}
if (stateProp.Value == GameStateValue && mainTimer <= 0 && mainTimer < 0 && mainTimer == 0 && blueTeam.Count >= 1) {
 WinBlueTeam();
	return;
          }       
    } 
});
Timer.RestartLoop(11);
	
// * Основной таймер, переключения режимов игры. * //
mainTimer.OnTimer.Add(function() {
 switch (stateProp.Value) {
  case WaitingModeStateValue:
if (Players.Count < 3) {
if (Players.Count == 1) Ui.GetContext().Hint.Value = "Hint/WaitingPlayersCount2";
if (Players.Count == 2) Ui.GetContext().Hint.Value = "Hint/WaitingPlayerCount1";
Ui.GetContext().Hint.Value = "Hint/MatchGame";	
	SetWaitingMode();
 } else {
	SetHideAndSeek();
}
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
function SetWaitingMode(p) {
 stateProp.Value = WaitingModeStateValue;
 if (Players.Count == 1) Ui.GetContext().Hint.Value = "Hint/WaitingPlayersCount2";
 if (Players.Count == 2) Ui.GetContext().Hint.Value = "Hint/WaitingPlayerCount1";
 Ui.GetContext().Hint.Value = "Hint/MatchGame";
	
 Inventory.GetContext().Melee.Value = false;
 Inventory.GetContext().Secondary.Value = false;
 Inventory.GetContext().Main.Value = false;
 Inventory.GetContext().Explosive.Value = false;
 Inventory.GetContext().Build.Value = false;

 mainTimer.Restart(4);
 TeamsBalancer.IsAutoBalance = false;
 Spawns.GetContext().enable = true;
 blueTeamAll(p);
}
function SetHideAndSeek() {
 stateProp.Value = HideAndSeekStateValue;
 Ui.GetContext().Hint.Value = ContextAllViborTeamsForHint;
 blueTeam.Ui.Hint.Value = "Hint/SearchPlaceBlue";
 redTeam.Ui.Hint.Value = "Hint/SearchWhereHidBlue";
 
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
	
 mainTimer.Restart(41);
 Spawns.GetContext().enable = true;
 Spawns.GetContext().Spawn();
}
function SetGameMode() {
 stateProp.Value = GameStateValue;
 blueTeam.Ui.Hint.Value = "Hint/HidensBlueTeam";
 redTeam.Ui.Hint.Value = "Hint/SearchTeamBlue";

 blueTeam.Inventory.Melee.Value = false;
 blueTeam.Inventory.Secondary.Value = false;
 blueTeam.Inventory.Main.Value = false;
 blueTeam.Inventory.Explosive.Value = false;
 blueTeam.Inventory.Build.Value = false;
 redTeam.Inventory.Melee.Value = true;
 redTeam.Inventory.Secondary.Value = true;
 redTeam.Inventory.Main.Value = false;
 redTeam.Inventory.Explosive.Value = false;
 redTeam.Inventory.Build.Value = false;

 TeamsBalancer.BalanceTeams();
 mainTimer.Restart(GameModeTime);
}
function WinBlueTeam() {
 stateProp.Value = WinTeamsStateValue;
 blueTeam.Ui.Hint.Value = "Hint/LoserTeamRed";
 redTeam.Ui.Hint.Value = "Hint/LoserTeamRed";
 blueTeam.Properties.Get('Scores').Value += WINNER_SCORES;
 redTeam.Properties.Get('Scores').Value += LOOSER_SCORES;	

 const inventory = Inventory.GetContext();
 inventory.Melee.Value = false;
 inventory.Secondary.Value = false;
 inventory.Main.Value = false;
 inventory.Explosive.Value = false;
 inventory.Build.Value = false;

 Spawns.GetContext().Spawn();
 Damage.GetContext().DamageOut.Value = false;
 Damage.GetContext().FriendlyFire.Value = false;
 mainTimer.Restart(11);
}
function WinRedTeam() {
 stateProp.Value = WinTeamsStateValue;
 blueTeam.Ui.Hint.Value = "Hint/LoserTeamBlue";
 redTeam.Ui.Hint.Value = "Hint/LoserTeamBlue";
 redTeam.Properties.Get('Scores').Value += WINNER_SCORES;
 blueTeam.Properties.Get('Scores').Value += LOOSER_SCORES;	

 const inventory = Inventory.GetContext();
 inventory.Melee.Value = false;
 inventory.Secondary.Value = false;
 inventory.Main.Value = false;
 inventory.Explosive.Value = false;
 inventory.Build.Value = false;

 Spawns.GetContext().Spawn();
 Damage.GetContext().DamageOut.Value = false;
 Damage.GetContext().FriendlyFire.Value = false;
 mainTimer.Restart(11);
}
function SetEnd0fMatch() {
 stateProp.Value = End0fMatchStateValue;
 Ui.GetContext().Hint.Value = "Hint/EndMatch";
	
 const spawns = Spawns.GetContext();
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

S.RestartLoop(40);
	
} catch (e) {
 for (var p of Players.All) { 
   p.PopUp(`${e.name}: ${e.message}: ${e.stack}`);
             }
	 }
