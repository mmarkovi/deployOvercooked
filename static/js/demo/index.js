import $ from "jquery"
import _ from "lodash"

import OvercookedSinglePlayerTask from "./js/overcooked-single";
import getOvercookedPolicy from "./js/load_tf_model.js";

import * as Overcooked from "overcooked"
let OvercookedMDP = Overcooked.OvercookedMDP;
let Direction = OvercookedMDP.Direction;
let Action = OvercookedMDP.Action;
let [NORTH, SOUTH, EAST, WEST] = Direction.CARDINAL;
let [STAY, INTERACT] = [Direction.STAY, Action.INTERACT];

// Parameters
let PARAMS = {
    MAIN_TRIAL_TIME: 15, //seconds
    TIMESTEP_LENGTH: 150, //milliseconds
    DELIVERY_POINTS: 20,
    PLAYER_INDEX: 1,  // Either 0 or 1
    MODEL_TYPE: 'ppo_bc'  // Either ppo_bc, ppo_sp, or pbt
};

/***********************************
      Main trial order
************************************/


let layouts = {
    "room_1": [
        "XXXPXXX", 
        "X     X", 
        "O  1  D",
        "X     X",
        "XXXSXXX"],

    "room_2": [
        "XXXXPXX", 
        "X     D", 
        "X  1  X",
        "T     X",
        "XSXXXXX"],

    "room_3": [
        "XXXXXXX", 
        "D     X", 
        "X  1  S",
        "P     X",
        "XXOTXXX"],

    "room_4": [
        "XXOXXOX", 
        "X     X", 
        "S  1  X",
        "X     X",
        "XPXXXDX"],

    "room_5": [
        "XXXXPSX", 
        "O     X", 
        "X  1  X",
        "X     X",
        "XXXTXDX"],

    "room_6": [
        "XXXDXXX", 
        "X     X", 
        "X  1  X",
        "T     S",
        "XXPXOXX"],

    "room_7": [
        "XXXXXXX", 
        "P     T", 
        "D  1  D",
        "X     O",
        "XXXSXXX"],

    "room_8": [
        "XTXPXXX", 
        "O     X", 
        "O  1  D",
        "X     S",
        "XXXPXXX"],

    "room_9": [
        "XXXXXXX", 
        "X     X", 
        "X  1  X",
        "X     X",
        "XPDSTOX"],

    "room_10": [
        "XPXXXDX", 
        "X     S", 
        "X  1  X",
        "X     T",
        "XTXSXXX"]

    // "room_1": [
    //     "XXXPXXX", 
    //     "O     O", 
    //     "X1    X",
    //     "X     T",
    //     "XDXXXSX"],

    // "room_2": [
    //         "XXXXPXX", 
    //         "O     T", 
    //         "X1    X",
    //         "X     X",
    //         "XXXDXSX"],

    // "room_3": [
    //         "XXXXXPX",
    //         "X  1  P",
    //         "D XXX X",
    //         "O     X",
    //         "XTSXXXX"],

    // "room_4": [
    //         "XXPPXXX",
    //         "X     X",
    //         "D XXX S",
    //         "X    1X",
    //         "XXOTXXX"],

    // "room_5": [
    //         "XXXPXXX", 
    //         "T     T", 
    //         "X1    X",
    //         "X     X",
    //         "XDXOXSX"],

    // "room_6": [
    //         "XXXXXSX", 
    //         "T1 P  D", 
    //         "O  X  X",
    //         "X     X",
    //         "XXXXXXX"],

    // "room_7": [
    //         "XTXXXPX", 
    //         "O  X  D", 
    //         "X1 X  S",
    //         "X     X",
    //         "XXXXXXX"],

    // "room_8": [
    //         "XSXXXXX", 
    //         "X1    X", 
    //         "X  X  X",
    //         "D  P  O",
    //         "XXXXTXX"],

    // "room_9": [
    //         "XXXXXXX", 
    //         "T     X", 
    //         "O1X   X",
    //         "XX    S",
    //         "XXPXDXX"],

    // "room_10": [
    //         "XXXXXXX", 
    //         "X  T  X", 
    //         "XD 1 PX",
    //         "X  O  X",
    //         "XSXXXXX"]
};

let game;

function startGame(endOfGameCallback) {
    let AGENT_INDEX = 1 - PARAMS.PLAYER_INDEX;
    /***********************************
          Set up websockets server
    ***********************************/
    // let HOST = "https://lit-mesa-15330.herokuapp.com/".replace(/^http/, "ws");
    // let gameserverio = new GameServerIO({HOST});

    let players = [$("#playerZero").val(), $("#playerOne").val()];
    let deterministic = $("#deterministic").is(':checked');
    let saveTrajectory = $("#saveTrajectories").is(':checked');
    if (players[0] == 'human' && players[1] == 'human')
    {

        $("#overcooked").html("<h3>Sorry, we can't support humans as both players.  Please make a different dropdown selection and hit Enter</h3>"); 
        endOfGameCallback();
        return;
    } 
    let layout_name = $("#layout").val();
    let game_time = $("#gameTime").val();
    if (game_time > 1800) {
        $("#overcooked").html("<h3>Sorry, please choose a shorter amount of time for the game!</h3>"); 
        endOfGameCallback();
        return;
    }

    let layout = layouts[layout_name];


    $("#overcooked").empty();
    getOvercookedPolicy(players[0], layout_name, 0, deterministic).then(function(npc_policy_zero) {
        getOvercookedPolicy(players[1], layout_name, 1, deterministic).then(function(npc_policy_one) {
            let player_index = null; 
            let npc_policies = {0: npc_policy_zero, 1: npc_policy_one}; 
            if (npc_policies[0] == null) {
                player_index = 0; 
                npc_policies = {1: npc_policy_one}; 
            }
            if (npc_policies[1] == null) {
                player_index = 1; 
                npc_policies = {0: npc_policy_zero}; 
            }
            let mdp_params = {
                "layout_name": layout_name, 
                "num_items_for_soup": 3, 
                "rew_shaping_params": null, 
            }
            game = new OvercookedSinglePlayerTask({
                container_id: "overcooked",
                player_index: player_index,
                start_grid : layout,
                npc_policies: npc_policies,
                mdp_params: mdp_params,
                task_params: PARAMS,
                save_trajectory: saveTrajectory,
                TIMESTEP : PARAMS.TIMESTEP_LENGTH,
                MAX_TIME : game_time, //seconds
                init_orders: null,
                completion_callback: () => {
                    console.log("Time up");
                    endOfGameCallback();
                },
                DELIVERY_REWARD: PARAMS.DELIVERY_POINTS
            });
            game.init();
            
        });
    });
}

function endGame() {
    game.close();
}

// Handler to be added to $(document) on keydown when a game is not in
// progress, that will then start the game when Enter is pressed.
function startGameOnEnter(e) {
    // Do nothing for keys other than Enter
    if (e.which !== 13) {
	return;
    }

    disableEnter();
    // Reenable enter handler when the game ends
    startGame(enableEnter);
}

function enableEnter() {
    $(document).keydown(startGameOnEnter);
    $("#control").html("<p>Press enter to begin!</p><p>(make sure you've deselected all input elements first!)</p>");
}

function disableEnter() {
    $(document).off("keydown");
    $("#control").html('<button id="reset" type="button" class="btn btn-primary">Reset</button>');
    $("#reset").click(endGame);
}

$(document).ready(() => {
    enableEnter();
});
