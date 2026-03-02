import { fb_initialise, fb_authenticate, fb_logout, fb_read, fb_write, fb_update, fb_readSorted, fb_delete, getAuth } from './fb.mjs';

console.log('connected');
var users = fb_read("/Users/");
for (let i in users) {
    let user = users[i];

    console.log(user);
    var userEntry = document.createElement('div');
}