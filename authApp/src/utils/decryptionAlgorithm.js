import { base64ToArrayBuffer } from "@/utils/webCryptoUtils";

export async function decryptData(response) {
  if (response.data.d && response.data.d.length > 0) {
    const dBuffer = new Uint8Array(base64ToArrayBuffer(response.data.d));
    const iv = new Uint8Array(base64ToArrayBuffer(response.data.n));
    const authTag = new Uint8Array(base64ToArrayBuffer(response.data.t));

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

      return userArray;
    } catch (err) {
      console.error("Decryption or insertion failed:", err);
      return [];
    }
  } else {
    return [];
  }
}
