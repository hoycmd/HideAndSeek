import { Players, room, Inventory, LeaderBoard, BuildBlocksSet, Spawns, Teams, Ui, Game, GameMode, TeamsBalancer, Properties, Timers, Damage, BreackGraph, NewGame, NewGameVote } from "pixel_combats/room";
import { DisplayValueHeader, Color } from 'pixel_combats/basic';
import * as d from './gamemodeParameters.js';

try {
	
// * Задаём константы, которые будут работать в режиме, для работоспособность игровых режимов. * //
room.PopupsEnable = true;
const WaitingPlayersTime = 11;
const HideAndSeekTime = 31;
const GameModeTime = d.GameModeMatchTime();
const WinTeamsTime = 16;
const End0fMatchTime = 11;
const WINNER_SCORES = 30;
const LOOSER_SCORES = 15;
const WaitingModeStateValue = `WaitingMode`;
const HideAndSeekStateValue = `HideAndSeek`;
const GameStateValue = `Game`;
const WinTeamsStateValue = `WinTeams`;
const End0fMatchStateValue = `End0fMatch`;
const WaitingAllPlayersForHint = `Нужно кол-во игроков: ${(3 - Players.Count)}`;
const ContextAllViborTeamsForHint = `Выберите, команду!`;
const BlueIschetMestoHidengiliBegForHint = `Ищите место где спрятатся, или убегайте!`;
const RedSleditGdeBlueHidengIliBegaetForHint = `Следите где спрячутся выжившие, или где убегают!`;
const BlueHidendIliYrunsForHint = `Прячьтесь в укромном месте, или убегайте от надзирателей!`;
const RedIschetBluePlayersForHint = `Найдите, всех выживших!`;
const BlueWinnerTeamLoosersRedForHint = `Выжившие смогли продержатся, с надзирателями!`;
const RedWinnerTeamLoosersBlueForHint = `Надзиратели, нашли всех выживших!`;
const EndingeMatchForHint = `Конец, матча!`;
const mainTimer = Timers.GetContext().Get(`Main`);
const deadTimer = Timers.GetContext().Get('Timer');
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
const blueTeam = CreateNewTeam(`Blue`, `\nВЫЖИВШИЕ`, new Color(0, 0, 125/255, 0), 1, BuildBlocksSet.Blue);
const redTeam = CreateNewTeam(`Red`, `\nНАДЗИРАТЕЛИ`, new Color(125/255, 0, 0, 0), 2, BuildBlocksSet.Red);
redTeam.contextedProperties.SkinType.Value = 0;
blueTeam.contextedProperties.SkinType.Value = 3;
redTeam.contextedProperties.StartBlocksCount.Value = 51;
// * Интерфейс команд. * //
const BLUE_TEXT_UI = '\n<b><size=220><color=#0d177c>ß</color><color=#03088c>l</color><color=#0607b0>ᴜ</color><color=#1621ae>E</color></size></b>';
const RED_TEXT_UI = '\n<b><size=220><color=#962605>尺</color><color=#9a040c>ᴇ</color><color=#b8110b>D</color></size></b>';
Ui.GetContext().TeamProp1.Value = { Team: 'Red', Prop: 'red_text_ui' }; 
Ui.GetContext().TeamProp2.Value = { Team: 'Blue', Prop: 'blue_text_ui' };
redTeam.Properties.Get('red_text_ui').Value = redTeam.Count;
blueTeam.Properties.Get('blue_text_ui').Value = blueTeam.Count;
  
// * Вносим в лидерборд значения, которые необходимо вводить в таблицу. * //
LeaderBoard.PlayerLeaderBoardValues = [
  new DisplayValueHeader('Kills', '<b><size=30><color=#be5f1b>K</color><color=#b65219>i</color><color=#ae4517>l</color><color=#a63815>l</color><color=#9e2b13>s</color></size></b>', '<b><size=30><color=#be5f1b>K</color><color=#b65219>i</color><color=#ae4517>l</color><color=#a63815>l</color><color=#9e2b13>s</color></size></b>'),
  new DisplayValueHeader('Deaths', '<b><size=30><color=#be5f1b>D</color><color=#b85519>e</color><color=#b24b17>a</color><color=#ac4115>t</color><color=#a63713>h</color><color=#a02d11>s</color></size></b>', '<b><size=30><color=#be5f1b>D</color><color=#b85519>e</color><color=#b24b17>a</color><color=#ac4115>t</color><color=#a63713>h</color><color=#a02d11>s</color></size></b>'),
  new DisplayValueHeader('Spawns', '<b><size=30><color=#be5f1b>S</color><color=#b85519>p</color><color=#b24b17>a</color><color=#ac4115>w</color><color=#a63713>n</color><color=#a02d11>s</color></size></b>', '<b><size=30><color=#be5f1b>S</color><color=#b85519>p</color><color=#b24b17>a</color><color=#ac4115>w</color><color=#a63713>n</color><color=#a02d11>s</color></size></b>'),
  new DisplayValueHeader('Scores', '<b><size=30><color=#be5f1b>S</color><color=#b85519>c</color><color=#b24b17>o</color><color=#ac4115>r</color><color=#a63713>e</color><color=#a02d11>s</color></size></b>', '<b><size=30><color=#be5f1b>S</color><color=#b85519>c</color><color=#b24b17>o</color><color=#ac4115>r</color><color=#a63713>e</color><color=#a02d11>s</color></size></b>'),
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
Teams.OnRequestJoinTeam.Add(function(p, t) { 
  if (stateProp.Value == GameStateValue) redTeam.Add(p);
  ++redTeam.Count;
   else {
	blueTeam.Add(p);
	++blueTeam.Count;
	p.Spawns.Spawn();
   }
});  
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
if (stateProp.Value != HideAndSeekStateValue && stateProp.Value != WaitingModeStateValue) {
 ++p.Properties.Deaths.Value;
  if (p.Team == blueTeam) redTeam.Add(p);
  ++redTeam.Count;
  if (stateProp.Value == GameStateValue && p.Team == blueTeam) redTeam.Add(p);
	blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
}
  p.Spawns.RespawnTime.Value = 3;
});

