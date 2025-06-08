<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/users";
import { compare } from "bcryptjs";
import { useRouter, RouterView } from "vue-router";

import "@/assets/main.css";

const userStore = useUserStore();
const username = ref("");
const password = ref("");
const dbName = "user List";
const storeName = "users";
const dbRef = ref(null);

const usernameError = ref(false);
const passwordError = ref(false);
const loginError = ref(false);
const errorMsg = ref("");
const router = useRouter();

function validateForm() {
  usernameError.value = !username.value.trim();
  passwordError.value = !password.value.trim();

  if (usernameError.value) {
    errorMsg.value = "Please enter an email address or phone number.";
    return false;
  }

  if (passwordError.value) {
    errorMsg.value = "Please enter a password.";
    return false;
  }

  errorMsg.value = "";
  return true;
}

onMounted(async () => {
  console.log(
    "Available routes:",
    router.getRoutes().map((r) => r.path)
  );

  await userStore.getUserData();
  const db = await openDB();
  dbRef.value = db;
  decryptData(db);
});

window.addEventListener("online", async () => {
  await userStore.getUserData();
  decryptData(dbRef.value);
});

window.addEventListener("offline", () => {
  console.log("You are offline.");
});

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function decryptData(db) {
  const dBuffer = new Uint8Array(base64ToArrayBuffer(userStore.usersd));
  const iv = new Uint8Array(base64ToArrayBuffer(userStore.usersn));
  const authTag = new Uint8Array(base64ToArrayBuffer(userStore.userst));

  const aesKeyRaw = dBuffer.slice(0, 16);
  const ciphertext = dBuffer.slice(16);

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const aesKey = await crypto.subtle.importKey(
    "raw",
    aesKeyRaw,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      combined
    );

    const bcryptHash = new TextDecoder().decode(decrypted);

    const userArray = JSON.parse(bcryptHash);

    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    for (const user of userArray) {
      const nameArray = user.name.split(" ");
      const firstName = nameArray[0] || "";
      const lastName = nameArray[1] || "";

      const adaptedUser = {
        ...user,
        firstName,
        lastName,
      };
      delete adaptedUser.name;

      store.put(adaptedUser);
    }

    await tx.complete;
    console.log("Users inserted into IndexedDB successfully");
  } catch (err) {
    console.error("Decryption or insertion failed:", err);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 3);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: "id" });
        store.createIndex("username", "username", { unique: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function checkUser(db) {
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  const index = store.index("username");
  const res = index.get(username.value);
  res.onsuccess = async function () {
    if (res.result) {
      console.error(res.result);
      const match = await compare(password.value, res.result.password);
      if (match) {
        loginError.value = false;
        router.push("/home");
      } else {
        errorMsg.value = "Username or password is incorrect.";
        loginError.value = true;
      }
    } else {
      errorMsg.value = "Username or password is incorrect.";
      loginError.value = true;
    }
  };
  res.onerror = function () {
    console.error("Error Connecting to IndexedDB");
  };
}

async function login() {
  if (!validateForm()) return;
  if (navigator.onLine) {
    try {
      const response = await fetch("https://calls.trolley.systems/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
        }),
      });

      const loginResponse = await response.json();

      if (loginResponse.success) {
        loginError.value = false;
        router.push("/home");
      } else {
        errorMsg.value = "Username or Password is Incorrect.";
        loginError.value = true;
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      loginError.value = true;
      errorMsg.value = "An error occurred while logging in.";
    }
  } else {
    checkUser(dbRef.value);
  }
}

setInterval(async function () {
  if (navigator.onLine) {
    await userStore.getUserData();
    decryptData(dbRef.value);
    console.error("syncing data");
  } else {
    console.error("user is offline");
  }
}, 60 * 1000);
</script>

<template>
  <div class="container">
    <div class="welcome-card">
      <h1>WELCOME</h1>
      <p>Please sign in to your account to get started</p>
    </div>

    <div class="login-card">
      <h2 class="login-title">Sign In to Your Account</h2>
      <form @submit.prevent="login" class="login-form">
        <input
          v-model="username"
          :class="{ 'input-error': usernameError || loginError }"
          type="text"
          placeholder="Username"
        />
        <p v-if="usernameError" class="error-message">Username is required.</p>
        <input
          v-model="password"
          :class="{ 'input-error': passwordError || loginError }"
          type="password"
          placeholder="Password"
        />
        <p v-if="passwordError" class="error-message">Password is required.</p>
        <p
          v-if="!usernameError && !passwordError && errorMsg"
          class="error-message"
        >
          {{ errorMsg }}
        </p>
        <button type="submit">Login</button>
      </form>
    </div>
  </div>
</template>
