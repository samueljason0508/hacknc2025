import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import "./Survey.css";

export default function Survey() {
  const questions = [
    { id: "populationDensity", text: "Population Density" },
    { id: "airQuality", text: "Air Quality" },
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
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={values[q.id]}
                onChange={handleChange}
              />
              <div className="slider-value">{values[q.id]}</div>
            </div>
            <button onClick={handleNext}>Submit</button>
          </div>
        );
      })}
      {message && <p>{message}</p>}
    </div>
  );
}
