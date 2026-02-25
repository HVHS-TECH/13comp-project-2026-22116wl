var scene = 'menu';
var score = 0;
var highScore = 0;
var wave = 0;
var gameAttempt = 0; //used on backend to differentiate different games to the alien spawn loop

const BULLET_SPEED = 15;
const BULLET_FIRE_RATE = 10; //frame gap between fires, lower # = more frequent

const SIDEGUN_RECHARGE_RATE = 0.5;
const LAZER_DEPLETION_RATE = 2;

/*
import { initialise, authenticate, read, write, updateVal } from "./fb_io.mjs"; //import database functions
initialise();
*/


//wave data
const WAVE_DATA_DICTIONARY = [
    {aliens:5, alienFrequency: 1, alienBuff: 0.8, bossHealth:0, scoreMult: 0.8}, //introductory easy wave
    {aliens:10, alienFrequency: 1.2, alienBuff: 1, bossHealth:200, scoreMult: 1},
    {aliens:12, alienFrequency: 1.1, alienBuff: 1.1, bossHealth:400, scoreMult: 1.2},
    {aliens:20, alienFrequency: 1.5, alienBuff: 0.9, bossHealth:0, scoreMult: 1}, // loads of weak aliens
    {aliens:6, alienFrequency: 1.5, alienBuff: 1.3, bossHealth:500, scoreMult: 2}, // few but very strong aliens
    {aliens:10, alienFrequency: 1, alienBuff: 1, bossHealth:800, scoreMult: 1.3}, // very strong boss
]

function setup() {
    cnv = new Canvas('5:7');
    
    world.gravity = 0;
    guns = new Group();

    // main gun
    mainGunTurret = new Sprite(cnv.hw, cnv.h - 120, 20, 120, 'k');
    mainGunTurret.color = '#555555';
    
    mainGunBody = new Sprite(cnv.hw, cnv.h, 150, 'k');
    mainGunBody.color = '#999999';
    guns.add(mainGunBody);
    mainGunBody.turret = mainGunTurret;


    // left side lazer gun
    lazerTurret = new Sprite(cnv.w * 0.2, cnv.h - 60, 15, 60, 'k');
    lazerTurret.color = '#630005';

    lazerBody = new Sprite(cnv.w * 0.2, cnv.h, 80, 'k');
    lazerBody.color = '#b80009';
    lazerBody.energy = 0;
    guns.add(lazerBody);
    lazerBody.turret = lazerTurret;



    // right side canon gun
    canonTurret = new Sprite(cnv.w * 0.8, cnv.h - 60, 15, 60, 'k');
    canonTurret.color = '#008f9c';

    canonBody = new Sprite(cnv.w * 0.8, cnv.h, 80, 'k');
    canonBody.color = '#00c2d4';
    canonBody.energy = 0;
    guns.add(canonBody);
    canonBody.turret = canonTurret;


    
    bulletGroup = new Group()
    alienGroup = new Group()

    bulletGroup.collides(alienGroup, function(bullet, alien){
        bullet.remove();

        let damageDealt = 20; // arbitrary constant

        if (bullet.isCanon) {
            damageDealt = 100; 
        }

        alien.health -= damageDealt;
        if (scene == 'game') { // don't add score for bullets that collided after game ended
            score += Math.round(damageDealt / 10 * waveData['scoreMult']);
        }
    });
}



function spawnBullet(turret, canon) {
    let bullet = new Sprite(0, 0, 20, 10, 'd');
    bulletGroup.add(bullet);

    bullet.isCanon = canon

    if (canon) {
        bullet.width = 30;
        bullet.height = 20;
        bullet.color = '#d99f00';
    } else {
        bullet.width = 20;
        bullet.height = 10;
        bullet.color = "yellow";
    }

    bullet.rotation = turret.rotation - 90;

    // spawn at end of gun turret

    bullet.x = turret.x + Math.sin(degToRad(turret.rotation)) * turret.height/2;
    bullet.y = turret.y - Math.cos(degToRad(turret.rotation)) * turret.height/2;

    bullet.vel.x = Math.cos(degToRad(bullet.rotation)) * BULLET_SPEED;
    bullet.vel.y = Math.sin(degToRad(bullet.rotation)) * BULLET_SPEED;
}

