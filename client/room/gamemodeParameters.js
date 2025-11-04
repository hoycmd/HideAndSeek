import { GameMode, Inventory } from 'pixel_combats/room';

export const Blue = GameMode.Parameters.GetBool('BlueTeamInventory');
export const Inventory = Inventory.GetContext();

  if (stateProp.Value == GameModeStateValue) {
  switch (Blue) {
    case 'Melee': blueTeam.inventory.Melee.Value = true; break;
    case 'PNusto': blueTeam.inventory.Melee.Value = false; break;
     }
  }
