console.log('script connected');
/**************************************************************/
// Some code written by Wilfred Leicester - Term 2 2025, majorly edited and changed throughout in 2026
/**************************************************************/

import { fb_authenticate, fb_read, fb_write, getAuth } from './fb.mjs';
import { changeDetail, deleteAccount, logOut, validateDetail } from "./accountFunctions.mjs";

function panelPopOut(panel, direction, _display = "block", duration = 90, ) {
    var goingOut = panel.style.display == "none";
    if (goingOut == true) {
        panel.style.display = _display;
    }

    var width;
    if (direction == "bottom" || direction == "top") {
        width = panel.offsetHeight;
    } else {
        width = panel.offsetWidth;   
    }
    

    var keyframes = [
        { [direction]: "-" + width + "px" },
        { [direction]: "0px" }
    ];

    if (!goingOut) { keyframes = keyframes.reverse(); } 


    panel.animate(keyframes, {
        duration: duration,
        iterations: 1,
        fill: 'forwards'
    });

    // if going in then hide panel after finishing the animation
    if (goingOut == false) {
        setTimeout(function() {
            panel.style.display = 'none';
        }, duration);
    }
}


// Toggle the panel at the bottom of the screen that shows game information
async function toggleGameInfo(game) {
    var panel = document.getElementById('gameInfo');
    var desc = panel.querySelector('#gameDescription');

    var panelHidden = panel.style.display == 'none';

    //Pop out the panel if it's hidden, or if the game is not changing
    if ( (game == sessionStorage.getItem('currentGame') && !panelHidden) || panelHidden) {
        panelPopOut(panel, 'bottom', 'flex', 90);
    }

    sessionStorage.setItem('currentGame', game);
    
    
    const META_DATA = await import(`./Games/${game}/gameMetaData.mjs`);


    panel.querySelector('img').src = `./Games/${game}/Icon.png`;

    desc.querySelector('h2').innerHTML = META_DATA.gameName;
    desc.querySelector('p').innerHTML = META_DATA.description;
}

// Verify the user inputs on the registration page
function verifyRegistration() {
    var valid = true; //Assume true unless invalid
    
    document.getElementById('fields').querySelectorAll("div").forEach(element => {
        var input = element.querySelector('input');
        
        var fieldValid = validateDetail(input.value, element.id); // returns true, or a string error message
        if (fieldValid != true) {
            input.placeholder = fieldValid;
            valid = false;
            input.value = "";
        }
    });

    return valid;
}


// configure page for a logged in user
async function login(authenticate) {
    //autenticate parameter is used for logging in after registraion. Run function after registration without doing another auth popup
    if (authenticate != false) {
        var auth = await fb_authenticate();

        if (await fb_read('Users/' + (auth.user.uid)) == null) {
            alert("user doesn't exist");
            return;
        }
    }

    document.getElementById('loginBlur').style.display = "none";
    
    // had to used timeout because getAuth() has a weird problem (returns null right on page load)
    var auth = await getAuth();
    setTimeout(async function() {
        const UID = auth.currentUser.uid;
        
        sessionStorage.setItem('UID', UID);
        
        console.log('logged in as ' + auth.currentUser.displayName);
        const pfp = getAuth().currentUser.photoURL;
        document.getElementById("accountSettingsButton").querySelector('img').src = pfp;
        
        
        document.getElementById("settingsPhoto").src = pfp;

        var userData = await fb_read("/Users/" + UID);
        
        
        document.querySelectorAll('.detailsEntryField').forEach(element => { 
            element.querySelector('input').value = userData[element.id];
        });

        
        if (await fb_read('/admins/' + UID) != null) {
            document.getElementById('adminButton').style.display = 'block';
        }

    }, 600);
}


