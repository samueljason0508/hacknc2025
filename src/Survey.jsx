import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import "./Survey.css";

export default function Survey() {
  const questions = [
    { id: "populationDensity", text: "thoughts on socializing?" },
    { id: "airQuality", text: "thoughts on the environment?" },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState({ populationDensity: 0, airQuality: 0 });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleNext = async () => {
    if (!auth.currentUser) {
      setMessage("You must be logged in to submit!");
      return;
    }

    const currentQuestion = questions[currentStep];
    const value = values[currentQuestion.id];

    try {
      await setDoc(
        doc(db, "frustrationInfo", auth.currentUser.uid),
        { [currentQuestion.id]: value },
        { merge: true }
      );

      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        navigate("/map");
      }
    } catch (err) {
      console.error("Error saving survey:", err);
      setMessage("Failed to save answer. Try again.");
    }
  };

  const handleChange = (e) => {
    const currentQuestion = questions[currentStep];
    setValues({ ...values, [currentQuestion.id]: parseFloat(e.target.value) });
  };

  return (
    <div className="survey-container">
      {questions.map((q, index) => {
        let className = "question next";
        if (index === currentStep) className = "question active";
        if (index < currentStep) className = "question slide-left";

        return (
          <div key={q.id} className={className}>
            <h2>{q.text}</h2>
<div className="slider-wrapper">
  <span className="slider-label-left">love</span>
  <input className="slider"
    type="range"
    min="-10"
    max="10"
    step="0.1"
    value={values[q.id] || 0}
    onChange={(e) =>
      setValues((prev) => ({ ...prev, [q.id]: parseFloat(e.target.value) }))
    }
  />
  <span className="slider-label-right">hate</span>
</div>
            <button onClick={handleNext} className="submitButton">Submit</button>
          </div>
        );
      })}
      {message && <p>{message}</p>}
    </div>
  );
}
