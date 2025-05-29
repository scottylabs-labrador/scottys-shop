/**
 * NotificationBadge component
 * Displays a small circle with a count for notifications
 */
"use client";

import React from "react";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

const NotificationBadge = ({
  count,
  className = "",
}: NotificationBadgeProps) => {
  if (count <= 0) return null;

  return (
    <div
      className={`absolute -top-2 -right-2 bg-[#C41230] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${className}`}
    >
      {count > 99 ? "99+" : count}
    </div>
  );
};

export default NotificationBadge;
