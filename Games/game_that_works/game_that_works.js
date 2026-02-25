var movementSpeed = 10;

const coinTimer = 7;
var backgroundColour;

var scene;

var score = 0;
var highScore = score;

var mouseControl = true;

var coinGravityStrength = 0;
var powerUpsApplied = 0;


/*
function preload() {
    coinIMG = loadImage('/Games/game_that_works/Assets/Images/coin.png');
    speedBoostIMG = loadImage('/Games/game_that_works/Assets/Images/SpeedBoost.png');
    magnetIMG = loadImage('/Games/game_that_works/Assets/Images/Magnet.png');
}
*/

function setup() {
    cnv = new Canvas("1:1");
    player = new Sprite(cnv.hw, cnv.hh, 100, 100, "k");  
    player.color = 'cyan';

    coins = new Group()
    powerups = new Group()
    scene = 'menu';
    
	player.collides(coins, function(collider1, collider2){
        collider2.remove();
        score ++;
    });


    player.collides(powerups, function(collider1, powerUp){
        powerUpsApplied ++;
        console.log('plus : ' + powerUpsApplied);

        let effect = powerUp.Effect
        let strength = powerUp.Strength
1
        if (effect == 'SpeedBoost') { movementSpeed *= strength; }
        if (effect == 'Gravity') { coinGravityStrength += strength; }

        player.color = 'orange';

        
        setTimeout(function() {
            //if powerupsapplied is 0 and this script is trying to end a powerup then a new game has been initiated,
            // don't remove effects from previous game as they already have been removed
            if (powerUpsApplied == 0) { return; }

            if (effect == 'SpeedBoost') { movementSpeed /= strength; }
            if (effect == 'Gravity') { coinGravityStrength -= strength; }
            powerUpsApplied --;
            console.log('minus : ' + powerUpsApplied);
        
            
            
            if (powerUpsApplied <= 0) {
            player.color = 'cyan';
            }
        }, powerUp.Duration);
        
        powerUp.remove();
    });
}

function getDist(x1, y1, x2, y2) {
    return Math.sqrt( Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) );
}

function startGame() {
    scene = 'game';
    score = 0;
    coinDelay = 50;

    coinGravityStrength = 0;
    movementSpeed = 10;

    powerUpsApplied = 0;

    player.color = 'cyan';

    player.x = cnv.hw;
    player.y = cnv.hh;

    newCoin();
}

function draw() {
    if (scene == 'game') { gameScreen() }
    if (scene == 'menu') { menuScreen() }
    if (scene == 'finished') { finishedScreen() }
}

const SCREEN_PADDING = 200
function newCoin() {
    coin = new Sprite(random(SCREEN_PADDING, cnv.w - SCREEN_PADDING), random(SCREEN_PADDING, cnv.h - SCREEN_PADDING), 40);
    coin.spawnTime = millis();
    //coinIMG.resize(50, 50);
    //coin.image = coinIMG;

    coins.add(coin);
}

function newPowerup() {
    powerup = new Sprite(random(0, cnv.w), random(0, cnv.h), 40);
    powerup.color = 'red';
 
    var effectNum = random(0, 2)


    if (effectNum < 0.8) {
        powerup.Effect = "SpeedBoost";
        //speedBoostIMG.resize(50, 50);
        //powerup.image = speedBoostIMG;
    } else if (effectNum < 2) {
        powerup.Effect = "Gravity";
        //magnetIMG.resize(50, 50);
        //powerup.image = magnetIMG;
    }

    powerup.Strength = random(1, 2);
    powerup.Duration =  random(5000, 15000);

    powerups.add(powerup);
}


var control;

