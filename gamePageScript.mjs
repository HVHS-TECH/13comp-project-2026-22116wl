
import { fb_authenticate, fb_readSorted, fb_read, fb_write, fb_valChanged } from "./fb.mjs";
window.fb_authenticate = fb_authenticate;

// define some global varuables
let currentGame;




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




// functions to run when the page loads
async function pageLoad() {
    currentGame = sessionStorage.getItem('game');
    
    //import game metadata, such as game name in text 
    const META_DATA = await import(`./Games/${currentGame}/gameMetaData.mjs`);
    
    // use game metadata to set background colour (of window)
    if (META_DATA.bg == 1) {
        document.getElementById('gameSpace').style.backgroundColor = "black";
    } else {
        document.getElementById('gameSpace').style.backgroundColor = "white";
    }
    
    document.querySelector("h1").innerHTML = META_DATA.gameName;
    
    
    // Detect element added, if element is p5 canvas then add it to the div
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
    

   


    //when game finishes fire this event in order to update the score
    window.addEventListener('scoreChanged', async function(event) {
        //valueType is the key of the value passed in, such as "highScore", "Losses" or "Wins"
        var leaderboardData = await fb_read('Leaderboards/' + currentGame + "/" + sessionStorage.getItem("UID"));

        // Create leaderboard entry for the player
        if (leaderboardData == null) {
            var data = {
                highScore: event.detail.highScore,
                displayName: await fb_read("Users/" + sessionStorage.getItem('UID') + "/displayName")
            }

            //hard coded other values for specific games set here
            if (currentGame == "guess_the_number") {
                data.losses = 0;
                data.wins = 0;
            }

            await fb_write('Leaderboards/' + currentGame + "/" + sessionStorage.getItem("UID"), data);
        }

        for (let valueType in event.detail) {

            if (valueType == "highScore") {
                const oldVal = leaderboardData[valueType];

                //if we are updating the high score value, then chedck whether it is over the old one. If not then don't update it
                if (event.detail.valueType < oldVal) {
                    continue;
                }
            }

            console.log('writing');
            await fb_write("Leaderboards/" + currentGame + "/" + sessionStorage.getItem("UID") + "/" + valueType, event.detail[valueType]);
        }
    });
    

    //Detect changes in the leaderboard for the current game, and then redraw the leaderboard
    await fb_valChanged("/Leaderboards/" + currentGame, function(change) {
        drawLeaderboard();
    });
};

pageLoad();