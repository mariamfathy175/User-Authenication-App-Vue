import { createRouter, createWebHistory } from "vue-router";
import Homepage from "@/views/Homepage.vue";
import login from "@/views/login.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/home",
      name: "home",
      component: Homepage,
    },
    {
        path: "/",
        name: "login",
        component: login,
      },
  ],
});

export default router;
