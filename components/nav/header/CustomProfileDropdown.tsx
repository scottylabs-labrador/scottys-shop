/**
 * CustomProfileDropdown component
 * User profile dropdown with account options and sign out
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { LogOut, History, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserByClerkId, type UserWithId } from "@/firebase/users";

const CustomProfileDropdown = () => {
  const { signOut, user } = useClerk();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserWithId | null>(null);

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        const fbUser = await getUserByClerkId(user.id);
        if (fbUser) {
          setUserData(fbUser);
          setAvatarUrl(fbUser.avatarUrl || user.imageUrl || null);
        } else {
          setAvatarUrl(user.imageUrl || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setAvatarUrl(user.imageUrl || null);
      }
    };

    fetchUserData();
  }, [user?.id, user?.imageUrl]);

  // Dropdown menu items configuration
  const dropdownItems = [
    {
      href: "/account",
      icon: Settings,
      label: "Manage Account",
      className: "p-4 font-rubik focus:bg-gray-100 cursor-pointer",
    },
    {
      href: "/purchases",
      icon: History,
      label: "Purchase History",
      className: "p-4 font-rubik focus:bg-gray-100 cursor-pointer",
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none cursor-pointer transition-transform hover:scale-105">
          <Avatar className="h-8 w-8 transition-shadow hover:shadow-lg border-2 border-black">
            <AvatarImage
              src={avatarUrl || "/assets/default-avatar.jpg"}
              alt={user?.firstName || "User"}
              className="object-cover"
            />
            <AvatarFallback>{user?.firstName?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60 p-3"
        style={{ zIndex: 1000 }}
      >
        {dropdownItems.map(({ href, icon: Icon, label, className }) => (
          <DropdownMenuItem key={href} asChild className={className}>
            <Link href={href} className="flex items-center w-full">
              <Icon className="mr-3 h-7 w-7" />
              <span className="text-sm font-rubik">{label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onClick={() => signOut()}
          className="p-4 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
        >
          <LogOut className="mr-3 h-7 w-7" />
          <span className="text-sm font-rubik">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CustomProfileDropdown;
