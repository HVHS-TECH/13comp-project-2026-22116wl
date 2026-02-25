console.log('script connected');
/**************************************************************/
// Base written by Wilfred Leicester, Term 2 2025, edited and changed throughout in 2026
/**************************************************************/

import { fb_initialise, fb_authenticate, fb_logout, fb_read, fb_write, fb_update, fb_readSorted, fb_delete, changeName, changeLog, fb_getAuthData } from './fb.mjs';


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

updateStatus();

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

//If logged in, log out. If logged out, log in.

async function logChange() {
	const userInfo = await changeLog();
	updateStatus();
}

window.logChange = logChange;
window.changeDisplayName = changeDisplayName;