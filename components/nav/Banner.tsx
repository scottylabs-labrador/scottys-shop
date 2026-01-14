/**
 * Banner component for site-wide announcements
 * Displays rotating announcement messages at the top of the page
 * Features red-blue gradient background with animated splash effects
 */
"use client";
import React, { useState, useEffect } from "react";

const messages: string[] = [
  "Welcome to Shop Scotty!",
  "Check out the student made items!",
  "For your every day, and every other day needs.",
  "Enjoy the comfort of student to student transactions.",
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
    }, 5000); // Change message every 5 seconds
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="relative overflow-hidden sticky top-0 z-50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-live="polite"
    >
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-fuchsia-600 to-blue-600 brightness-110 saturate-150"></div>

      {/* Animated gradient overlay for more dynamic effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/90 via-violet-600/80 to-cyan-500/90 animate-pulse saturate-150"></div>

      {/* Splash effect elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large splash shapes */}
        {/* <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-400/50 rounded-full animate-bounce saturate-150"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-fuchsia-500/60 rounded-full animate-pulse saturate-150"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-blue-400/50 rounded-full animate-ping saturate-150"></div> */}
        {/* Small floating particles
        <div className="absolute top-2 left-1/4 w-3 h-3 bg-white/80 rounded-full animate-bounce delay-100"></div>
        <div className="absolute bottom-3 right-1/3 w-2 h-2 bg-cyan-300 rounded-full animate-pulse delay-300 saturate-150"></div>
        <div className="absolute top-4 right-1/5 w-2 h-2 bg-fuchsia-400 rounded-full animate-ping delay-500 saturate-150"></div> */}
        {/* Flowing wave effect */}
        <div className="absolute inset-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
          >
            <path
              d="M0,10 Q25,5 50,10 T100,10 V20 H0 Z"
              fill="rgba(255,20,147,0.3)"
              className="animate-pulse"
            />
            <path
              d="M0,15 Q25,10 50,15 T100,15 V20 H0 Z"
              fill="rgba(0,191,255,0.3)"
              className="animate-bounce"
            />
          </svg>
        </div>
      </div>

      {/* Content container */}
      <div className="relative text-white text-center py-4 px-4 backdrop-blur-sm">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${
              index === currentMessageIndex
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform translate-y-2"
            }`}
          >
            <p className="text-xs md:text-sm font-rubik px-4 select-none font-medium text-shadow-lg drop-shadow-lg">
              {message}
            </p>
          </div>
        ))}
      </div>

      {/* Shimmer effect overlay
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shimmer"></div> */}
    </div>
  );
};

export default Banner;
