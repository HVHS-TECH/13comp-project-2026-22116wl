/****** 
 * Written by Wilfred Leicester 2026
 * This module contains functions relating to user accounts and registration on the site
******/

import { fb_write, fb_read , fb_logout } from "./fb.mjs";


function isNameInvalid(name) {
    if (name.length < 3) {
        return true; 
    }

    return false;
}



// If the user loads a page from a link that is not the homepage, redirect them
// Function is called at the start of each JS file for a page on eahc page other than index
function redirectToIndex() {
    if (sessionStorage.getItem('UID') == null) {
        window.location.href = "../index.html";
    }
}

// Change the users display name in the database
// UID = users who's name is being changed
// name = user's new name
async function setName(UID, name) {

    if (isNameInvalid(name)) {
        alert('Name cannot be less than 3 characters');
        return;
    }
    
    
    // Change display name leaderboard entires in all games for this user
    var leaderboards = await fb_read("/Leaderboards/");
    for (let game in leaderboards) {
        if (leaderboards[game][UID] != null) {
            fb_write("/Leaderboards/" + game + "/" + UID + "/displayName", name);
        }
    }

    // Change display name for any lobbies player might be in
    var lobbies = await fb_read("/Lobbies/");
    for (let game in lobbies) {
        if (game == 'placeholder') { continue; } //skip the placeholder

        for (let lobbyUID in lobbies[game]) {
            let lobby = lobbies[game][lobbyUID];
            
            //loop through each player in the lobby
            for (let playeri in lobby.players) {
                if (lobby.players[playeri].UID == UID) {
                    fb_write("/Lobbies/" + game + "/" + lobbyUID + "/players/" + playeri + "/displayName", name);
                }
            }
        }
    }

    fb_write('/Users/' + UID + '/displayName', name);
}


// Log the user out of their google auth, and reconfigure the user interface to a logged out state
async function logOut() {
    await fb_logout();
    console.log('logging out');

    sessionStorage.removeItem('UID');

    document.querySelector('.AccountSettings').style.right = "-500px";
    document.querySelector('.AccountSettings').style.display = "none";
    
    document.getElementById('loginBlur').style.display = 'block';
    document.getElementById('landing').style.display = 'block';
    document.getElementById('registration').style.display = 'none';

    document.getElementById('adminButton').style.display = "none";

    document.getElementById('accountSettingsButton').querySelector('img').src = "./Assets/Images/notLoggedIn.png/";
}


// Delete a user's account from the databse
// UID = ID of the player to be deleted
// _prompt = true/false of whether the website should prompt them "Are you sure?"
async function deleteAccount(UID, _prompt) {
    if (_prompt != false) {
        var _delete = prompt('Delete Account?');
        if (_delete == null) {
            return;
        }
    }

    console.log(UID);
    
    //If an admin is calling this function (For Admin page UI)
    sessionStorage.removeItem('focusedUser');    
    
    // Delete all leaderboard entires of this user for each game
    var leaderboards = await fb_read("/Leaderboards/");
    for (let game in leaderboards) {
        if (leaderboards[game][UID] != null) {
            fb_write("/Leaderboards/" + game + "/" + UID, null);
        }
    }    
    
    await fb_write("/Users/" + UID, null);
    
    
    //if deleting OWN account, then log out
    if (UID == sessionStorage.getItem('UID')) {
        logOut();
        window.location.href = "./index.html";
        console.log('deleting self');
    }
}


// Add this user to list of banned users
// UID = User to ban
async function banAccount(UID) {

    // Double check whether to go ahead
    if (prompt('Permenantly Ban This Account?') == null) {
        return;
    }

    sessionStorage.removeItem('focusedUser'); //For if an admin is calling this function on someone else

    await deleteAccount(UID, false);
    await fb_write('/bannedUsers/' + UID, true);
}

export { setName, deleteAccount, banAccount, logOut, redirectToIndex };