function menuScreen() {
    allSprites.visible = false;
    background('cyan');

    textSize(80);
    fill(0, 0, 0);
    textAlign('center');
    text("Game that works!", cnv.hw, cnv.hh - 50);

    textSize(40);
    text("Press 'Space' to begin!", cnv.hw, cnv.hh + 20);

    textSize(30);
    if (mouseControl) { control = 'mouse'; } else { control = 'keyboard'; }
    text("Using " + control + " control, press R to switch", cnv.hw, cnv.hh + 80);

    
    textSize(20);
    textAlign('left');
    text("High Score: " + highScore, 10, 30);
    
    
    if (kb.pressing('space')) { startGame(); }

    if (kb.presses('r')) { mouseControl = !mouseControl; }

    //if (kb.pressing('r')) {  }

    console.log(control);
}

function finishedScreen() {
    background('cyan');
    allSprites.visible = false;

    textSize(45);
    fill(0, 0, 0);
    textAlign('center');
    text("Game Over!", cnv.hw, cnv.hh - 75);
    textSize(25);
    text("Final Score: " + score, cnv.hw, cnv.hh - 15);
    textSize(22.5);
    text("High Score: " + highScore, cnv.hw, cnv.hh + 15);

    textSize(20);
    text("Press 'Esc' to return to menu", cnv.hw, cnv.hh + 70);
    text("Press 'Space' to replay", cnv.hw, cnv.hh + 95);

    if (kb.pressing('escape')) { scene = 'menu'; }
    if (kb.pressing('space')) { startGame(); }
}

var coinDelay;

function gameScreen() {
    background('#FFFFFF');
    allSprites.visible = true;

    textAlign('left');
    fill(0, 0, 0);
    textSize(30);
    text('Score: ' + score, 20, 40);

    if (frameCount % coinDelay == 0) {
        newCoin();
    }

    if (frameCount % 40 == 0 && coinDelay > 40) {
        coinDelay --;
    }

    for (var i = 0; i < coins.length; i++) {
        coin = coins[i];

        if (coin.spawnTime + coinTimer*1000 < millis()) {
            scene = 'finished';
            coins.removeAll();
            
            if (score > highScore) {
                highScore = score;
            }

            //tell the other script score updated
            window.dispatchEvent(new CustomEvent('scoreChanged', {
                detail: { score: highScore }
            }));

            continue;
        }

        fill(230, 230, 230);
        rect(coin.x - 20, coin.y + 35, 40, 10);

        fill(0, 255, 0);
        rect(coin.x - 20, coin.y + 35, (1 - (millis() - coin.spawnTime)/(coinTimer*1000)) * 40, 10);
    }
    
    //Poweup Generation
    if (random(1, 5000) < 5) {
        newPowerup()
    }

    for (var i = 0; i < coins.length; i++) {
        coin = coins[i];
        
        angle = Math.atan2(coin.y-player.y, coin.x - player.x);


        distance = getDist(coin.x, coin.y, player.x, player.y);

        //let dist = 20;
        distance = 750 - distance;
        if (distance < 0) { distance = 0; }

        coin.vel.x = Math.cos(angle) * -coinGravityStrength * distance/200;
        coin.vel.y = Math.sin(angle) * -coinGravityStrength * distance/200;
    }

    // Player movement

    if (mouseControl == false) {
        if (kb.pressing('W') && player.y > 50 ) { player.vel.y = -movementSpeed; }
        else if (kb.pressing('S') && player.y < cnv.h - 50 ) { player.vel.y = movementSpeed; }
        else { player.vel.y = 0 }
        
        if (kb.pressing('A') && player.x > 50 ) { player.vel.x = -movementSpeed; }
        else if (kb.pressing('D') && player.x < cnv.w - 50 ) { player.vel.x = movementSpeed; }
        else { player.vel.x = 0 }
    } else if (mouseControl == true) {
        if (getDist(player.x, player.y, mouseX, mouseY) > 5) {
            angle = Math.atan2((mouseY-player.y), (mouseX - player.x));
    
            player.vel.x = Math.cos(angle) * movementSpeed;
            player.vel.y = Math.sin(angle) * movementSpeed;
        } else {
            player.vel.x = 0;
            player.vel.y = 0;
        }
    }
}