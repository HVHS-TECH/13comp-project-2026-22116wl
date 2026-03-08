// This script handles communication between FB and the p5 play script (using window events - non .mjs files can't import functions and p5 play only runs in .js files)

console.log('firebase runing');

import { fb_write, fb_read, fb_valChanged } from '../../fb.mjs'

console.log(await fb_read("/Leaderboards/game_that_works"));

async function joinLobby(event) {
    const HOST_UID = event.detail.LobbyUID;
    const PLAYER_UID = event.detail.PlayerUID;


    //when the two match it means a new lobby is being created
    if (HOST_UID == PLAYER_UID) {
        fb_write("/Lobbies/guess_the_number/" + PLAYER_UID, {
            mysteryNumber: 0,
            players: {
                player1: {
                    UID: PLAYER_UID,
                    displayName: await fb_read("Users/" + PLAYER_UID + "/displayName"),
                    guess: 0
                },

                player2: {
                    UID: "",
                    displayName: "",
                    guess: 0
                }
            }
        });
    } else {
        fb_write("/Lobbies/guess_the_number/" + HOST_UID + "/players/player2", {
            UID: PLAYER_UID,
            displayName: await fb_read("Users/" + PLAYER_UID + "/displayName"),
            guess: 0
        });
    }

    
    fb_valChanged('/Lobbies/guess_the_number/' + HOST_UID, function(_lobby) {
        window.dispatchEvent(new CustomEvent('lobbyChanged', {
            detail: {
                lobby: _lobby,
                lobbyUID: HOST_UID
            }
        }));
    }, "xyz");
}

async function leaveLobby(event) {
    const LOBBY_UID = event.detail.lobbyUID;
    const PLAYER_UID = event.detail.playerUID;

    var lobby = await fb_read("/Lobbies/guess_the_number/" + LOBBY_UID);

    // If host is leaving, delete lobby
    if (LOBBY_UID == PLAYER_UID) {
        fb_write("/Lobbies/guess_the_number/" + LOBBY_UID, null);
        return;
    }

    for (let playeri in lobby.players) {
        if (lobby.players[playeri].UID == PLAYER_UID) {

            fb_write("/Lobbies/guess_the_number/" + LOBBY_UID + "/players/" + playeri, {
                UID: "",
                displayName: "",
                guess: 0
            });
        }
    }
}

fb_valChanged('/Lobbies/guess_the_number', function(_lobbies) {
    window.dispatchEvent(new CustomEvent('lobbyAdded', {
        detail: {
            lobbies: _lobbies
        }
    }));
}, "mysteryNumber");

window.addEventListener('joinLobby', joinLobby);
window.addEventListener('leaveLobby', leaveLobby);