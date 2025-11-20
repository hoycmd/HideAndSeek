

export function SetInventoryBlue() {
 switch (GameMode.Parameters.GetString('Blue')) {
     case 'PNusto': blueTeam.Inventory.Melee.Value = false; break;
     case 'Melee': blueTeam.Inventory.Melee.Value = true; break;
   }
}
