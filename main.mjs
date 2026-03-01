console.log('script connected');
/**************************************************************/
// Base written by Wilfred Leicester, Term 2 2025, edited and changed throughout in 2026
/**************************************************************/

import { fb_initialise, fb_authenticate, fb_logout, fb_read, fb_write, fb_update, fb_readSorted, fb_delete, changeName, getAuth } from './fb.mjs';

if (sessionStorage.getItem('UID') == null) {
    document.getElementById('loginBlur').style.display = "block";
}


async function updateStatus() {
	if (sessionStorage.getItem('UID') != null) {
		//Logged in
		document.getElementById('DisplayName').style = "Display: block;"
		
		document.getElementById('LogButton').innerHTML = "Log Out";
		document.getElementById('logStatus').innerHTML = "Logged in";
		
		document.getElementById('SettingsButton').style = "Display: block;"
		

		document.getElementById('DisplayName').innerHTML = "Display Name: " + await fb_read("UserData/" + sessionStorage.getItem('UID') + "/userName");

		document.getElementById('loginBox').querySelector('img').src = `${fb_getAuthData().currentUser.photoURL}`;
	} else {
		//Not logged in
		console.log('not logged in');
		document.getElementById('LogButton').innerHTML = "Log In";
		document.getElementById('logStatus').innerHTML = "Not logged in";

		document.getElementById('DisplayName').style = "Display: none;"
		document.getElementById('SettingsButton').style = "Display: none;"

		document.getElementById('loginBox').querySelector('img').src = "./Assets/Images/notLoggedIn.png";
	}
}


window.fb_initialise = fb_initialise;
window.fb_authenticate = fb_authenticate;
window.fb_logout = fb_logout;
window.fb_read = fb_read;
window.fb_write = fb_write;
window.fb_update = fb_update;
window.fb_readSorted = fb_readSorted;
window.fb_delete = fb_delete;

async function changeDisplayName() {
	var newName = await changeName(false);

	if (newName != null) {
		updateStatus();
	}
}


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
        if (await fb_read('Users/' + (await fb_authenticate()).user.uid) == null) {
            alert("user doesn't exist");
            return;
        }
    }
    
    var auth = getAuth();
    console.log(auth);
    console.log('logged in as ' + auth.currentUser.displayName);
    document.getElementById('loginBlur').style.display = "none";
    sessionStorage.setItem('UID', auth.currentUser.UID);

    const pfp = getAuth().currentUser.photoURL;
    document.querySelector(".AccountSettingsButton").querySelector('img').src = pfp;

    document.getElementById("settingsPhoto").src = pfp;
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
    var userData = {
        admin: false
    }

    const fields = document.getElementById('fields').children;
    for (let i = 0; i < fields.length-1; i++) {
        let field = fields[i];
        console.log(field);
        console.log(field.id);
        userData[field.id] = field.querySelector('input').value;
    }


    const AUTH = getAuth();

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
}

window.createAccount = createAccount;
window.register = register;
window.logOut = logOut;
window.login = login;
window.toggleSettings = toggleSettings;
window.changeDisplayName = changeDisplayName;