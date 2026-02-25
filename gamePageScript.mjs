var currentGame = sessionStorage.getItem('game');
console.log(currentGame);

const metaData = await import(`./Games/${currentGame}/gameMetaData.mjs`);
document.querySelector("h1").innerHTML = metaData.gameName;

import { fb_initialise, fb_authenticate, fb_readSorted, fb_read, fb_write, fb_valChanged, changeLog } from "./fb.mjs";
window.fb_authenticate = fb_authenticate;


//Stored locally (for non logged in accounts) so if someone logs in it can be stored instantly
var sessionHighScore = 0;

// Detect element added, if element is p5 canvas then add it to the div
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        for (const element of mutation.addedNodes) {
            //if element is the p5 play canvas
            if (element.className == "p5-fullscreen") {
                document.getElementById('horizontalContainer').appendChild(element);

                //disconnect function after canvas added
                observer.disconnect();
            }
        }
    }
});

observer.observe(document.body, {childList: true, subtree: true});



//when game finishes it fires this event
window.addEventListener('scoreChanged', async function(event) {
    const score = event.detail.score;
    
    if (score > sessionHighScore) {
        sessionHighScore = score;
    }
    
    //If logged in then update DB
    if (sessionStorage.getItem("UID") != null) {
        const oldScore = await fb_read('Leaderboard/' + currentGame + "/" + sessionStorage.getItem("UID") + "/Score");
        if (score > oldScore) {
            //New High Schore
            await fb_write("Leaderboard/" + currentGame + "/" + sessionStorage.getItem("UID"), { Score: score });
        }
    }
});

async function drawLeaderboard() {
    const leaderboardSpots = document.getElementsByClassName('leaderboardEntry').length;
    var leaderboard = await fb_readSorted("Leaderboard/" + currentGame, "Score", leaderboardSpots);
    
    var entries = document.getElementsByClassName('leaderboardEntry');
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        
        if (leaderboard[i] != null) {
            const key = Object.keys(leaderboard[i])[0];
            const value = leaderboard[i][key];  //entry from first key in object (just score)
            
            if (key == sessionStorage.getItem('UID')) {
                //is user
                
                entry.querySelector(".leaderboardUsername").style.color = "#ba8800";
                entry.querySelector(".leaderboardScoreNumber").style.color = "#ba8800";
            } else {
                entry.querySelector(".leaderboardUsername").style.color = "#000000";
                entry.querySelector(".leaderboardScoreNumber").style.color = "#000000";
            }

            entry.querySelector(".leaderboardUsername").innerHTML = await fb_read("UserData/" + key + "/userName");;
            entry.querySelector(".leaderboardScoreNumber").innerHTML = value;
            
            entry.style = "display: list-item";
        } else {
            // If there is not 4th 5th 6th etc place entry then hide the html element
            entry.style = "display: none";
        }
    }
}

async function updateLoginDiv() {
    const UID = sessionStorage.getItem('UID');

    if (UID != null) {
        //User logged in
        document.getElementById('loginStatus').innerHTML = "Logged In As: " + await fb_read("UserData/" + UID + '/userName');

        document.getElementById('loginScreen').querySelector('h2').style = "display: block;";
        document.getElementById('currentScore').style = "display: block;";

        document.getElementById('currentScore').innerHTML = await fb_read('Leaderboard/' + currentGame + "/" + UID + "/Score");

        document.getElementById('LogButton').innerHTML = "Log Out";

    } else {
        //User not logged in
        document.getElementById('loginStatus').innerHTML = "Log in to save your score";

        document.getElementById('loginScreen').querySelector('h2').style = "display: none;";
        document.getElementById('currentScore').style = "display: none;";

        document.getElementById('LogButton').innerHTML = "Log In";
    }
}

updateLoginDiv();
drawLeaderboard();

async function logChange() {
    var previousUID = sessionStorage.getItem('UID');

    await changeLog();
    
    var currentUID = sessionStorage.getItem('UID');

    console.log(sessionHighScore);
    
    //self explanatory labelled block
    updateStoredScore: {
        //If logging in after having played a game
        if (previousUID == null && sessionHighScore > 0) {
    
            //If user has account but was playing offline then don't update their score unless it's higher (when logging into account)
            var currentUserStoredScore = await fb_read("Leaderboard/" + currentGame + "/" + currentUID);
    
            console.log(currentUserStoredScore.Score);
            if (currentUserStoredScore != null && currentUserStoredScore.Score > sessionHighScore ) { 
                break updateStoredScore;
            }

            await fb_write("Leaderboard/" + currentGame + "/" + sessionStorage.getItem("UID"), { Score: sessionHighScore });
        }
    }
    
    updateLoginDiv();
    drawLeaderboard();
}


window.logChange = logChange;

fb_valChanged("Leaderboard/" + currentGame, function(change) {
    drawLeaderboard();
    
    if (change == sessionStorage.getItem('UID')) {
        updateLoginDiv();
    }

    //document.getElementById('currentScore').innerHTML = score;
});