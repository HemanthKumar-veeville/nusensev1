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
      <h1 className="text-4xl font-bold mb-4 text-center">
        AI-powered imagery for the modern market
      </h1>
      <p className="mb-8 text-center">
        Empowering professional creativity with AI-driven imagery
      </p>
      <Button text="Join the Waitlist" onClick={handleButtonClick} />
    </div>
  );
};

export default HomePage;
