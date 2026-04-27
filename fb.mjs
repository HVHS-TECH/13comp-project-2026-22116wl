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
import { getDatabase, runTransaction, set, get, ref, update, query, orderByChild, push, limitToFirst, limitToLast, onChildChanged, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

    
// fb_initialise()
// Called by html INITIALISE button
// initialise
// Input:  n/a
// Return: n/a

var fb_db;

function fb_initialise() {
    const FB_GAMECONFIG = {
        apiKey: "AIzaSyAPgOrTqFKRwGkedGxXf68FSJQgfErC3Ro",
        authDomain: "comp-2026-wilfred-leicester.firebaseapp.com",
        databaseURL: "https://comp-2026-wilfred-leicester-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "comp-2026-wilfred-leicester",
        storageBucket: "comp-2026-wilfred-leicester.firebasestorage.app",
        messagingSenderId: "668140603656",
        appId: "1:668140603656:web:92072c21dead83ab8e04bd",
        measurementId: "G-4ZQ93WGTXY"
    };

    fb_db = getDatabase(initializeApp(FB_GAMECONFIG));
    console.info(fb_db);
}

fb_initialise();

async function fb_authenticate() {
    const AUTH = getAuth();
    const PROVIDER = new GoogleAuthProvider();
    
    // The following makes Google ask the user to select the account

    return new Promise(async (resolve) => {
        PROVIDER.setCustomParameters({
            prompt: 'select_account'
        });

        try {
            const result = await signInWithPopup(AUTH, PROVIDER);
            const UID = result.user.uid;
            resolve(result);

        } catch (error) {
            console.log('error!');
            console.log(error);
            resolve(null);

        }
    });
}



function fb_authChanged() {
    const AUTH = getAuth();
    onAuthStateChanged(AUTH, (user) => {
        if (user) {
            //sessionStorage.setItem("UID", AUTH.currentUser.uid);
        } else {    
            //sessionStorage.removeItem("UID");
        }
    }, (error) => {
        console.log('error with log changed');
        console.log(error);
    });
}

fb_authChanged();




function fb_logout() {
    const AUTH = getAuth();

    return new Promise((resolve) => {
        signOut(AUTH).then(() => {
            console.log('successful logout');
            sessionStorage.removeItem('UID');
            resolve(true);
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
            console.log(error);
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


async function fb_readSorted(path, sortkey) {
    const dbReference = ref(fb_db, path) ;
    
    return new Promise((resolve) => {
        get(query(dbReference, orderByChild(sortkey))).then((snapshot) => {
            var fb_data = snapshot.val();
            
            if (fb_data != null) {

                //put the values into array format
                var valueArray = [];
                snapshot.forEach((entry) => {
                    
                    const valObject = {
                      [entry.key]: entry.val()
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

// Run a function whenevr a value changes in the DB
// path = /path/to/value - the value it detects a change under
// callback = function to run upon change
async function fb_valChanged(path, callback, orderKey = null) {
    var _query;
    if (orderKey == null) {
        _query = ref(fb_db, path);
    } else {
        _query = query(ref(fb_db, path), orderByChild(orderKey), limitToLast(500));
    }
    
    onValue(_query, (snapshot) => {
        const DATA = snapshot.val();

        if (DATA != null) {
            callback(DATA);
        }
    });
}



export { fb_initialise, fb_authenticate, fb_logout, fb_write, fb_read, fb_update, fb_readSorted, fb_delete, fb_valChanged, getAuth };