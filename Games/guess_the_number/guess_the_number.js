var scene = "MainLobby";
var gameStarted = false;
var iWin;


var lobbies = {}
var lobbyData = {}

var guess = 50;

var max_guess = 100;
var min_guess = 1;

let pfp_x_offset;



function preload() {
    DEFAULT_PFP = loadImage("../../Assets/Images/notLoggedIn.png");
}

function setup() {
    cnv = new Canvas("1:1");
    pfp_x_offset = cnv.w/7*1.5;
    scene = "MainLobby";
}

function draw() {
    background('#dedede');
    
    if (scene == "waiting" || scene == "notStarted" || scene == "player1Turn" || scene == "player2Turn" || scene == "won") {
        Game(); //draw in always visible things, such as the two PFPS, usernames, and the "vs" in between
    }
    
    if (scene == "MainLobby") { MainLobby(); }
    if (scene == 'notStarted') { NotStarted(); }
    if (scene == 'waiting') { Waiting(); }
    if (scene == 'player1Turn' || scene == 'player2Turn') { PlayerTurn(); }
    if (scene == 'player1Won' || scene == 'player2Won') { Won(); }
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
function drawButton(x, y, w, h, buttonText, buttonFunction, borderThickness, fillColour, hoverColour, _textSize) {
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

    if (_textSize != null) {
        textSize(_textSize);
    } else {
        textSize(sqrt(w) * 1.5);
    }

    fill('#FFFFFF');
    textAlign(CENTER, CENTER);
    text(buttonText, x, y);
}

function startGame() {
    window.dispatchEvent(new CustomEvent('startGame', {
        detail: { 
            lobbyID: sessionStorage.getItem('Lobby'),
            maxNum: max_guess,
            minNum: min_guess,
        }
    }));
}

function makeGuess(_guess) {
    window.dispatchEvent(new CustomEvent('makeGuess', {
        detail: {
            lobbyData: lobbyData,
            lobbyId: sessionStorage.getItem("Lobby"),
            playerID: sessionStorage.getItem("UID"),
            guess: _guess
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

    /*
    let joinWaitLoop = setInterval(() => {
        if (Object.keys(lobbyData).length > 0) {
            //scene = "Game";
            clearInterval(joinWaitLoop);
            console.log('joined');
            return;
        }
    }, 150);
    */
}


// req is whether or not to send a request to the db - used as if a host leaves the secondary player shopuldn't send another leave request which could overwrite the deleting of the lobby
// Elaboration if the host leave the lobby is deleted, but if the secondary player sends a request it only overwrites the player 2 data.
// Trying to overwrite the player2 data after the lobby is deleted results in a new empty lobby with only player 2 data which causes problems
// Just trust it it's useful

// outdated comment aboev ignore ^ (i am keeping it in case i need to bring back the system it's describing)

function leaveLobby() {
    scene = "MainLobby";
    const LOBBY_ID = sessionStorage.getItem('Lobby');
    sessionStorage.removeItem('Lobby');

    console.log(sessionStorage.getItem('Lobby'));

    window.dispatchEvent(new CustomEvent('leaveLobby', {
        detail: {
            lobby: lobbyData,
            lobbyID: LOBBY_ID,
            playerUID: sessionStorage.getItem('UID'),
        }
    }));
    
    lobbyData = {}
}

function MainLobby() {
    textStyle(NORMAL);
    textSize(70);
    fill('#000000');
    textAlign(LEFT);
    text('Guess the number!', 30, 60);

    drawButton(130, 160, 180, 60, "Create Lobby", () => {
        joinLobby(sessionStorage.getItem('UID'));
    }, 0, '#999999');

    var i = 0;
    for (let lobbyUID in lobbies) {
        let lobby = lobbies[lobbyUID];

        // a permanent placeholder is needed under /Lobbies/[game] as firebase cannot store an empty table
        if (lobbyUID == "placeholder") { continue; }
        
        drawButton(270, 200+((i+1)*60), 450, 80, lobby.players.player1.displayName + "'s Lobby", () => {
            joinLobby(lobbyUID);
        }, 0, "#111111", "#9d1d1d");

        i += 1;
    }
}


function NotStarted() {

    if (sessionStorage.getItem('Lobby') == sessionStorage.getItem('UID')) {
        // Player is the host of their lobby
        drawButton(cnv.w/2, cnv.h/7*5, 350, 75, "Start Game", startGame, 3, "#999999");
    } else {
        // Player is not the host of their lobby
        textSize(30);
        fill("#808080");
        textAlign(CENTER, CENTER);
        text("Waiting for host to start the game", cnv.w/2, cnv.h/7*5);
    }
}

function Waiting() {
    textSize(30);
    fill("#808080");
    textAlign(CENTER, CENTER);
    text("Waiting for players - 1/2", cnv.w/2, cnv.h/7*5);
}


function Game() {
    textSize(70);
    textStyle(NORMAL);
    fill('#000000');
    textAlign(CENTER);
    text(lobbyData.players.player1.displayName + "'s lobby", (cnv.w/2), 60);

    drawButton(50, 50, 75, 75, "Return", () => { 
        console.log('return');
        leaveLobby();
    }, 0, '#999999', '#8b4646');



    // two and five sevenths of the horizontal width seems to be a good spacing

    const PFP_YPOS = cnv.h/5*1.5;
    const PFP_RADIUS = 230;


    // Draw in the PFP and the username for each player
    for (let playeri in lobbyData.players) {
        var pfpIMG = lobbyData.players[playeri].pfp;

        // Create clip for the pfp (to make it a circle)
        var xpos = pfp_x_offset;
        if (playeri == 'player1') { xpos = -pfp_x_offset; }

        drawingContext.save();
        drawingContext.beginPath();
        drawingContext.arc(cnv.w/2 + xpos, PFP_YPOS, (PFP_RADIUS/2), 0, 2*Math.PI);
        drawingContext.clip();

        image(pfpIMG, cnv.w/2 + xpos - (PFP_RADIUS/2), PFP_YPOS - (PFP_RADIUS/2), PFP_RADIUS, PFP_RADIUS);
        drawingContext.restore();
    
        textSize(30);
        textAlign(CENTER);
        fill("#000000");
        text(lobbyData.players[playeri].displayName, cnv.w/2 + xpos, PFP_YPOS + 180);
    }



    textSize(50);
    textStyle(BOLD);
    text("vs", cnv.w/2, PFP_YPOS);
}

function NotMyTurn() {
    const TEXT_HEIGHT = cnv.h/7*4.5;

    textSize(30);
    fill("#808080"); 
    text(lobbyData.players[scene.replace('Turn', "")].displayName + " is guessing", cnv.w/2, TEXT_HEIGHT);
}

const COUNTDOWN_TIMER = 6;
var buttonCountdown = 0;

function Won() {

    // Find player who won -> playerXWon into playerX
    let winner = scene.replace("Won", "");



    if (lobbyData.players[winner].UID == sessionStorage.getItem('UID')) {
        // I won
        

    } else {
        // Other player won
    }
}

function MyTurn() {
    // Button countdown is used to add some space in between clicks on buttons, since the button function runs each frame
    // Each time you click the increase or decrease button it increases the countdown to the defined countdown timer, and disables the button until the countdown returns to zero
    if (buttonCountdown > 0) { buttonCountdown -= 1; }

    const GUESS_BUTTON_HEIGHT = cnv.h/9*5;
    const BUTTON_OFFSET = 120;
    const BUTTON_SIZE = 60;

    textSize(80);
    fill("#000000");
    textAlign(CENTER, CENTER); 
    text(guess, cnv.w/2, GUESS_BUTTON_HEIGHT);

    drawButton(cnv.w/2 + BUTTON_OFFSET, GUESS_BUTTON_HEIGHT, BUTTON_SIZE, BUTTON_SIZE, ">", () => { 
        if (buttonCountdown <= 0 && guess < max_guess ) { guess += 1; buttonCountdown = COUNTDOWN_TIMER; }
    }, 1, "#888888", null, 40);

    drawButton(cnv.w/2 - BUTTON_OFFSET, GUESS_BUTTON_HEIGHT, BUTTON_SIZE, BUTTON_SIZE, "<", () => { 
        if (buttonCountdown <= 0 && guess > min_guess) { guess -= 1; buttonCountdown = COUNTDOWN_TIMER; }
    }, 1, "#888888", null, 40);

    drawButton(cnv.w/2, GUESS_BUTTON_HEIGHT + 120, 250, 80, "Submit Guess", () => { makeGuess(guess); }, 0, "#888888");
    
}

// Either player is taking their turn to guess
function PlayerTurn() {
    textAlign(CENTER, CENTER);

    const TEXT_HEIGHT = cnv.h/9*7.6;

    textSize(40);
    fill("#000000");

    text(String(lobbyData["guess_range"].min) + " is too low", cnv.w/2, TEXT_HEIGHT - 70);
    text(String(lobbyData["guess_range"].max) + " is too high", cnv.w/2, TEXT_HEIGHT);


    //Find which player is currently taking their turn
    for (let playeri in lobbyData.players) {
        if (scene == (playeri + 'Turn') && lobbyData.players[playeri].UID == sessionStorage.getItem('UID')) {
            MyTurn();
            return;
        }
    }

    // If hasn't found that you are taking your turn it will not return from the loop and will reach this point
    NotMyTurn();
}

// Listeners to add and functions to run upon game loadup
function pageLoad() {
    window.addEventListener('lobbyAdded', function(event) {
        lobbies = event.detail.lobbies;

        // If the lobby you are in is removed then leave it
        if (lobbies[sessionStorage.getItem('Lobby')] == null && sessionStorage.getItem('Lobby') != null) {
            console.log('lobby removed');
            console.log(sessionStorage.getItem('Lobby'));
            leaveLobby();
        }
    });
    
    window.addEventListener('lobbyChanged', function(event) {
        if (event.detail.lobbyUID == sessionStorage.getItem("Lobby")) {
            lobbyData = event.detail.lobby;
            scene = lobbyData.status;
            console.log(scene);
        
            // Find PFPs
            for (let i in lobbyData.players) {
                const PFP = lobbyData.players[i].pfp
                if (PFP != "") {
                    //
                    lobbyData.players[i].pfp = loadImage(lobbyData.players[i].pfp);
                } else {
                    // Player 2 is not logged in - set their pfp to the default not logged in pfp
                    lobbyData.players[i].pfp = DEFAULT_PFP;
                }    
            }


            //Verify players guess
            for (let playeri in lobbyData.players) {
                const PLAYER = lobbyData.players[playeri];
                if (PLAYER.guess == lobbyData.mysteryNumber) {
                    // Someone has won

                    // Set Lobby status to won
                    
                }
            }
        }
    });
    
    // If a player closes the window whilst in a lobby - leave the lobby
    window.addEventListener('beforeunload', (event) => {
        leaveLobby();
    });
}


pageLoad();