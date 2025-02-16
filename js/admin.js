import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore();
const recordsList = document.getElementById("recordsList");
const fullNameInput = document.getElementById("fullName");
const storeNumberInput = document.getElementById("storeNumber");
const submitRecordButton = document.getElementById("submitRecord");

let editingId = null;

const loadRecords = async () => {
    const recordsRef = collection(db, "signin-records");
    const querySnapshot = await getDocs(recordsRef);

    recordsList.innerHTML = "";
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const recordDiv = document.createElement("div");
        recordDiv.innerHTML = `
            <p>Name: ${data.fullName} | Store: ${data.storeNumber} | Time: ${data.signedInAt.toDate().toLocaleString()}</p>
            <button onclick="editRecord('${doc.id}', '${data.fullName}', '${data.storeNumber}')">Edit</button>
            <button onclick="deleteRecord('${doc.id}')">Delete</button>
        `;
        recordsList.appendChild(recordDiv);
    });
};

window.editRecord = (id, name, store) => {
    editingId = id;
    fullNameInput.value = name;
    storeNumberInput.value = store;
    submitRecordButton.textContent = "Update Record";
};

window.deleteRecord = async (id) => {
    try {
        await deleteDoc(doc(db, "signin-records", id));
        await loadRecords();
        alert("Record deleted successfully!");
    } catch (error) {
        console.error("Error deleting record:", error);
        alert("Error deleting record: " + error.message);
    }
};

submitRecordButton.addEventListener('click', async () => {
    const recordData = {
        fullName: fullNameInput.value,
        storeNumber: storeNumberInput.value,
        signedInAt: new Date()
    };

    try {
        if (editingId) {
            await updateDoc(doc(db, "signin-records", editingId), recordData);
            editingId = null;
            submitRecordButton.textContent = "Submit Record";
        } else {
            await addDoc(collection(db, "signin-records"), recordData);
        }

        fullNameInput.value = "";
        storeNumberInput.value = "";
        await loadRecords();
        alert(editingId ? "Record updated successfully!" : "Record added successfully!");
    } catch (error) {
        console.error("Error saving record:", error);
        alert("Error saving record: " + error.message);
    }
});