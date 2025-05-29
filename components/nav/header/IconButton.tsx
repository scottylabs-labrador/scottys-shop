/**
 * IconButton component
 * Reusable button component with icon
 */
"use client";

import React from "react";

interface IconButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  title?: string;
  className?: string;
}

const IconButton = ({
  icon: Icon,
  onClick,
  title,
  className = "p-2 hover:bg-gray-100 rounded-full",
}: IconButtonProps) => (
  <button type="button" className={className} onClick={onClick} title={title}>
    <Icon className="w-6 h-6 hover:text-[#C41230]" />
  </button>
);

export default IconButton;
