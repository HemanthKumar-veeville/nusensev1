import React from "react";

const Button = ({ text, onClick, disabled }) => {
  return (
    <button
      className={`px-4 py-2 bg-blue-600 text-white font-bold rounded-lg transition ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-800"
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {text}
    </button>
  );
};

export default Button;
