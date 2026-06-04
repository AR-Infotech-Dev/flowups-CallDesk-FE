import { makeRequest } from "../api/httpClient";

function base64ToArrayBuffer(base64 = "") {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }

  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binaryString = "";

  bytes.forEach((byte) => {
    binaryString += String.fromCharCode(byte);
  });

  return window.btoa(binaryString);
}

export async function encryptLoginPassword(password) {
  if (!window.crypto?.subtle) {
    throw new Error("Secure password encryption is not available in this browser.");
  }

  const response = await makeRequest("/salt", {
    method: "GET",
  });

  const salt = response?.salt || response?.data?.salt;
  
  if (!response?.success || !salt) {
    throw new Error(response?.message || "Unable to fetch login encryption key.");
  }

  const key = await window.crypto.subtle.importKey(
    "spki",
    base64ToArrayBuffer(salt),
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
  
  let encryptedBuffer;

  try {
    encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      key,
      new TextEncoder().encode(password)
    );
  } catch (error) {
    throw new Error("Unable to encrypt password. Please restart the backend and try again.");
  }

  return arrayBufferToBase64(encryptedBuffer);
}
