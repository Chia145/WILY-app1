import * as db from 'firebase';
require('@firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyBvBcmtKRThCJvu9tKyr21AS__iSjCIigw",
    authDomain: "wily-381fb.firebaseapp.com",
    databaseURL: "https://wily-381fb.firebaseio.com",
    projectId: "wily-381fb",
    storageBucket: "wily-381fb.appspot.com",
    messagingSenderId: "668960650316",
    appId: "1:668960650316:web:95c4408927df8ff43030e9"
  };

  // Initialize Firebase
  db.initializeApp(firebaseConfig);

  export default db.firestore();