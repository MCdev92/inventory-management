import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyD_u6VzmlfP-dO5ZN4LrVvSLjpL7aNuJFE",
    authDomain: "inventory-management-fa4d3.firebaseapp.com",
    projectId: "inventory-management-fa4d3",
    storageBucket: "inventory-management-fa4d3.appspot.com",
    messagingSenderId: "559938537554",
    appId: "1:559938537554:web:038460cb4df76ccd59b78b",
    measurementId: "G-XM2JS4YSS3"
  };
  
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);
export { firestore, storage};