<template>
  <div class="home-wrapper">
    <button @click="handleLogout" class="logout-button">Logout</button>
    <div class="content">
      <h1>Welcome to the Home Page</h1>
      <p>This is a placeholder after login</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function handleLogout() {
  router.push('/')
}
</script>

<style scoped>
.home-wrapper {
  min-height: 100vh;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f5f6f8;
  display: flex;
  flex-direction: column;
}

.logout-button {
  align-self: flex-end;
  padding: 8px 16px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 40px;
}

.logout-button:hover {
  background-color: #555;
}

.content {
  text-align: center;
  margin-top: 100px;
}

h1 {
  font-size: 2.5rem;
  color: #222;
  margin-bottom: 10px;
}

p {
  color: #666;
}
</style>
