"use client";

import React, { useState, useEffect } from "react";

const messages: string[] = [
  "Welcome to Scotty's Shop!",
  "Check out the student made items!",
  "For your every day, and every other day needs",
  "Enjoy the comfort of student to student transactions",
];

const Banner: React.FC = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) =>
        prevIndex === messages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change message every 7 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="bg-[#C41230] text-white text-center py-4 px-4 relative overflow-hidden sticky top-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-live="polite"
    >
      {messages.map((message, index) => (
        <div
          key={index}
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
            index === currentMessageIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="text-xs md:text-sm font-semibold px-4 select-none">
            {message}
          </p>
        </div>
      ))}
    </div>
  );
};

export default Banner;
