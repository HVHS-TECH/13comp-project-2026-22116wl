

var scene = "lobby";

function setup() {
    cnv = new Canvas("1:1");
    scene = "lobby";
}

function draw() {
    if (scene == "lobby") {
        Lobby()
    }
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

function Lobby() {

}