// js/location.js
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

const submitSignInButton = document.getElementById("submitSignIn");
const storeNumberInput = document.getElementById("storeNumberInput");

const MAX_DISTANCE_KM = 0.1; // 100 meters

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

const checkLocationAndSignIn = async (storeNumber, position) => {
    const storesRef = collection(db, "stores");
    const q = query(storesRef, where("storeNumber", "==", storeNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        alert("Invalid store number!");
        return;
    }

    const storeData = querySnapshot.docs[0].data();
    const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        storeData.location.latitude,
        storeData.location.longitude
    );

    if (distance <= MAX_DISTANCE_KM) {
        const user = auth.currentUser;
        await addDoc(collection(db, "signin-records"), {
            fullName: user.displayName,
            storeNumber: storeNumber,
            signedInAt: new Date(),
            location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }
        });
        alert("Successfully signed in!");
    } else {
        alert("You must be within 100 meters of the store to sign in!");
    }
};

submitSignInButton.addEventListener('click', () => {
    const storeNumber = storeNumberInput.value;
    if (!storeNumber) {
        alert("Please enter a store number!");
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => checkLocationAndSignIn(storeNumber, position),
            (error) => alert("Error getting location: " + error.message)
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
});