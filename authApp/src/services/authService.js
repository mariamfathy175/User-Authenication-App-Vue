import { compare } from "bcryptjs";

export async function loginOnline(username, password) {
  try {
    const response = await fetch("https://calls.trolley.systems/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const loginResponse = await response.json();
    return loginResponse;
  } catch (error) {
    console.error("Error fetching users Online:", error);
  }
}

export async function loginOffline(db, storeName, username, password) {
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const index = store.index("username");
    const request = index.get(username);

    request.onsuccess = async () => {
      if (request.result) {
        const match = await compare(password, request.result.password);
        resolve({ success: match });
      } else {
        resolve({ success: false });
      }
    };

    request.onerror = () => {
      console.error("IndexedDB login error");
      resolve({ success: false });
    };
  });
}
