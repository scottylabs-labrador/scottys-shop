"use client";
import React from "react";
import { useUser, SignIn } from "@clerk/nextjs";

export default function ItemDashboard() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  return (
    <div>
      <h1>Items</h1>
    </div>
  );
}
