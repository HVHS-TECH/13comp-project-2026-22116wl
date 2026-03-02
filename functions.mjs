import { fb_write, fb_read } from "./fb.mjs";

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

export { setName };