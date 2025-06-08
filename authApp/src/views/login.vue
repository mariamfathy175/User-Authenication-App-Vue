<script setup>
import { ref, onMounted } from "vue";
import { useUserStore } from "@/store/users";
import { useRouter } from "vue-router";

import "@/assets/main.css";

const userStore = useUserStore();
const username = ref("");
const password = ref("");
const dbRef = ref(null);

const usernameError = ref(false);
const passwordError = ref(false);
const loginError = ref(false);
const errorMsg = ref("");
const router = useRouter();

function validateForm() {
  usernameError.value = !username.value.trim();
  passwordError.value = !password.value.trim();

  if (usernameError.value || passwordError.value) {
    errorMsg.value = usernameError.value
      ? "Please enter an email address or phone number."
      : "Please enter a password.";
    return false;
  }

  errorMsg.value = "";
  return true;
}

onMounted(async () => {
  await userStore.initDB();
  await userStore.syncData();
});

window.addEventListener("online", async () => {
  await userStore.syncData();
});

window.addEventListener("offline", () => {
  console.log("You are offline.");
});

async function login() {
  if (!validateForm()) return;
  try {
    const loginResponse = await userStore.login(username.value, password.value);

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
}

setInterval(async function () {
  if (navigator.onLine) {
    await userStore.syncData();
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
