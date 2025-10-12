// src/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import "./Login.css";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [emoji, setEmoji] = useState("•ᴗ•");

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }

    try {
      // Try logging in first
      await signInWithEmailAndPassword(auth, email, password);
          setEmoji("˃ᴗ˂"); 
                setMessage("Logged in successfully!");


              setTimeout(() => {
      navigate("/survey"); // redirect to survey page
    }, 1000); // 1 second delay

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
    <div className="loginPage">
      <h1 className="loginTitle">Login <span className="emoji">{emoji}</span></h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="email"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="password"
      />
      {message && <p className="errorMess">{message}</p>}
      <button onClick={handleLogin} className="loginButton">
        Submit
      </button>
      
    </div>
  );
}
