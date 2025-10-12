// src/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }

    try {
      // Try logging in first
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Logged in successfully!");
      navigate("/survey"); // redirect to survey page
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        // User doesn't exist → create account
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setMessage("Account created and logged in!");
          navigate("/survey"); // redirect to survey page
        } catch (e) {
          setMessage(`Error creating account: ${e.message}`);
        }
      } else {
        setMessage(`Login error: ${err.message}`);
      }
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h1>Login / Register</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "8px", margin: "10px 0" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "8px", margin: "10px 0" }}
      />
      <button onClick={handleLogin} style={{ padding: "10px 20px", cursor: "pointer" }}>
        Submit
      </button>
      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}
