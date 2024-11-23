"use client";
import React, { useState } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { FaInbox, FaBars } from "react-icons/fa";
import { MdOutlinePerson } from "react-icons/md"; // Imported the icon

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <nav className="border-b">
      <div className="flex items-center justify-between w-full py-4 px-6">
        {/* Left Side */}
        <div className="flex items-center">
          {/* Menu Icon (Mobile) */}
          <div className="lg:hidden mr-2">
            <button
              type="button"
              className="p-2 text-gray-600 hover:text-[#C41230] transition-colors duration-200"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FaBars className="w-7 h-7" />
            </button>
          </div>

          {/* Logo (Desktop) */}
          <div className="hidden lg:flex">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/logo.png"
                alt="logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center ml-[3.75rem] space-x-12">
            {["Marketplace", "Commissions", "Requests"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="relative text-base md:text-xl text-gray-700 font-medium group"
              >
                <span className="relative z-10 font-bold">{item}</span>
                <span className="absolute inset-x-0 bottom-[-2px] h-0.5 bg-[#C41230] transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
              </Link>
            ))}
          </div>
        </div>

        {/* Center: Logo (Mobile) */}
        <div className="lg:hidden">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/assets/logo.png"
              alt="logo"
              width={80}
              height={80}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-6">
          {/* Sign In Button (Visible when signed out) */}
          <SignedOut>
            <div className="flex items-center">
              <SignInButton mode="modal">
                <button className="flex items-center space-x-2 text-lg group">
                  <MdOutlinePerson className="w-7 h-7 text-gray-600" />
                  <span className="relative font-bold">
                    Sign in
                    <span className="absolute inset-x-0 bottom-[-2px] h-0.5 bg-current transform scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100"></span>
                  </span>
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          {/* User Actions */}
          <SignedIn>
            <div className="flex items-center space-x-6">
              {/* Inbox Icon */}
              <div>
                <Link href="/inbox" title="Inbox">
                  <button
                    type="button"
                    className="p-2 text-gray-600 hover:text-[#C41230] transition-colors duration-200"
                  >
                    <FaInbox className="w-7 h-7" />
                  </button>
                </Link>
              </div>

              {/* User Profile Button */}
              <div>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-10 h-10",
                    },
                  }}
                />
              </div>
            </div>
          </SignedIn>
        </div>
      </div>

      {/* Sidebar Menu (Mobile) */}
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
            <div className="flex flex-col p-10 space-y-6">
              {["Marketplace", "Commissions", "Requests"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-xl text-gray-700 hover:text-[#C41230] font-bold pl-4"
                  onClick={() => setSidebarOpen(false)}
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