// * Обработчик киллов. * //
Damage.OnKill.Add(function(k,p) {
 if (p.id !== k.id) { 
 ++p.Properties.Kills.Value;
  p.Properties.Scores.Value += 50;
   }
}); 

deadTimer.OnTimer.Add(function () {
if (stateProp.Value != HideAndSeekStateValue && stateProp.Value != WaitingModeStateValue) {
 blueTeam.Properties.Get('Deaths').Value = blueTeam.Count;
   if (blueTeam.Count < 1 || blueTeam.Count == 0) {
	 WinRedTeam();
	          }
    } 
});
deadTimer.RestartLoop(2);
	
// * Основной таймер, переключения режимов игры. * //
mainTimer.OnTimer.Add(function() {
 switch (stateProp.Value) {
  case WaitingModeStateValue:
//if (Players.Count < 2) {
	//SetWaitingMode();
    Ui.GetContext().Hint.Value = WaitingAllPlayersForHint
 //} else {
	SetHideAndSeek();
//}
   break;
  case HideAndSeekStateValue:
   SetGameMode();
   break;
  case GameStateValue:
   WinBlueTeam();
   break;
  case WinTeamsStateValue:
   SetEnd0fMatch(p);
   break;
 case End0fMatchStateValue:    
   RestartGame();
   break;
       }
});
	
// * Первеночальное, игровое состояние игры. * //
SetWaitingMode();

// * Состояние, игровых режимов игры. * //
function SetWaitingMode(p) {
 stateProp.Value = WaitingModeStateValue;
 Spawns.GetContext().Enable = true;

 Inventory.GetContext().Melee.Value = false;
 Inventory.GetContext().Secondary.Value = false;
 Inventory.GetContext().Main.Value = false;
 Inventory.GetContext().Explosive.Value = false;
 Inventory.GetContext().Build.Value = false;

 mainTimer.Restart(WaitingPlayersTime);
 TeamsBalancer.IsAutoBalance = false;
 blueTeamAll(p);
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
	
 mainTimer.Restart(41);
 Spawns.GetContext().Enable = true;
 Spawns.GetContext().Spawn();
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
 redTeam.Inventory.Build.Value = false;

 TeamsBalancer.BalanceTeams();
 mainTimer.Restart(GameModeTime);
}
function WinBlueTeam() {
 stateProp.Value = WinTeamsStateValue;
 redTeam.Ui.Hint.Value = BlueWinnerTeamLoosersRedForHint;
 blueTeam.Ui.Hint.Value = BlueWinnerTeamLoosersRedForHint;
	
 Spawns.GetContext(blueTeam).Spawn();
 Spawns.GetContext(redTeam).Spawn();

 const inv = Inventory.GetContext();
inv.Melee.Value = false;
inv.Secondary.Value = false;
inv.Main.Value = false;
inv.Explosive.Value = false;
inv.Build.Value = false;

 mainTimer.Restart(11);
}
function WinRedTeam() {
 stateProp.Value = WinTeamsStateValue;
 redTeam.Ui.Hint.Value = RedWinnerTeamLoosersBlueForHint;  
 blueTeam.Ui.Hint.Value = RedWinnerTeamLoosersBlueForHint;
 redTeam.Properties.Get('Scores').Value += WINNER_SCORES;
 blueTeam.Properties.Get('Scores').Value += LOOSER_SCORES;
	
 Spawns.GetContext(blueTeam).Spawn();
 Spawns.GetContext(redTeam).Spawn();

 const inv = Inventory.GetContext();
inv.Melee.Value = false;
inv.Secondary.Value = false;
inv.Main.Value = false;
inv.Explosive.Value = false;
inv.Build.Value = false;

 mainTimer.Restart(11);
}
function SetEnd0fMatch(p) {
 stateProp.Value = End0fMatchStateValue;
 redTeam.Ui.Hint.Value = EndingeMatchForHint;
 blueTeam.Ui.Hint.Value = EndingeMatchForHint;
	
 Spawns.GetContext().Despawn();
 Spawns.GetContext().Enable = false;

 Game.GameOver(LeaberBoard.GetTeams());
 mainTimer.Restart(6);
 blueTeamAll(p);
}

function OnVoteResult(v) {
if (v.Result === null) return;
 NewGame.RestartGame(v.Result);
}
NewGameVote.OnResult.Add(OnVoteResult);

function START_VOTE() {
 NewGameVote.Start({
  Variants: [{ MapId: 0 }],
  Timer: 15
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
function blueTeamAll(p) {
 for (const p of Players.All) {
	if (p.Team == null || p.Team == redTeam) blueTeam.Add(p);
    }
}
	
} catch (e) {
 for (const p of Players.All) { 
   p.PopUp(`${e.name}: ${e.message}: ${e.stack}`);
             }
	 }
