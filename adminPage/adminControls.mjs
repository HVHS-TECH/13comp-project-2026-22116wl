import { fb_read, fb_write, getAuth, fb_valChanged } from '../fb.mjs';
import { setName, banAccount, deleteAccount, redirectToIndex } from '../accountFunctions.mjs';


async function isUserAdmin(UID) {
    return new Promise((resolve) => {
        (async () => {
            const ADMIN = await fb_read('/admins/' + UID);

            if (ADMIN == true) {
                resolve(true);
            } else {
                resolve(false);
            }
        })();
    });
}


//draw in the list of all users
async function drawUserList(users) {
    const template = document.getElementById('template');
    
    document.getElementById('scrollingUserList').innerHTML = "";
    
    for (let UID in users) {
        let user = users[UID];
        
        var userEntry = template.cloneNode(true);
        
        userEntry.querySelector('p').innerHTML = user.displayName;
        
        userEntry.querySelector('img').src = user.pfp;
        document.getElementById('scrollingUserList').appendChild(userEntry);
        userEntry.style.display = "block";
    
        userEntry.id = UID;
    }
    
    console.log(getAuth().currentUser.photoURL);
    
    //document.getElementById('currentScore').innerHTML = score;
}


// fill in the data on the right half (#adminUserSettings) page to a specific user
async function focusUser(UID) {
    var userData = await fb_read('/Users/' + UID);

    sessionStorage.setItem('focusedUser', UID);

    document.getElementById('adminUserSettings').querySelector('img').src = userData.pfp;
    document.getElementById('adminUserSettings').querySelector('h2').innerHTML = userData.displayName;
    document.getElementById('adminNameChangeBox').querySelector('input').value = userData.displayName;

    if (await fb_read('/admins/' + UID) != null) {
        document.getElementById('isAdmin').style.display = 'block';
    } else {
        document.getElementById('isAdmin').style.display = 'none';
    }
}



async function chooseFocusedUser() {
    console.log(sessionStorage.getItem('focusedUser'));
    if (sessionStorage.getItem('focusedUser') == null) {
        focusUser(document.getElementById('scrollingUserList').querySelector('button').id);
    } else {
        focusUser(sessionStorage.getItem('focusedUser'));
    }
}


//things to run when page first loads
async function pageLoad() {
    redirectToIndex();

    //when data in /users/ changes, redraw list
    
    //this function also runs on page load (don't know why but it saves me having to call it on two separate occasions)
    
    await fb_valChanged("/Users/", drawUserList, 'displayName');


    
    const USER_FOCUS_LOAD_TIMEOUT = 1100;
    
    // when loading the page, choose a user to focus on

    console.log('h3qkejrsnx');
    setTimeout(async () => {
        console.log('h3qkejrsnx213');
        
        const AUTH = await getAuth();
        
        if (AUTH.currentUser == null || await isUserAdmin(AUTH.currentUser.uid) != true) {
            alert('YOU ARE NOT AN ADMIN GET OUT');
            console.log('return');
            window.location.href = "/index.html";
        }


        chooseFocusedUser();
        document.getElementById('adminUserSettings').style.display = "block";
    }, USER_FOCUS_LOAD_TIMEOUT);
    
    
    
    // listener for detecting clicking off (unfocusing) the name inout box - change the user's name
    document.getElementById('adminNameChangeBox').querySelector('input').addEventListener('focusout', (event) => {
        var UID = sessionStorage.getItem('focusedUser');
        var newName = document.getElementById('adminNameChangeBox').querySelector('input').value;
        setName(UID, newName);
    });
    
    
    // listener for when enter pressed - unfocus the name input box
    document.onkeypress = function (event) {
        if (event.key == "Enter") {
            document.getElementById('adminNameChangeBox').querySelector('input').blur();
        }
    };

    // listener for when sesionstorage changed (not working yet)
    window.addEventListener('storage', (event) => {
        console.log(event);
    
        if (event.storageArea == sessionStorage) {
            console.log('session sotrage changed')
            console.log(event.oldValue);
            console.log(event.newValue);
        }
    });
}


async function changeNameClicked() {
    document.getElementById('adminNameChangeBox').querySelector('input').focus();
}
window.changeNameClicked = changeNameClicked;

pageLoad();

window.deleteAccount = deleteAccount;
window.banAccount = banAccount;
window.focusUser = focusUser;