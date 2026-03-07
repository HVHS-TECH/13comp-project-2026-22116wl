var scene = "MainLobby";
var gameStarted = false;

function setup() {
    cnv = new Canvas("1:1");
    scene = "MainLobby";

    player1 = new sprit
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

//THIS FUNCTION WAS COPIED IN FROM LAST YEAR
// draw a button in p5 with various parameters 
// buttonFunction = code ran when button clicked, no parameters no return
function drawButton(x, y, w, h, buttonText, buttonFunction, fillColour, hoverColour, borderThickness) {
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
        const HOVER_BRIGHTNESS_FACTOR = 0.7;
        fill(mainColour[0]*HOVER_BRIGHTNESS_FACTOR, mainColour[1]*HOVER_BRIGHTNESS_FACTOR, mainColour[2]*HOVER_BRIGHTNESS_FACTOR); //darken the fill colour by certain amount
        
        if (mouseIsPressed == true) {
            // clicked on button
            buttonFunction();
        }
    }
    
    rect(x - w/2, y - h/2, w, h); // draw button


    textSize(w/8);
    fill('#FFFFFF');
    textAlign(CENTER, CENTER);
    text(buttonText, x, y);
}

function win() {
     //tell the other script score updated
    window.dispatchEvent(new CustomEvent('scoreChanged', {
        detail: { highScore: highScore }
    }));
}

function MainLobby() {
    textSize(70);
    fill('#000000');
    textAlign(LEFT);
    text('Guess the number!', 30, 60);

    drawButton(130, 160, 180, 60, "Create Lobby", function() { scene = "Game" }, '#999999', '#8b4646', 0);
}

function Game() {
    textSize(70);
    fill('#000000');
    textAlign(LEFT);
    text('Wilfrdes lobby', (cnv.w/2)-250, 60);

    drawButton(50, 50, 75, 75, "Return", function() { scene = "MainLobby" }, '#999999', '#8b4646', 0);
}