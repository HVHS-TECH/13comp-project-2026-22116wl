console.log('script connected');
/**************************************************************/
// Some code written by Wilfred Leicester - Term 2 2025, majorly edited and changed throughout in 2026
/**************************************************************/

import { fb_authenticate, fb_read, fb_write, getAuth } from './fb.mjs';
import { setName, deleteAccount, logOut } from "./accountFunctions.mjs";


// Function to toggle the account settings panel popout
function toggleSettings() {
    const panel = document.querySelector('.AccountSettings');

    // true or false to determine whether or not we are showing or hiding the panle
    // if the display is set to none then is hidden and we are showing
    var goingOut = panel.style.display == "none"
    if (goingOut == true) {
        panel.style.display = "block";
    }


    const DURATION = 90;

    var keyframes;
    if (goingOut == true) {
        keyframes = [
            { right: "-" + panel.offsetWidth + "px" },
            { right: "0px" }
        ]
    } else {
        keyframes = [
            { right: "0px" },
            { right: "-" + panel.offsetWidth + "px" }
        ]
    } 

    panel.animate(keyframes, {
        duration: DURATION,
        iterations: 1,
        fill: 'forwards'
    })

    // if going in then hide panel after finishing the animation
    if (goingOut == false) {
        setTimeout(function() {
            panel.style.display = 'none';
        }, DURATION);
    }
}


// Verify the user inputs on the registration page
function verifyRegistration() {
    var valid = true; //Assume true unless invalid
    
    // Username
    let userName = document.getElementById('displayName').querySelector('input');
    if ( userName.value == "" ) {
        userName.placeholder = "Please enter a valid username"
        userName.value = ""
        valid = false;
    }


    // Mother Maiden Name
    let motherName  = document.getElementById('motherMaidenName').querySelector('input');
    if ( motherName.value == "" ) {
        motherName.placeholder = "Please enter a valid name"
        motherName.value = ""
        valid = false;
    }


    // First Pet
    let pet = document.getElementById('firstPet').querySelector('input')
    if ( pet.value == "" ) {
        pet.placeholder = "Please enter a valid name"
        pet.value = ""
        valid = false;
    }


    // Card Number
    let cardNumberInp = document.getElementById('cardNumber').querySelector('input');
    let cardNumber = cardNumberInp.value.replaceAll(' ', "");
    if ( isNaN(Number(cardNumber)) || (cardNumber.length != 16)) {
        cardNumberInp.placeholder = "Please enter a valid card number"
        cardNumberInp.value = ""
        valid = false;
    }


    // Expiration
    let expiration = document.getElementById('expiration').querySelector('input');
    if ( expiration.value .includes ("/") == false || expiration.value.length != 5 ) {
        expiration.placeholder = "Please enter a date in MM/YY format"
        expiration.value = ""
        valid = false;
    } else {
        // split date into year and month
        const DATES = expiration.value.split("/");

        // one of the dates are not a number
        for (let i in DATES) {
            if ( isNaN(Number(DATES[i])) || DATES[i].length != 2 ) {
                valid = false;
                expiration.placeholder = "Please enter a valid date (MM/YY)";
                expiration.value = "";
            }
        }


        
        // Year is invalid
        if ( Number(DATES[1]) < 26) {
            valid = false;
            expiration.placeholder = "Year cannot be in the past (MM/YY)";
            expiration.value = "";
        }


        // Month is invalid
        if ( Number(DATES[0]) < 1 || Number(DATES[0]) > 12) {
            valid = false;
            expiration.placeholder = "Please enter a valid month (MM/YY)";
            expiration.value = "";
        }

    }
    

    // CVV
    let CVV = document.getElementById('CVV').querySelector('input');
    if ( isNaN(Number(CVV.value)) || CVV.value.length != 3 ) {
        document.getElementById('CVV').querySelector('input').placeholder = "Please enter a valid CVV"
        CVV.value = "";
        valid = false;
    }

    // Pin
    let pin = document.getElementById('pin').querySelector('input');
    if ( isNaN(Number(pin.value)) || pin.value.length != 4 ) {
        pin.placeholder = "Please enter a valid PIN";
        pin.value = "";
        valid = false;
    }

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
        document.getElementById("nameChangeBox").querySelector('input').value = userData.displayName;
        
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


async function changeNameClicked() {
    document.getElementById('nameChangeBox').querySelector('input').focus();
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
    document.getElementById('nameChangeBox').querySelector('input').addEventListener('focusout', () => {
        let newName = document.getElementById('nameChangeBox').querySelector('input').value;
        setName(sessionStorage.getItem('UID'), newName);
    });
    
    // If player presses enter, unfocus the name change box (to change the name)
    document.onkeypress = function (event) {
        if (event.key == "Enter") {
            document.getElementById('nameChangeBox').querySelector('input').blur();
        }
    };

    // add links to and configure each game on the home page
    document.querySelectorAll('.gameIcon').forEach(async (element) => {
        element.addEventListener("click", () => {
            sessionStorage.setItem('game', element.id);
        });
    
        element.querySelector("img").src = "./Games/" + element.id + "/Icon.png";
    
        const metaData = await import(`./Games/${element.id}/gameMetaData.mjs`);
        element.querySelector(".gameName").innerHTML = metaData.gameName;
    });

    
    document.querySelectorAll('.gameIcon').forEach(async (element) => {
        console.log(element.parentElement);
        element.parentElement.setAttribute("href", "./game.html");
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
window.changeNameClicked = changeNameClicked;
window.register = register;
window.logOut = logOut;
window.login = login;
window.toggleSettings = toggleSettings;
window.toggleAccountDetailsPanel = toggleAccountDetailsPanel;