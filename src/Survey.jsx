import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Survey() {
  const [populationDensity, setPopulationDensity] = useState("");
  const [moodLevel, setMoodLevel] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
      setMessage("You must be logged in to submit!");
      return;
    }

    try {
      const data = {
        populationdensity: Number(populationDensity),
        moodLevel: Number(moodLevel),
        comment,
      };

      // Save to Firestore using UID as document ID
      await setDoc(doc(db, "frustrationInfo", auth.currentUser.uid), data);
      setMessage("Survey submitted successfully!");
      // Redirect to map after submit
      setTimeout(() => navigate("/map"), 1500);
    } catch (err) {
      console.error("Error saving survey:", err);
      setMessage("Failed to save survey. Try again.");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", textAlign: "center" }}>
      <h1>Survey</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="Population Density"
          value={populationDensity}
          onChange={(e) => setPopulationDensity(e.target.value)}
          style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          required
        />
        <input
          type="number"
          placeholder="Mood Level (1-10)"
          value={moodLevel}
          onChange={(e) => setMoodLevel(e.target.value)}
          style={{ width: "100%", padding: "8px", margin: "10px 0" }}
          required
        />
        <textarea
          placeholder="Comments"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ width: "100%", padding: "8px", margin: "10px 0" }}
        />
        <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
          Submit Survey
        </button>
      </form>
      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}
