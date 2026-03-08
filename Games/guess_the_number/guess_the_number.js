var scene = "MainLobby";
var gameStarted = false;

var lobbies = {}
var lobbyData = {}


var pfps = {
    player1: "",
    player2: "",
}


function preload() {
    defaultPFP = loadImage("../../Assets/Images/notLoggedIn.png");

}

function setup() {
    cnv = new Canvas("1:1");
    scene = "MainLobby";

    //player1 = new sprit
}

function draw() {
    background('#dedede');

    if (scene == "MainLobby") {
        MainLobby();
    } else if (scene == "Game") {
        Game();
    }
}


// found this code online  https://editor.p5js.org/Kubi/sketches/IJp2TXHNJ
function hexToRgb(hex) {
    hex = hex.replace('#', '');

    var bigint = parseInt(hex, 16);

    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return [r, g, b];
}

//THIS FUNCTION WAS COPIED IN FROM LAST YEAR - with small tweaks made this year
// draw a button in p5 with various parameters 
// buttonFunction = code ran when button clicked, no parameters no return
function drawButton(x, y, w, h, buttonText, buttonFunction, borderThickness, fillColour, hoverColour) {
    // only draw the background if a fill colour is passed in
    if (fillColour != null) {
        fill(fillColour);
        strokeWeight(borderThickness);
        stroke("#000000");
        drawingContext.setLineDash([0, 0]);        
        
        noStroke();
    }
    
    if (mouseX > x-w/2 && mouseX < x+w/2 && mouseY > y - h/2 && mouseY < y + h/2) {
        // check if mouse is within bounding box of mouse
        let mainColour = hexToRgb(fillColour);

        if (hoverColour != null) {
            fill(hoverColour);
        } else {
            const HOVER_BRIGHTNESS_FACTOR = 0.7;
            fill(mainColour[0]*HOVER_BRIGHTNESS_FACTOR, mainColour[1]*HOVER_BRIGHTNESS_FACTOR, mainColour[2]*HOVER_BRIGHTNESS_FACTOR); //darken the fill colour by certain amount
        }
        
        if (mouseIsPressed == true) {
            // clicked on button
            buttonFunction();
        }
    }
    
    rect(x - w/2, y - h/2, w, h); // draw button


    textSize(sqrt(w) * 1.5);
    fill('#FFFFFF');
    textAlign(CENTER, CENTER);
    text(buttonText, x, y);
}

function win() {
     //tell the other script score updated
    window.dispatchEvent(new CustomEvent('scoreChanged', {
        detail: { 
            highScore: highScore
        }
    }));
}

function joinLobby(LobbyUID) {
    window.dispatchEvent(new CustomEvent('joinLobby', {
        detail: {
            LobbyUID: LobbyUID,
            PlayerUID: sessionStorage.getItem('UID')
        }
    }));

    sessionStorage.setItem('Lobby', LobbyUID);

    // There is a small wait until lobbyData is set correctly by the firebase update listener, so set a loop waiting for the lobby data to load in
    // Exit the loop once it has loaded in
    let joinWaitLoop = setInterval(() => {
        if (Object.keys(lobbyData).length > 0) {
            scene = "Game";
            clearInterval(joinWaitLoop);
            console.log('joined');
            return;
        }
    }, 150);
}

function leaveLobby(LobbyUID) {
    scene = "MainLobby"

    window.dispatchEvent(new CustomEvent('leaveLobby', {
        detail: {
            lobbyUID: LobbyUID,
            playerUID: sessionStorage.getItem('UID'),
        }
    }));
}

function MainLobby() {
    textStyle(NORMAL);
    textSize(70);
    fill('#000000');
    textAlign(LEFT);
    text('Guess the number!', 30, 60);

    drawButton(130, 160, 180, 60, "Create Lobby", function() {
        joinLobby(sessionStorage.getItem('UID'));
    }, 0, '#999999');

    var i = 0;
    for (let lobbyUID in lobbies) {
        let lobby = lobbies[lobbyUID];

        // a permanent placeholder is needed under /Lobbies/[game] as firebase cannot store an empty table
        if (lobbyUID == "placeholder") { continue; }
        
        drawButton(270, 200+((i+1)*60), 450, 80, lobby.players.player1.displayName + "'s Lobby", function() {
            joinLobby(lobbyUID);
        }, 0, "#111111", "#9d1d1d");

        i += 1;
    }
}

function Game() {
    textSize(70);
    textStyle(NORMAL);
    fill('#000000');
    textAlign(CENTER);
    text(lobbyData.players.player1.displayName + "'s lobby", (cnv.w/2), 60);

    drawButton(50, 50, 75, 75, "Return", function() { 
        leaveLobby(sessionStorage.getItem('Lobby'))
    }, 0, '#999999', '#8b4646');



    // two and five sevenths of the horizontal width seems to be a good spacing
    const X_POS = {
        player1: cnv.w/7*2,
        player2: cnv.w/7*5,
    }

    const PFP_YPOS = cnv.h/5*1.8
    const PFP_RADIUS = 240


    // Draw in the PFP and the username for each player
    for (let playeri in pfps) {


        var pfpIMG;

        if (pfps[playeri] != "") {
            // Player X is in the lobby
            pfpIMG = pfps[playeri];
        } else {
            // Player X is not in the lobby - set default pfp
            pfpIMG = defaultPFP;
        }


        // Create clip for the pfp (to make it a circle)
        drawingContext.save();
        drawingContext.beginPath();
        drawingContext.arc(X_POS[playeri], PFP_YPOS, (PFP_RADIUS/2), 0, 2*Math.PI);
        drawingContext.clip();

        image(pfpIMG, X_POS[playeri] - (PFP_RADIUS/2), PFP_YPOS - (PFP_RADIUS/2), PFP_RADIUS, PFP_RADIUS);
        drawingContext.restore();
    
        textSize(30);
        textAlign(CENTER);
        fill("#000000");
        text(lobbyData.players[playeri].displayName, X_POS[playeri], PFP_YPOS + 180);
    }



    textSize(50);
    textStyle(BOLD);
    text("vs", cnv.w/2, PFP_YPOS);
}

window.addEventListener('lobbyAdded', function(event) {
    lobbies = event.detail.lobbies;
    console.log(lobbies);

    console.log("event!");
    // If the lobby you are in is removed then leave it
    if (lobbies[sessionStorage.getItem('Lobby')] == null) {
        leaveLobby(sessionStorage.getItem('Lobby'));
    }
});

window.addEventListener('lobbyChanged', function(event) {
    lobbyData = event.detail.lobby;
    pfp1 = loadImage(lobbyData.players.player1.pfp);

    for (let i in lobbyData.players) {
        const PFP = lobbyData.players[i].pfp
        if (PFP != "") {
            pfps[i] = loadImage(PFP);
        } else {
            pfps[i] = "";
        }
    }
});

// If a player closes the window whilst in a lobby
window.addEventListener('beforeunload', (event) => {
    leaveLobby(sessionStorage.getItem('Lobby'));
});