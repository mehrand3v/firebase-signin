// js/location.js
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

const submitSignInButton = document.getElementById("submitSignIn");
const storeNumberInput = document.getElementById("storeNumberInput");
const locationStatus = document.createElement("div"); // Add status display
locationStatus.id = "locationStatus";
userSignInForm.appendChild(locationStatus);

const MAX_DISTANCE_KM = 0.1; // 100 meters

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Function to update status message
const updateLocationStatus = (message, isError = false) => {
  locationStatus.textContent = message;
  locationStatus.style.color = isError ? "red" : "green";
};

// Function to add a new store location (for admin use)
const addStoreLocation = async (storeNumber, latitude, longitude) => {
  try {
    await addDoc(collection(db, "stores"), {
      storeNumber: storeNumber,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });
    return true;
  } catch (error) {
    console.error("Error adding store location:", error);
    return false;
  }
};

const checkLocationAndSignIn = async (storeNumber, position) => {
  try {
    updateLocationStatus("Checking location...");

    const storesRef = collection(db, "stores");
    const q = query(storesRef, where("storeNumber", "==", storeNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      updateLocationStatus(
        "Invalid store number! Please verify and try again.",
        true
      );
      return;
    }

    const storeData = querySnapshot.docs[0].data();
    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      storeData.location.latitude,
      storeData.location.longitude
    );

    // Show distance for debugging (can be removed in production)
    console.log(`Distance to store: ${(distance * 1000).toFixed(0)} meters`);

    if (distance <= MAX_DISTANCE_KM) {
      const user = auth.currentUser;
      await addDoc(collection(db, "signin-records"), {
        fullName: user.displayName,
        email: user.email,
        storeNumber: storeNumber,
        signedInAt: new Date(),
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        distanceFromStore: distance * 1000, // Store distance in meters
      });
      updateLocationStatus("Successfully signed in!");
      storeNumberInput.value = ""; // Clear input after successful sign-in
    } else {
      const distanceInMeters = Math.round(distance * 1000);
      updateLocationStatus(
        `You are ${distanceInMeters} meters away from the store. Must be within 100 meters to sign in.`,
        true
      );
    }
  } catch (error) {
    console.error("Error during sign-in:", error);
    updateLocationStatus("Error during sign-in: " + error.message, true);
  }
};

// Add this to show loading state and handle errors better
submitSignInButton.addEventListener("click", () => {
  const storeNumber = storeNumberInput.value;
  if (!storeNumber) {
    updateLocationStatus("Please enter a store number!", true);
    return;
  }

  submitSignInButton.disabled = true;
  updateLocationStatus("Getting your location...");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        checkLocationAndSignIn(storeNumber, position).finally(() => {
          submitSignInButton.disabled = false;
        });
      },
      (error) => {
        let errorMessage = "Error getting location: ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              "Location permission denied. Please enable location access in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage +=
              "Location information unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += error.message;
        }
        updateLocationStatus(errorMessage, true);
        submitSignInButton.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    updateLocationStatus("Geolocation is not supported by this browser.", true);
    submitSignInButton.disabled = false;
  }
});
