import { fb_initialise, fb_authenticate, fb_logout, fb_read, fb_write, fb_update, fb_readSorted, fb_delete, getAuth, valChanged } from './fb.mjs';
import { setName } from './functions.mjs';

console.log('connected');

//this function also runs on page load (don't know why but it saves me having to call it on two separate occasions)
//draw in the list of all users
await valChanged("/Users/", function(users) {
    const template = document.getElementById('template');
    
    document.getElementById('scrollingUserList').innerHTML = "";

    for (let i in users) {
        let user = users[i][1];
        let UID = users[i][0];
        
        var userEntry = template.cloneNode(true);
        userEntry.querySelector('p').innerHTML = user.displayName;
        userEntry.querySelector('img').src = user.pfp;
        document.getElementById('scrollingUserList').appendChild(userEntry);
        userEntry.style.display = "block";

        userEntry.id = UID;
    }
    
    console.log(getAuth().currentUser.photoURL);
    
    //document.getElementById('currentScore').innerHTML = score;
});


async function focusUser(UID) {
    var userData = await fb_read('/Users/' + UID);

    sessionStorage.setItem('focusedUser', UID);

    document.getElementById('adminUserSettings').querySelector('img').src = userData.pfp;
    document.getElementById('adminUserSettings').querySelector('h2').innerHTML = userData.displayName;
    document.getElementById('adminNameChangeBox').querySelector('input').value = userData.displayName;

}



document.getElementById('adminNameChangeBox').querySelector('input').addEventListener('focusout', (event) => {
    var UID = sessionStorage.getItem('focusedUser');
    var newName = document.getElementById('adminNameChangeBox').querySelector('input').value;

    setName(UID, newName);
});

document.onkeypress = function (event) {
    if (event.key == "Enter") {
        document.getElementById('adminNameChangeBox').querySelector('input').blur();
    }
};

async function changeName() {
    document.getElementById('adminNameChangeBox').querySelector('input').focus();
}

setTimeout(function() {
    console.log(sessionStorage.getItem('focusedUser'));

    if (sessionStorage.getItem('focusedUser') == null) {
        focusUser(document.getElementById('scrollingUserList').querySelector('button').id);
    } else {
        focusUser(sessionStorage.getItem('focusedUser'));
    }

    document.getElementById('adminUserSettings').style.display = "block";
}, 1100);

window.changeName = changeName;
window.focusUser = focusUser;