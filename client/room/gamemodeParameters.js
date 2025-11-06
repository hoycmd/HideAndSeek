
import { GameMode } from 'pixel_combats/room';

// * Константы имён, объектов. * //
const length = GameMode.Parameters.GetString('GameLength');
const Blue = GameMode.Parameters.GetString('BlueEvent');

// * Длинна, матча. * //
export function GameModeMatchTime() {
    switch (length) {
        case 'Min10MatchTime': return 601;
        case 'Min7MatchTime': return 421;
        case 'Min5MatchTime': return 301;
    }   
    return 421;
}

let SelectedDefaultInventoryBlue;
export function InventoryBlueEvent() {
 switch (Blue) {
     case 'PNusto': SelectedDefaultInventoryBlue = false; break;
     case 'Melee': SelectedDefaultInventoryBlue = true; break;
}
export const DefultInventory = SelectedDefaultInventoryBlue;
