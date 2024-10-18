import React from "react";
import ParticleCanvas from "../components/ParticleCanvas";
import Button from "../components/Button";

const HomePage = () => {
  const handleButtonClick = () => {
    alert("Join the Waitlist clicked!");
  };

  return (
    <div className="relative w-screen h-screen bg-black text-white flex flex-col items-center justify-center">
      <ParticleCanvas />
    </div>
  );
};

export default HomePage;
