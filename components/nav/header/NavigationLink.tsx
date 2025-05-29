/**
 * NavigationLink component
 * Styled link for main navigation with hover effect
 */
"use client";

import React from "react";
import Link from "next/link";

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavigationLink = ({
  href,
  children,
  className = "",
  onClick,
}: NavigationLinkProps) => (
  <Link
    href={href}
    className={`text-black font-rubik font-semibold relative pb-1 group ${className}`}
    onClick={onClick}
  >
    {children}
    <div className="absolute bottom-[-10px] left-0 w-full h-[3] bg-[#C41230] transform scale-x-0 group-hover:scale-x-100" />
  </Link>
);

export default NavigationLink;
