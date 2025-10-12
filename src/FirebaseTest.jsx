import React, { useEffect } from "react";
import { auth } from "./firebase";

export default function FirebaseTest() {
  useEffect(() => {
    console.log("🔥 Firebase Auth object:", auth);
  }, []);

  return (
    <div>
      <h1>Firebase Test Page</h1>
      <p>Check the browser console for the Firebase Auth object.</p>
    </div>
  );
}
