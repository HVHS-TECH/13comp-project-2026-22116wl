//**************************************************************/
// fb_io.mjs
// Generalised firebase routines
// Written by Wilfred Leicester, Term 2 2025
//
// All variables & function begin with fb_  all const with FB_
// Diagnostic code lines have a comment appended to them //DIAG
/**************************************************************/


import { initializeApp }        from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, runTransaction, set, get, ref, update, query, orderByChild, limitToFirst, limitToLast, onChildChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

    
// fb_initialise()
// Called by html INITIALISE button
// initialise
// Input:  n/a
// Return: n/a

var fb_db;

function fb_initialise() {
    const FB_GAMECONFIG = {
        apiKey: "AIzaSyCwPcoDMGchHrJSuN_CWiQciiIJcnhYJVE",
        authDomain: "comp-2025-wilfred-leices-a7207.firebaseapp.com",
        databaseURL: "https://comp-2025-wilfred-leices-a7207-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "comp-2025-wilfred-leices-a7207",
        storageBucket: "comp-2025-wilfred-leices-a7207.firebasestorage.app",
        messagingSenderId: "155933616174",
        appId: "1:155933616174:web:78589529167648f04f97bf"
    };

    fb_db = getDatabase(initializeApp(FB_GAMECONFIG));
    console.info(fb_db);
}

fb_initialise();

async function fb_authenticate() {
    const AUTH = getAuth();
    const PROVIDER = new GoogleAuthProvider();
    
    // The following makes Google ask the user to select the account

    return new Promise((resolve) => {
        (async () => {

            PROVIDER.setCustomParameters({
                prompt: 'select_account'
            });
            
            var userData;
    
            try {
                const result = await signInWithPopup(AUTH, PROVIDER);
    
                const UID = result.user.uid;
                
                
                var userExists = await fb_read("UserData/" + UID);
                
                if(userExists == null) {
                    //Create new Account

                    //Add entry for this user in userData table
                    fb_write("UserData/" + UID, 
                        {
                            userName: "",
                            fullName: result.user.displayName, //private info, just so i know who's who
                        }
                    )
        
                    //Add entry for this user is all leaderboards
                    
                    Object.keys(await fb_read('Leaderboard')).forEach(game => {
                        fb_write("Leaderboard/" + game + "/" + UID, { Score: 0 } )
                    });
                    
                    changeName(true);
                }

                resolve(result);
    
            } catch (error) {
                console.log('error!');
                console.log(error);
                resolve(null);
    
            }

        })();


        /*
        signInWithPopup(AUTH, PROVIDER).then((result) => {    
            resolve(result);
        })
        
        .catch((error) => {
            
        });
        */

    });
}

async function changeName(mandatory) {
    return new Promise((resolve) => {
        (async () => {
            var newName = prompt("What do you want your display name to be?");
            if (newName != null && newName != "" && newName != " ") {
                await fb_write("UserData/" + sessionStorage.getItem('UID') + "/userName", newName);
                resolve(newName);
            } else {
                //user didn't set name
    
                if (mandatory) {
                    //resolve user's google name
                    const newName = getAuth().currentUser.displayName;
                    
                    await fb_write("UserData/" + sessionStorage.getItem('UID') + "/userName", newName);
                    resolve(newName);

                } else {
                    resolve(null);
                }
            }
        })();
    });
}

function fb_authChanged() {
    const AUTH = getAuth();

    onAuthStateChanged(AUTH, (user) => {
        if (user) {
            console.log(AUTH.currentUser.displayName + ' logged in');
            sessionStorage.setItem('UID', AUTH.currentUser.uid);
        } else {
            console.log('log out');
            sessionStorage.removeItem('UID');
        }
    }, (error) => {
        console.log('error!');
        console.log(error);
    });
}
fb_authChanged();

function fb_logout() {
    const AUTH = getAuth();

    return new Promise((resolve) => {
        signOut(AUTH).then(() => {
            resolve(true);
            console.log('successful logout');
        })
    
        .catch((error) => {
            resolve(null);
            console.log('error in loging out');
            console.log(error);
        });
    });
}

