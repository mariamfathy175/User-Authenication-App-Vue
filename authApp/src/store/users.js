import { defineStore } from "pinia";
import { ref } from "vue";
import { compare } from "bcryptjs";
import { decryptData } from "@/utils/decryptionAlgorithm";
import { userAdapter } from "@/utils/userAdapter";

export const useUserStore = defineStore("user", () => {
  const db = ref("");
  const dbName = "user List";
  const storeName = "users";

  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 3);

      request.onupgradeneeded = (event) => {
        db.value = request.result;
        if (!db.value.objectStoreNames.contains(storeName)) {
          const store = db.value.createObjectStore(storeName, {
            keyPath: "id",
          });
          store.createIndex("username", "username", { unique: true });
        }
      };

      request.onsuccess = () => {
        db.value = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async function syncData() {
    const pageSize = 10;
    const UserTotal = 1000;
    let userArray = [];

    for (let i = 0; i < pageSize; i++) {
      let response = await getSyncData();
      userArray = userArray.concat(await decryptData(response));

      if (userArray.length >= UserTotal) {
        break;
      }
    }
    
    const tx = db.value.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (const user of userArray) {
      const adaptedUser = userAdapter(user);
      store.put(adaptedUser);
    }

    await tx.complete;

    console.log("Users inserted into IndexedDB successfully");
    return true;
  }

  async function getUserData() {
    try {
      const response = await fetch("https://calls.trolley.systems/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const usersData = await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  async function getSyncData() {
    try {
      const response = await fetch(
        "https://calls.trolley.systems/api/sync-users",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const syncData = await response.json();
      return syncData;
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  async function checkUser(username, password) {
    const tx = db.value.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const index = store.index("username");
    const res = index.get(username);
    res.onsuccess = async function () {
      if (res.result) {
        console.error(res.result);
        const match = await compare(password, res.result.password);
        if (match) {
          return { success: true };
        } else {
          return { success: false };
        }
      } else {
        return { success: false };
      }
    };
    res.onerror = function () {
      console.error("Error Connecting to IndexedDB");
    };
  }

  async function login(username, password) {
    if (navigator.onLine) {
      try {
        const response = await fetch(
          "https://calls.trolley.systems/api/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: username,
              password: password,
            }),
          }
        );

        const loginResponse = await response.json();
        return loginResponse;
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    } else {
      return checkUser(username, password);
    }
  }

  return { initDB, getUserData, login, syncData };
});