function spawnAlien(boss) {
    if (boss == null) { boss = false; }

    let padding = 50;

    let alien = new Sprite(random(padding, cnv.w - padding), -10, 30, "k");

    if (boss) {
        alien.width = 60;
        alien.startHealth = waveData['bossHealth'];
    } else {
        alien.width = 30;
        alien.height = 30;

        alien.startHealth = 100; // 100 is base health
        alien.startHealth *= waveData['alienBuff']; // wave buff
        alien.startHealth *= (random(50, 150)/100); // add healthy dose of randomness

        alien.startHealth = Math.round(alien.startHealth); // round it out to finalise starting health
    }

    alienGroup.add(alien);

    alien.vel.y = 2;
    
    alien.health = alien.startHealth;

    //the wave down thing uses the Y pos, offset by this random number different for each alien for randomness
    alien.yRandomOffset = random(-2000, 2000);
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

function radToDeg(radian) {
    return radian * (180/Math.PI);
}

function degToRad(degrees) {
    return degrees * (Math.PI/180);
}


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


function draw() {
    background('#000011');

    // draw boundary line
    stroke('red');
    strokeWeight(3);
    drawingContext.setLineDash([5, 10]);
    const LINE_HEIGHT = 200;
    line(0, cnv.h - LINE_HEIGHT, cnv.w, cnv.h-LINE_HEIGHT);
    strokeWeight(0);


    if (kb.pressing('e') && kb.pressing('a') && kb.pressing('s') && kb.pressing('t') && kb.pressing('r')) {
        textSize(10);
        textAlign(LEFT);
        fill('#00FF00');
        text('congrats you found an easter egg send me an email and i will give you a present', 20, 20)
    }


    if (scene == 'game') {
        gameScreen();
    } else if (scene == 'menu') {
        menuScreen();
    } else if (scene == 'gameOver') {
        gameOverScreen();
    } else if (scene == 'controls') {
        controlsScreen();
    }
}


function resetGame() {
    alienGroup.removeAll();
    bulletGroup.removeAll();

    // reset positon and rotation of gun turrets
    mainGunTurret.x = cnv.hw;
    mainGunTurret.y = cnv.h - 120;
    mainGunTurret.rotation = 0;

    lazerTurret.x = cnv.w * 0.2;
    lazerTurret.y = cnv.h - 60;
    lazerTurret.rotation = 0;

    canonTurret.x = cnv.w * 0.8;
    canonTurret.y = cnv.h - 60;
    canonTurret.rotation = 0;


    // reset side gun gun energy levels
    lazerBody.energy = 0;
    canonBody.energy = 0;

    // reset basic data
    wave = 0;
    score = 0;
}

var interwavePause = false;

function controlsScreen() {
    textAlign(CENTER);
    fill('#FFFFFF');
    textSize(60);
    
    strokeWeight(0);
    text('Controls', cnv.hw, 200);
    textSize(20);
    text('Main Gun (Center): Hold Space', cnv.hw, cnv.hh - 150);
    text('Lazer (Left): Hold A', cnv.hw, cnv.hh - 100);
    text('Canon (Right): D', cnv.hw, cnv.hh - 50 );
    
    text('Aim: Cursor', cnv.hw, cnv.hh + 20);


    drawButton(cnv.hw, cnv.h-350, 220, 80, "Return", function() {
        scene = 'menu';
    }, '#333333', 3);
}

function menuScreen() {
    textSize(50);
    textAlign(CENTER);
    fill('#FFFFFF');
    text('Y12 Comp Project', cnv.hw, 180);
    textSize(20);
    text('High Score: ' + highScore, cnv.hw, 240)


    drawButton(cnv.hw, cnv.hh - 100, 300, 100, "Play", function() {
        scene = 'game';
        startNewWave();
    }, '#333333', 3);


    drawButton(cnv.hw, cnv.hh, 250, 80, "Controls", function() {
        scene = 'controls';
    }, '#333333', 3);

    
}

function gameOverScreen() {
    textAlign(CENTER, CENTER);
    textSize(30);
    text('Score: ' + score, cnv.hw, cnv.h / 4);
    textSize(15);
    text('High Score: ' + highScore, cnv.hw, cnv.h / 4 + 50);


    for (let i = 0; i < alienGroup.length; i++) {
        alienGroup[i].vel.y = 0;
        alienGroup[i].vel.x = 0;
    }

    drawButton(cnv.hw, cnv.hh, 250, 70, "Play Again", function() {
        resetGame();
        scene = 'game';
        startNewWave();
    }, '#333333', 3);
    

    drawButton(cnv.hw, cnv.hh + 70, 200, 60, "Return to menu", function() {
        resetGame();
        scene = 'menu';
    }, '#333333', 3);
}

var waveData;
var remainingAliens;

function startNewWave() {
    wave++;
    if (wave == 1) { gameAttempt ++; } // if starting first wave in game then increase attempt
    
    if (wave > WAVE_DATA_DICTIONARY.length) {
        waveData = WAVE_DATA_DICTIONARY[ Math.floor(random(1, WAVE_DATA_DICTIONARY.length)) ]; // if no more waves are programmed just repeat ramdom previous wave
    } else {
        waveData = WAVE_DATA_DICTIONARY[wave - 1];
    }


    remainingAliens = waveData['aliens'];
    interwavePause = true; // create a small pause between waves
    
    var currentGame = gameAttempt //this is so if new game is started it can detect that new game has started and not spawn aliens from last game

    setTimeout(function() {
        if (scene != 'game' || gameAttempt != currentGame ) { return; } // game over or new game started before pause ended
        interwavePause = false;
        
        for (var i = 1; i <= waveData['aliens']; i++) {
            setTimeout(function(count) {

                if (scene != 'game' || gameAttempt != currentGame ) { return; } // game over or new game started before alien spawned

                if ( count == Math.floor(waveData['aliens'] * 0.8) ) {
                    if (waveData['bossHealth'] > 0) {
                        spawnAlien(true);
                    } else {
                        spawnAlien(); // no boss this wave
                    }
                } else {
                    spawnAlien();
                }
    
    
            }, 2000/waveData['alienFrequency'] * (random(85, 115) / 100) * i, i)
        }

    }, 3000);


}

function clamp(number, lowerBound, upperBound) {
    return Math.min(Math.max(number, lowerBound), upperBound);
}

function getAngle(x1, y1, x2, y2) {
    return Math.atan2((y2 - y1), (x2 - x1));
}

const BUFFER = 1;// turret rotation cap // in radians 

function gameScreen() {
    // Rotate and position the gun turrets to point to mouse
    for (let i = 0; i < guns.length; i++) {
        let gunBody = guns[i];
        let turret = gunBody.turret;

        let bodyToMouse = getAngle(gunBody.x, gunBody.y, mouseX, mouseY)
        bodyToMouse = clamp(bodyToMouse, degToRad(-90) - BUFFER, degToRad(-90) + BUFFER); // clamp rotation
    

        turret.rotation = radToDeg(bodyToMouse) + 90;
        turret.x = gunBody.x + Math.cos(bodyToMouse) * turret.height;
        turret.y = gunBody.y + Math.sin(bodyToMouse) * turret.height;
    }


    textSize(20);
    fill('#FFFFFF'); 
    textAlign(CENTER, CENTER);
    
    if (interwavePause == true) {
        textSize(60);  
        text("Wave " + wave + " Starting", cnv.hw, cnv.h / 8);
    } else {
        textSize(40);
        text("Wave: " + wave, cnv.hw, cnv.h / 8);
        
        textSize(20);
        text("Aliens Remaining: " + remainingAliens, cnv.hw, cnv.h / 8 + 100);
    }

    textSize(20);
    text("Score: " + score, cnv.hw, cnv.h / 8 + 50);

    drawButton(60, 25, 100, 30, "Return To Menu", function() {
        if (score > highScore) { highScore = score; }
        resetGame();
        scene = 'menu';
    }, '#333333', 3)

    if (kb.pressing('space') && frameCount%BULLET_FIRE_RATE == 0 && interwavePause == false) {
        spawnBullet(mainGunTurret, false);
    }

    if (kb.pressing('a') && interwavePause == false) {
        let angle = degToRad(lazerTurret.rotation);


        if (lazerBody.energy > 0) {
            lazerBody.energy -= LAZER_DEPLETION_RATE;
        }

        // reduce first then check to eliminate the 'sputtering' when holding down A at low energy

        if (lazerBody.energy > 3)  { // small padding (3)
            
            // get point at tip of lazer turret
            
            let startX = lazerTurret.x + Math.sin(angle) * lazerTurret.height/2;
            let startY = lazerTurret.y - Math.cos(angle) * lazerTurret.height/2;
            
            
            let endX = startX + Math.sin(angle) * 9999;
            let endY = startY - Math.cos(angle) * 9999;
            
            stroke('red');
            strokeWeight(3);
            drawingContext.setLineDash([0, 0]);
            line (startX, startY, endX, endY);
            strokeWeight(0);
            
            // find out which aliens are within beam
            
            for (var i = 0; i < alienGroup.length; i++) {
                let alien = alienGroup[i];
                let alienAngle = Math.atan((alien.x - startX)/ (startY - alien.y))
                
                // compare angle lazer is pointing, and angle between turret end and alein
                // make buffer angle small when it's further out
                
                let distance = Math.sqrt( ((alien.x - startX) ** 2) + ((startY - alien.y) ** 2) );
                
                if (Math.abs(angle - alienAngle) < (alien.width/2000)/(distance/1000)) { // in radians
                    // alien is in beam path
                    alien.health -= 1;
                }
                
            }   
        }
    }

    if (kb.pressed('d') && canonBody.energy > 99 && interwavePause == false) {
        // launch canon
        canonBody.energy = 0;
        spawnBullet(canonTurret, true);
    }

    lazerBody.energy += SIDEGUN_RECHARGE_RATE;
    if (lazerBody.energy > 100) { lazerBody.energy = 100; }

    canonBody.energy += SIDEGUN_RECHARGE_RATE;
    if (canonBody.energy > 100) { canonBody.energy = 100; }


    // remove off screen bullets
    for (let i = 0; i < bulletGroup.length; i++) {
        let bullet = bulletGroup[i];
        if (bullet.y < -10 || bullet.x < -10 || bullet.x > cnv.w + 10) {
            bullet.remove();
        }
    }

    
    for (let i = 0; i < alienGroup.length; i++) {
        let alien = alienGroup[i];

        if (alien.health <= 0) {
            alien.remove();
            remainingAliens --;
        }

        // alien x pos wave down
        let frequency = 100; // higher is less frequent
        let amplitude = 0.8;
        alien.vel.x = Math.sin((alien.y+alien.yRandomOffset)/frequency) * amplitude;
        
        
        // Alien health bars
        fill(230, 230, 230);
        rect(alien.x - 20, alien.y + alien.width + 5, 40, 8);

        fill(0, 255, 0);
        rect(alien.x - 20, alien.y + alien.width + 5, alien.health/alien.startHealth * 40, 8);


        // if distance between bottom of screen and alien is less that threshold (200px) then game over
        if ((cnv.h - alien.y) < 200) {
            scene = 'gameOver';

            if (score > highScore) {
                highScore = score;
            }
            
            //tell the other script score updated
            window.dispatchEvent(new CustomEvent('scoreChanged', {
                detail: { score: highScore }
            }));
        }
    }


    // lazer energy bar
    fill(230, 230, 230);
    rect(lazerBody.x - 5, lazerBody.y - 100, 10, 40);

    fill(0, 255, 0);
    let barHeight = (lazerBody.energy/100) * 40  // y pos is inverted so health bar is anchored at top
    rect(lazerBody.x - 5, lazerBody.y - 60 - barHeight, 10, barHeight);


    // canon energy bar
    fill(230, 230, 230);
    rect(canonBody.x - 5, canonBody.y - 100, 10, 40);

    fill(0, 255, 0);
    barHeight = (canonBody.energy/100) * 40  // y pos is inverted so health bar is anchored at top
    rect(canonBody.x - 5, canonBody.y - 60 - barHeight, 10, barHeight);
    

    if (remainingAliens <= 0) {
        startNewWave();
    }
}