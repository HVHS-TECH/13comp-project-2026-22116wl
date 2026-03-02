import { fb_initialise, fb_authenticate, fb_logout, fb_read, fb_write, fb_update, fb_readSorted, fb_delete, getAuth, valChanged } from './fb.mjs';

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
    }
    
    console.log(getAuth().currentUser.photoURL);
    
    //document.getElementById('currentScore').innerHTML = score;
});