// returns an error message if false, true if true
async function checkRegistrationEligibility(UID) {
    if (await fb_read("Users/" + UID) != null) {
        return 'exists';
    }
    
    if (await fb_read('/bannedUsers/' + UID) != null) {
        return 'banned';
    }

    //if passed the two checks, return true
    return true;
}

//register account
async function register() {
    console.log('ran')
    var auth = await fb_authenticate();
    const UID = auth.user.uid;

    let registrationEligibility = await checkRegistrationEligibility(UID);

    if (registrationEligibility == 'exists') {
        alert("User already exists!");
        return;
    } else if (registrationEligibility == 'banned') {
        alert('This account is banned');
        return;
    }

    //change from landing page to registration page
    document.getElementById('landing').style.display = "none";
    document.getElementById('registration').style.display = "block";

    //set display name registration field to google display name as default (for convenience)
    document.getElementById('displayName').querySelector('input').value = auth.user.displayName;
}

//create the account in firebase
async function createAccount() {
    const AUTH = getAuth();

    let validRegistration = verifyRegistration();
    console.log(validRegistration);
    if (!validRegistration) {
        return;
    }

    var userData = {};

    //add google auth data which is to be stored
    userData['realName'] = AUTH.currentUser.displayName;
    userData['email'] = AUTH.currentUser.email;
    userData['pfp'] = AUTH.currentUser.photoURL;

    // for each input box in the registration form, add the data which has been entered
    const FIELDS =  Array.from(document.getElementById('fields').querySelectorAll('div'));
    for (let i in FIELDS) {
        let field = FIELDS[i];
        userData[field.id] = field.querySelector('input').value;
    }

    fb_write("Users/" + AUTH.currentUser.uid, userData);

    //enter website
    login(false);
}


async function changeDetailClicked(element) {
    element.parentElement.querySelector('input').focus();
}


async function isUserLoggedIn() {
    console.log(sessionStorage.getItem("UID"));
    if (sessionStorage.getItem('UID') != null) {
        return(true);
    } else {
        return(false);
    }
}


const PANEL = document.getElementById("accountDetails");

function toggleAccountDetailsPanel() {
    if (PANEL.style.display == "none") {
        PANEL.style.display = 'block';
        document.querySelector('#detailsPopout').innerHTML = "Account Details ▼";
    } else {
        PANEL.style.display = 'none';
        document.querySelector('#detailsPopout').innerHTML = "Account Details ▲";
    }
}


// functions to run and listners to create when the page loads
async function pageLoad() {
    // When player click off name change box, change the name
    document.querySelectorAll('.detailsEntryField').forEach(element => {
        element.querySelector('input').addEventListener('focusout', () => {
            let newName = element.querySelector('input').value;
            changeDetail(sessionStorage.getItem('UID'), newName, element.id);
        });
    });

    
    // If player presses enter, unfocus the name change box (to change the name)
    document.onkeypress = function (event) {
        if (event.key == "Enter") {
            document.querySelectorAll('.detailsEntryField').forEach(element => {
                element.querySelector('input').blur();
            });
        }
    };

    // add links to and configure each game on the home page
    document.querySelectorAll('.gameIcon').forEach(async (element) => {
        element.querySelector("img").src = "./Games/" + element.id + "/Icon.png";
    
        const metaData = await import(`./Games/${element.id}/gameMetaData.mjs`);
        element.querySelector("p").innerHTML = metaData.gameName;
    });


    if (await isUserLoggedIn()) {
        console.log('logged in function');
        login(false); //log in without asking for authentication
    } else {
        logOut(); //Make sure sessionStorage UID and google auth match upon loading when logged out
    }
}

pageLoad();


window.createAccount = createAccount;
window.deleteAccount = deleteAccount;
window.changeDetailClicked = changeDetailClicked;
window.register = register;
window.logOut = logOut;
window.login = login;
window.panelPopOut = panelPopOut;
window.toggleGameInfo = toggleGameInfo;
window.toggleAccountDetailsPanel = toggleAccountDetailsPanel;