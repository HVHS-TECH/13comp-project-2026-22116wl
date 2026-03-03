import { fb_write, fb_read , fb_logout } from "./fb.mjs";

async function setName(UID, name) {
    //when changing another user's name as an admin they can pass in a UID to 
    if (UID == null) {
        UID = sessionStorage.getItem('UID');
        name = document.getElementById('nameChangeBox').querySelector('input').value;
    }
    
    if (name == "") {
        alert('enter a name');
        return;
    }
    
    
    var leaderboards = await fb_read("/Leaderboards/");
    for (let game in leaderboards) {
        if (leaderboards[game][UID] != null) {
            fb_write("/Leaderboards/" + game + "/" + UID + "/displayName", name);
        }
    }    

    fb_write('/Users/' + UID + '/displayName', name);
}

async function logOut() {
    fb_logout();
    
    document.querySelector('.AccountSettings').style.right = "-500px";
    document.querySelector('.AccountSettings').style.display = "none";
    document.getElementById('loginBlur').style.display = 'block';
    
    document.getElementById('loginBlur').style.display = 'block';
    document.getElementById('landing').style.display = 'block';
    document.getElementById('registration').style.display = 'none';

    document.getElementById('adminButton').style.display = "none";

    document.getElementById('accountSettingsButton').querySelector('img').src = "./Assets/Images/notLoggedIn.png/";
}


async function deleteAccount(UID, _prompt) {
    if (_prompt != false) {
        var _delete = prompt('Delete Account?');
        if (_delete == null) {
            return;
        }
    }

    console.log(UID);
    

    //if deleting self then log out
    if (UID == sessionStorage.getItem('UID')) {
        logOut();
        console.log('deleting self');

        sessionStorage.removeItem('UID');
        setTimeout(function() {
            window.location.href = "./index.html";
        }, 1000)
    }
    
    var leaderboards = await fb_read("/Leaderboards/");
    for (let game in leaderboards) {
        if (leaderboards[game][UID] != null) {
            fb_write("/Leaderboards/" + game + "/" + UID, null);
        }
    }    
    
    fb_write("/Users/" + UID, null);

    //For if an admin is calling this function on someone else
    sessionStorage.removeItem('focusedUser');
}

async function banAccount(UID) {
    var _delete = prompt('Permenantly Ban This Account?');
    if (_delete == null) {
        return;
    }

    deleteAccount(UID, false);
    fb_write('/bannedUsers/' + UID, true);

    //For if an admin is calling this function on someone else
    sessionStorage.removeItem('focusedUser');
}

export { setName, deleteAccount, banAccount, logOut };