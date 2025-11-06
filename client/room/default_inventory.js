import { GameMode, Inventory } from 'pixel_combats/room';

switch (GameMode.Parameters.GetBool('Blue')) {
   case 'PNusto': blueTeam.Inventory.Melee.Value = false; break;
   case 'Melee': blueTeam.Inventory.Melee.Value = true; break;
}
