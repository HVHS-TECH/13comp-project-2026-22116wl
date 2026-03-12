
import { fb_authenticate, fb_readSorted, fb_read, fb_write, fb_valChanged } from "./fb.mjs";
window.fb_authenticate = fb_authenticate;

// define some global varuables
var currentGame;


// read the database and draw the leaderboard
async function drawLeaderboard() {
    var leaderboard = await fb_readSorted("Leaderboards/" + currentGame, "highScore");

    document.getElementById("Leaderboard").querySelector('ol').innerHTML = "";

    for (let entry in leaderboard) {
        const KEY = Object.keys(leaderboard[entry])[0];
        const VALUE = Object.entries(leaderboard[entry])[0][1];

        var newLeaderboardEntry = document.createElement("li");
        newLeaderboardEntry.className = "leaderboardEntry";
        
        var scoreNumber = document.createElement("span");
        scoreNumber.className = "leaderboardScoreNumber";
        scoreNumber.innerHTML = VALUE.highScore;

        var userName = document.createElement("span");
        userName.className = "leaderboardUsername";
        userName.innerHTML = VALUE.displayName;

        newLeaderboardEntry.appendChild(scoreNumber);
        newLeaderboardEntry.appendChild(userName);

        if (KEY == sessionStorage.getItem('UID')) {
            //is user       
            userName.style.color = "#ba8800";
            scoreNumber.style.color = "#ba8800";
        } else {
            userName.style.color = "#000000";
            scoreNumber.style.color = "#000000";
        }


        document.getElementById("Leaderboard").querySelector('ol').appendChild(newLeaderboardEntry);
    }
}


async function createLeaderboardEntry(game, player) {
    var data = {
        highScore: 0,
        displayName: await fb_read("Users/" + player + "/displayName")
    }

    //hard coded other values for specific games set here
    if (game == "guess_the_number") {
        data.Losses = 0;
        data.Wins = 0;
    }

    await fb_write('Leaderboards/' + game + "/" + player, data);

    return data;
}

async function updateLeaderboardScore(event) {
    var leaderboardData = await fb_read('Leaderboards/' + currentGame + "/" + sessionStorage.getItem("UID"));

    if (leaderboardData == null) {
        // Create leaderboard entry for the player
        leaderboardData = await createLeaderboardEntry(currentGame, sessionStorage.getItem("UID"));
    }


    // Update the scores
    if (currentGame == "guess_the_number") {
        var wins = leaderboardData['wins'];
        var losses = leaderboardData['losses'];

        if (event.detail.wins == 1) {
            console.log('you won');
            wins += 1;
            fb_write("Leaderboards/" + currentGame + "/" + sessionStorage.getItem("UID") + "/wins", wins);
        } else if (event.detail.losses == 1) {
            losses += 1;
            console.log('you lost');
            fb_write("Leaderboards/" + currentGame + "/" + sessionStorage.getItem("UID") + "/losses", losses);
        }

        let ratio = wins/(wins+losses);
        
        fb_write("Leaderboards/" + currentGame + "/" + sessionStorage.getItem("UID") + "/highScore", ratio);

    } else {
        const OLD_VAL = leaderboardData['highScore'];
        const NEW_VAL = event.detail.highScore;
        //if we are updating the high score value, then chedck whether it is over the old one. If not then don't update it
        if (NEW_VAL > OLD_VAL) {
            fb_write("Leaderboards/" + currentGame + "/" + sessionStorage.getItem("UID") + "/highScore", NEW_VAL);
        }
    }
}



async function setUpGame() {
    //import game metadata, such as game name in text 
    const META_DATA = await import(`./Games/${currentGame}/gameMetaData.mjs`);
    
    // use game metadata to set background colour (of window)
    if (META_DATA.bg == 1) {
        document.getElementById('gameSpace').style.backgroundColor = "black";
    } else {
        document.getElementById('gameSpace').style.backgroundColor = "white";
    }
    
    document.querySelector("h1").innerHTML = META_DATA.gameName;


    // Detect element added, if element is p5 canvas then put it in the right div
    const OBSERVER = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            for (const element of mutation.addedNodes) {
                //if element is the p5 play canvas
                if (element.className == "p5-maxed") {
                    document.getElementById('gameSpace').appendChild(element);
                    
                    //disconnect function after canvas added
                    OBSERVER.disconnect();
                }
            }
        }
    });
    
    OBSERVER.observe(document.body, {childList: true, subtree: true});
}



// functions to run when the page loads
async function pageLoad() {
    currentGame = sessionStorage.getItem('game');
    
    setUpGame();
    
    //when game finishes fire this event to update the score on the leaderboard
    window.addEventListener('scoreChanged', updateLeaderboardScore);

    //Detect changes in the leaderboard for the current game, and then redraw the leaderboard
    await fb_valChanged("/Leaderboards/" + currentGame, drawLeaderboard, 'highScore');
};

pageLoad();