function fb_write(path, data) {
    const REF = ref(fb_db, path);

    return new Promise((resolve) => {
        set(REF, data).then(() => {
            console.log('written successfully!');
            resolve(true);
        }).catch((error) => {
            console.log('error');
            console.log(error);
            resolve(false);
        });
    });
}

function fb_delete(data) {
    const CONFIG = {
        apiKey: "AIzaSyBNDhyKyF4h86o_xE3AY_e51-vB6gAUX1g",
        authDomain: "comp-2025-joshua-k-h.firebaseapp.com",
        databaseURL: "https://comp-2025-joshua-k-h-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "comp-2025-joshua-k-h",
        storageBucket: "comp-2025-joshua-k-h.firebasestorage.app",
        messagingSenderId: "695585659485",
        appId: "1:695585659485:web:a965ad296454cd022f0bb4",
        measurementId: "G-BZX0JJYC05"
    };

    var db = getDatabase(initializeApp(CONFIG));
    
    set(ref(db, "/"), data).then(() => {
        console.log('written successfully!');
    }).catch((error) => {
        console.log('error');
        console.log(error);
    });
}

async function fb_read(path) {
    const REF = ref(fb_db, path);

    return new Promise((resolve) => {
        get(REF).then((snapshot) => {
            var fb_data = snapshot.val();
    
            if (fb_data != null) {
                resolve(fb_data);
            } else {
                console.log('no data found');
                resolve(null);
            }
    
        }).catch((error) => {
            console.log('error in reading database');
            resolve(null);
        });
    });


}

function fb_update(path, data) {
    console.log("UPDATED IT WORKS");
    const REF = ref(fb_db, path);

    runTransaction(REF, (currentValue) => {
        return (currentValue || 0) + data;
    });

    /*
    update(REF, data).then(() => {
        console.log('updated successfully')
    }).catch((error) => {
        console.log('error');
        console.log(error);
    });
    */
}


async function fb_readSorted(path, sortkey, number) {
    const dbReference = ref(fb_db, path) ;
    
    return new Promise((resolve) => {
        get(query(dbReference, orderByChild(sortkey), limitToLast(number))).then((snapshot) => {
            var fb_data = snapshot.val();
            
            if (fb_data != null) {
                //const LENGTH = Object.keys(snapshot.val()).length
                
                //put the values into array format
                var valueArray = [];
                snapshot.forEach((entry) => {
                    
                    const valObject = {
                      [entry.key]: entry.val()[sortkey]
                    };
                    
                    valueArray.unshift( valObject ); //unshift used to put values at start of array and move everythign else forward (reversing the array which is given backwards by firebase)
                });

                console.log('successful read');
                resolve(valueArray);
            } else {
                console.log('no data found');
                resolve(null);
            }
        }).catch((error) => {
            console.log('error!');
            console.log(error);
            resolve(null);
        });
    });
}

async function fb_valChanged(path, callback) {
    const dbReference = ref(fb_db, path);
    console.log(path);
    
    onChildChanged(dbReference, (snapshot) => {
        /*
        const newScore = snapshot.val();
        const playerKey = snapshot.key;
        */

        callback(snapshot.key);
    });
}

async function changeLog() {
	if (sessionStorage.getItem('UID') == null) {
        return new Promise((resolve) => {
            (async () => {
                const userData = await fb_authenticate();
                resolve (userData);
            })();
        });
	} else {
        return new Promise((resolve) => {
            (async () => {
                const logOut = await fb_logout();
                resolve (logOut);
            })();
        });
	}
}

function fb_getAuthData() {
    return getAuth();
}

export { fb_initialise, fb_authenticate, fb_authChanged, fb_logout, fb_write, fb_read, fb_update, fb_readSorted, fb_delete, fb_valChanged, changeName, changeLog, fb_getAuthData };