"use client";

import React, { useState } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { FaInbox, FaBars } from "react-icons/fa";
import { MdOutlinePerson } from "react-icons/md";
import { Search, X } from "lucide-react"; // Imported 'X' icon
import SearchBar from "./SearchBar";

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <nav className="border-b py-2 px-6 relative">
      <div className="flex items-center justify-between w-full">
        {/* Left Side */}
        <div className="flex items-center">
          {/* Mobile View: Menu and Search Icons */}
          <div className="flex items-center lg:hidden">
            {/* Menu Icon */}
            <button
              type="button"
              className="p-1 text-black hover:text-[#C41230] transition-colors duration-200"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars className="w-6 h-6" />
            </button>

            {/* Search Icon */}
            <button
              type="button"
              className="ml-3 p-1 text-black hover:text-[#C41230] transition-colors duration-200"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop View: Logo and Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/logo.png"
                alt="logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6 ml-8">
              {["Marketplace", "Commissions", "Requests"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="relative text-sm md:text-base text-black font-medium group hover:text-[#C41230] transition-colors duration-200"
                >
                  <span className="relative z-10 font-bold">{item}</span>
                  <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-[#C41230] transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Logo (Mobile View) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 lg:hidden">
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/logo.png"
              alt="logo"
              width={60}
              height={60}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center">
          {/* Mobile View: User Actions */}
          <div className="flex items-center lg:hidden space-x-3">
            {/* Inbox Icon (Visible when signed in) */}
            <SignedIn>
              <Link href="/inbox" title="Inbox">
                <button
                  type="button"
                  className="p-1 text-black hover:text-[#C41230] transition-colors duration-200"
                >
                  <FaInbox className="w-6 h-6" />
                </button>
              </Link>
            </SignedIn>

            {/* User Profile or Sign In Button */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center p-1 text-black transition-colors duration-200 group">
                  <MdOutlinePerson className="w-6 h-6" />
                  <span className="text-sm relative font-bold">
                    Sign in
                    <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-current transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                  </span>
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>
          </div>

          {/* Desktop View: Search Bar and User Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Search Bar */}
            <div className="w-80 mr-8">
              <SearchBar />
            </div>

            {/* User Actions */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex items-center space-x-1 text-sm text-black group">
                  <MdOutlinePerson className="w-6 h-6 text-black" />
                  <span className="relative font-bold">
                    Sign in
                    <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-current transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                  </span>
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center space-x-4">
                {/* Inbox Icon */}
                <Link href="/inbox" title="Inbox">
                  <button
                    type="button"
                    className="p-1 text-black hover:text-[#C41230] transition-colors duration-200"
                  >
                    <FaInbox className="w-6 h-6" />
                  </button>
                </Link>

                {/* User Profile Button */}
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Sidebar Menu (Mobile View) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setSidebarOpen(false)}
          ></div>

          {/* Sidebar */}
          <div
            className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col p-8 space-y-3">
              {["Marketplace", "Commissions", "Requests"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-base text-black hover:text-[#C41230] font-bold pl-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar Modal (Mobile View) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-4">
          <button
            className="self-end mb-4 text-black hover:text-[#C41230] transition-colors duration-200"
            onClick={() => setSearchOpen(false)}
            aria-label="Close Search"
          >
            <X className="w-6 h-6" />{" "}
            {/* Replaced "Close" text with 'X' icon */}
          </button>
          <SearchBar />
        </div>
      )}
    </nav>
  );
};

export default Header;
