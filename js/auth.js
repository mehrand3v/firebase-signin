// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// DOM elements
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const message = document.getElementById("message");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const adminPanel = document.getElementById("adminPanel");
const userSignInForm = document.getElementById("userSignInForm");

// Initially hide all elements
signOutButton.style.display = "none";
message.style.display = "none";
adminPanel.style.display = "none";
userSignInForm.style.display = "none";

const checkIfAdmin = async (email) => {
  const adminRef = collection(db, "admins");
  const q = query(adminRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

const userSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const isAdmin = await checkIfAdmin(user.email);

    // Hide sign in button after successful sign in
    signInButton.style.display = "none";

    if (isAdmin) {
      adminPanel.style.display = "block";
      userSignInForm.style.display = "none";
    } else {
      adminPanel.style.display = "none";
      userSignInForm.style.display = "block";
    }
  } catch (error) {
    console.error("Error during sign-in:", error);
    alert("Error during sign-in: " + error.message);
  }
};

const userSignOut = async () => {
  try {
    await signOut(auth);
    alert("You have signed out successfully!");
    // Reset all elements visibility
    signInButton.style.display = "block";
    signOutButton.style.display = "none";
    message.style.display = "none";
    adminPanel.style.display = "none";
    userSignInForm.style.display = "none";
  } catch (error) {
    console.error("Error during sign-out:", error);
    alert("Error during sign-out: " + error.message);
  }
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in
    signInButton.style.display = "none"; // Hide sign in button
    signOutButton.style.display = "block";
    message.style.display = "block";
    userName.textContent = user.displayName;
    userEmail.textContent = user.email;

    const isAdmin = await checkIfAdmin(user.email);
    if (isAdmin) {
      adminPanel.style.display = "block";
      userSignInForm.style.display = "none";
    } else {
      adminPanel.style.display = "none";
      userSignInForm.style.display = "block";
    }
  } else {
    // User is signed out
    signInButton.style.display = "block";
    signOutButton.style.display = "none";
    message.style.display = "none";
    adminPanel.style.display = "none";
    userSignInForm.style.display = "none";
  }
});

signInButton.addEventListener("click", userSignIn);
signOutButton.addEventListener("click", userSignOut);
