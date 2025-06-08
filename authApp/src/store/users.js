import { defineStore } from "pinia";
import { ref } from "vue";

export const useUserStore = defineStore("user", () => {
  const usersd = ref("");
  const userst = ref("");
  const usersn = ref("");

  async function getUserData() {
    try {
      const response = await fetch("https://calls.trolley.systems/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const usersData = await response.json();
      usersd.value = usersData.data.d;
      userst.value = usersData.data.t;
      usersn.value = usersData.data.n;

    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }
  
  return {usersd, userst, usersn, getUserData };
});
