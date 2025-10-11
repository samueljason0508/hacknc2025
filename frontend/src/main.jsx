import React from "react";
import "./Main.css";
import { useNavigate } from "react-router-dom"; 


function Main() {
  const navigate = useNavigate();

  const mainButtonClick = () => {
    navigate("/login")
  }


  return (
    <div className="app">
      <h1 className="main-title">Sadness</h1>
      <button className="main-button" onClick={mainButtonClick}>Feel the Pain</button>
    </div>
  );
}

export default Main;




