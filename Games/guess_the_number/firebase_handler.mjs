// This script handles communication between FB and the p5 play script (using window events - non .mjs files can't import functions and p5 play only runs in .js files)
import { fb_write, fb_read, fb_valChanged } from '../../fb.mjs'


async function joinLobby(event) {
    const HOST_UID = event.detail.LobbyUID;
    const PLAYER_UID = event.detail.PlayerUID;
    
    if (HOST_UID == PLAYER_UID) {
        //when the two match it means a new lobby is being created

        await fb_write("/Lobbies/guess_the_number/" + PLAYER_UID, {
            mysteryNumber: 0,
            status: "waiting",
            guess_range: {
                max: 100,
                min: 0
            },

            players: {
                player1: {
                    UID: PLAYER_UID,
                    displayName: await fb_read("Users/" + PLAYER_UID + "/displayName"),
                    pfp: await fb_read("Users/" + PLAYER_UID + "/pfp"),
                    guess: 0
                },

                player2: {
                    UID: "",
                    displayName: "",
                    pfp: "",
                    guess: 0
                }
            }
        });
    } else if (await fb_read("/Lobbies/guess_the_number/" + HOST_UID + '/players/player2/UID') == "") {
        //Join as player two

        var userData = await fb_read("Users/" + PLAYER_UID);

        await fb_write("/Lobbies/guess_the_number/" + HOST_UID + "/players/player2", {
            UID: PLAYER_UID,
            displayName: userData.displayName,
            pfp: userData.pfp,
            guess: 0
        });

        await fb_write("/Lobbies/guess_the_number/" + HOST_UID + "/status", "notStarted");
    } else {
        //Player is to spectate the game
    }

    console.log('assinging');
    
    fb_valChanged('/Lobbies/guess_the_number/' + HOST_UID, (_lobby) => {
        window.dispatchEvent(new CustomEvent('lobbyChanged', {
            detail: {
                lobby: _lobby,
                lobbyID: HOST_UID
            }
        }));
    });

    fb_valChanged('/Lobbies/guess_the_number/' + HOST_UID + '/status/', (_scene) => {
        window.dispatchEvent(new CustomEvent('lobbySceneChanged', {
            detail: {
                scene: _scene,
                lobbyID: HOST_UID
            }
        }));
    });
}



async function resetLobby(event) {
    const LOBBY_ID = event.detail.LobbyID;

    fb_write("/Lobbies/guess_the_number/" + LOBBY_ID + "/status", 'notStarted');
    fb_write("/Lobbies/guess_the_number/" + LOBBY_ID + "/mysteryNumber", 0);
    fb_write("/Lobbies/guess_the_number/" + LOBBY_ID + "/guess_range", {
        max: 100,
        min: 0,
    });
}


async function leaveLobby(event) {
    const LOBBY_ID = event.detail.lobbyID;
    const PLAYER_UID = event.detail.playerUID;

    
    
    // If host is leaving, delete lobby
    if (LOBBY_ID == PLAYER_UID) {
        console.log('host left lobby');
        fb_write("/Lobbies/guess_the_number/" + LOBBY_ID, null);
        return;
    }
    
    setTimeout(async ()=>{
        // If host and player leave at the same time then it's possible the second player's request comes in second and it creates a 'half lobby' with nothing except player 2 data
        let lobby = await fb_read("/Lobbies/guess_the_number/" + LOBBY_ID);
        if (lobby == null) {
            return;
        }
    
        for (let playeri in lobby.players) {
            if (lobby.players[playeri].UID == PLAYER_UID) {
                fb_write("/Lobbies/guess_the_number/" + LOBBY_ID + "/status", 'waiting');
                fb_write("/Lobbies/guess_the_number/" + LOBBY_ID + "/players/" + playeri, {
                    UID: "",
                    displayName: "",
                    pfp: "",
                    guess: 0
                });
            }
        }
    }, 600);
}

async function win(lobbyId, winner, winnerUID) {
    fb_write("/Lobbies/guess_the_number/" + lobbyId + "/status", winner + "Won");

    if (winnerUID == sessionStorage.getItem("UID")) {
        // I won
        window.dispatchEvent(new CustomEvent('scoreChanged', {
            detail: { 
                lobbyID: lobbyId,
                maxNum: max_guess,
                minNum: min_guess,
            }
        }));

    } else {
        // I did not win


    }
}

async function submitGuess(event) {
    const LOBBY = event.detail.lobbyData;
    const LOBBY_ID = event.detail.lobbyId;
    const GUESS = event.detail.guess;


    var player;
    // find player who submitted the guess
    for (let playeri in LOBBY.players) {
        if (LOBBY.players[playeri].UID == event.detail.playerID) {
            player = playeri;
        }
    }

    
    if (GUESS == LOBBY.mysteryNumber) {
        win(LOBBY_ID, player, LOBBY.players[player].UID);
        return;
    }

    fb_write('/Lobbies/guess_the_number/' + LOBBY_ID + "/players/" + player + "/guess", GUESS);


    //update guess_range
    if (GUESS > LOBBY["guess_range"].min && GUESS < LOBBY.mysteryNumber) {
        fb_write('/Lobbies/guess_the_number/' + LOBBY_ID + "/guess_range/min", GUESS);
    }

    if (GUESS < LOBBY["guess_range"].max && GUESS > LOBBY.mysteryNumber) {
        fb_write('/Lobbies/guess_the_number/' + LOBBY_ID + "/guess_range/max", GUESS);
    }

    var inversePlayer = Number(player.replace("player", "")); //Extract the number from 'player1' or 'player2' and convert to int
    inversePlayer = Math.abs(inversePlayer-3); //Flip the number: 1>2 and 2>1

    console.log('inversing player');
    fb_write('/Lobbies/guess_the_number/' + LOBBY_ID + "/status/", "player" + String(inversePlayer) + "Turn" );
}

async function startGame(event) {
    let max = event.detail.maxNum;
    let min = event.detail.minNum;

    console.log('game start');
    fb_write("Lobbies/guess_the_number/" + event.detail.lobbyID + "/status/", "player1Turn");

    //Generate THE mystery number
    fb_write("Lobbies/guess_the_number/" + event.detail.lobbyID + "/mysteryNumber/", Math.floor(Math.random() * (max - min + 1)) + min);
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
window.addEventListener('makeGuess', submitGuess);
window.addEventListener('startGame', startGame);
window.addEventListener('resetLobby', resetLobby);
window.addEventListener('win', win);