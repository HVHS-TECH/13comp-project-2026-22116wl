console.log('script connected');
/**************************************************************/
// Base written by Wilfred Leicester, Term 2 2025, edited and changed throughout in 2026
/**************************************************************/

import { fb_authenticate, fb_read, fb_write, getAuth } from './fb.mjs';
import { setName, deleteAccount, logOut } from "./accountFunctions.mjs";


// Function to toggle the account settings panel popout
function toggleSettings() {
    const panel = document.querySelector('.AccountSettings');

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

    if (goingOut == false) {
        setTimeout(function() {
            panel.style.display = 'none';
        }, DURATION);
    }
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
    
    // had to used timeout because getAuth() has a weird problem
    setTimeout(async function() {
        var auth = await getAuth();
        const UID = auth.currentUser.uid;
        
        
        console.log('logged in as ' + auth.currentUser.displayName);
        const pfp = getAuth().currentUser.photoURL;
        document.getElementById("accountSettingsButton").querySelector('img').src = pfp;
        
        
        document.getElementById("settingsPhoto").src = pfp;

        var userData = await fb_read("/Users/" + UID);
        document.getElementById("nameChangeBox").querySelector('input').value = userData.displayName;
        
        if (await fb_read('/admins/' + UID) != null) {
            document.getElementById('adminButton').style.display = 'block';
        }

    }, 1000);
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

    let registrationEligibility = checkRegistrationEligibility(UID);

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

    //set display name input box default as google display name (for convenience)
    document.getElementById('displayName').querySelector('input').value = auth.user.displayName;

}

//create the account in firebase
async function createAccount() {
    const AUTH = getAuth();

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


// 
async function changeNameClicked() {
    document.getElementById('nameChangeBox').querySelector('input').focus();
}



async function isUserLoggedIn() {
    console.log(sessionStorage.getItem("UID"));
    if (sessionStorage.getItem('UID') != null) {
        console.log('logged in');
        return(true);
    } else {
        return(false);
    }
}



// functions to run and listners to create when the page loads
async function pageLoad() {
    document.getElementById('nameChangeBox').querySelector('input').addEventListener('focusout', () => {
        let newName = document.getElementById('nameChangeBox').querySelector('input').value;
        setName(sessionStorage.getItem('UID'), newName);
    });
    
    document.onkeypress = function (event) {
        if (event.key == "Enter") {
            document.getElementById('nameChangeBox').querySelector('input').blur();
        }
    };


    // add links to and configure each game on the home page
    const elements = document.getElementsByClassName('gameIcon'); 
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        
        element.addEventListener("click", () => {
            sessionStorage.setItem('game', element.id);
        });

        element.querySelector("img").src = "./Games/" + element.id + "/Icon.png";

        const metaData = await import(`./Games/${element.id}/gameMetaData.mjs`);
        element.querySelector(".gameName").innerHTML = metaData.gameName;
    }
    
    if (await isUserLoggedIn()) {
        console.log('logged in function');
        login(false); //log in without asking for authentication
    } else {
        document.getElementById('loginBlur').style.display = "block"; // hide side by putting up blur
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