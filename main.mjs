console.log('script connected');
/**************************************************************/
// Base written by Wilfred Leicester, Term 2 2025, edited and changed throughout in 2026
/**************************************************************/

import { fb_initialise, fb_authenticate, fb_logout, fb_read, fb_write, fb_update, fb_readSorted, fb_delete, getAuth } from './fb.mjs';

console.log(sessionStorage.getItem("UID"));
if (sessionStorage.getItem('UID') != null) {
    login(false);
} else {
    document.getElementById('loginBlur').style.display = "block";
}




window.fb_initialise = fb_initialise;
window.fb_authenticate = fb_authenticate;
window.fb_logout = fb_logout;
window.fb_read = fb_read;
window.fb_write = fb_write;
window.fb_update = fb_update;
window.fb_readSorted = fb_readSorted;
window.fb_delete = fb_delete;

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
    
    //used timeout because auth has a weird problem
    setTimeout(async function() {
        var auth = await getAuth();
        const UID = auth.currentUser.uid;
        
        console.log('logged in as ' + auth.currentUser.displayName);
        const pfp = getAuth().currentUser.photoURL;
        document.getElementById("accountSettingsButton").querySelector('img').src = pfp;
    
        document.getElementById("settingsPhoto").src = pfp;
        document.getElementById("nameChangeBox").querySelector('input').value = await fb_read("/Users/" + UID + '/displayName');

    }, 1000);
}

async function register() {
    console.log('ran')
    var auth = await fb_authenticate();
    
    if (await fb_read("Users/" + auth.user.uid) != null) {
        alert("User already exists!");
        return;
    }

    document.getElementById('landing').style.display = "none";
    document.getElementById('registration').style.display = "block";

    document.getElementById('displayName').querySelector('input').value = auth.user.displayName;

}

async function createAccount() {
    const AUTH = getAuth();
    
    console.log(AUTH);

    var userData = {
        admin: false,
        realName: AUTH.currentUser.displayName,
        email: AUTH.currentUser.email
    }

    const fields = document.getElementById('fields').children;
    for (let i = 0; i < fields.length-1; i++) {
        let field = fields[i];
        console.log(field);
        console.log(field.id);
        userData[field.id] = field.querySelector('input').value;
    }

    //Create User in DB
    fb_write("Users/" + AUTH.currentUser.uid, userData);

    //enter site
    login(false);
}


async function logOut() {
    fb_logout();
    
    document.querySelector('.AccountSettings').style.right = "-500px";
    document.querySelector('.AccountSettings').style.display = "none";
    document.getElementById('loginBlur').style.display = 'block';
    
    document.getElementById('loginBlur').style.display = 'block';
    document.getElementById('landing').style.display = 'block';
    document.getElementById('registration').style.display = 'none';

    document.getElementById('accountSettingsButton').querySelector('img').src = "./Assets/Images/notLoggedIn.png/";
}


async function deleteAccount() {
    var _delete = prompt('Delete Account?');
    if (_delete == null) {
        return;
    }

    const UID = sessionStorage.getItem('UID');
    console.log(UID);
    logOut();

    var leaderboards = await fb_read("/Leaderboards/");
    for (let game in leaderboards) {
        if (leaderboards[game][UID] != null) {
            fb_write("/Leaderboards/" + game + "/" + UID, null);
        }
    }    

    fb_write("/Users/" + UID, null);
    
}

async function setName() {
    var newName = document.getElementById('nameChangeBox').querySelector('input').value;
    if (newName == "") {
        alert('enter a name');
        return;
    }
    
    var UID = sessionStorage.getItem('UID');
    
    var leaderboards = await fb_read("/Leaderboards/");
    for (let game in leaderboards) {
        if (leaderboards[game][UID] != null) {
            fb_write("/Leaderboards/" + game + "/" + UID + "/displayName", newName);
        }
    }    

    fb_write('/Users/' + UID + '/displayName', newName);
}


document.getElementById('nameChangeBox').querySelector('input').addEventListener('focusout', (event) => {
    setName();
});

document.onkeypress = function (event) {
    if (event.key == "Enter") {
        document.getElementById('nameChangeBox').querySelector('input').blur();
    }
};

async function changeName() {
    document.getElementById('nameChangeBox').querySelector('input').focus();
}


window.createAccount = createAccount;
window.deleteAccount = deleteAccount;
window.changeName = changeName;
window.register = register;
window.logOut = logOut;
window.login = login;
window.toggleSettings = toggleSettings;