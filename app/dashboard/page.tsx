"use client";
import React, { useState, useEffect, use } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { ShopEmbed } from "@/components/shop/ShopEmbed";
import ItemDashboard from "@/components/shop/ItemDashboard";
import Loading from "@/components/utils/Loading";
import { AndrewID, User } from "@/utils/types";

export default function SellerDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [andrewId, setAndrewId] = useState<AndrewID | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shop" | "items" | "past sales">(
    "shop"
  );

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn || !user?.id) return;

      try {
        setLoading(true);
        // Fetch current user data via secure API endpoint
        const response = await fetch("/api/users/current", { method: "POST" });

        if (response.ok) {
          const userData: User = await response.json();
          setAndrewId(userData.andrewId);
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchUserData();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  if (!isLoaded || loading) {
    return <Loading />;
  }

  // Show Sign In if user is not authenticated
  if (!user && isLoaded) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  const renderTabContent = () => {
    if (!andrewId) return <Loading />;

    switch (activeTab) {
      case "shop":
        return <ShopEmbed andrewId={andrewId} />;
      case "items":
        return <ItemDashboard andrewId={andrewId} />;
      case "past sales":
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">
              Past sales functionality coming soon...
            </p>
          </div>
        );
      default:
        return <ShopEmbed andrewId={andrewId} />;
    }
  };

  return (
    <div className="flex-col md:flex-row max-w-6xl align-center mx-auto px-4 py-4">
      <span>
        <h1 className="text-5xl font-caladea mb-6 border-b-4 border-[#C41230] pb-2">
          Seller Dashboard
        </h1>
      </span>
      {/* Tabs Navigation */}
      <div className="flex mb-6">
        <div className="flex space-x-8 text-left font-rubik font-semibold">
          <button
            onClick={() => setActiveTab("shop")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === "shop"
                ? "border-black text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Shop
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === "items"
                ? "border-black text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Items
          </button>
          <button
            onClick={() => setActiveTab("past sales")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === "past sales"
                ? "border-black text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Past Sales
          </button>
        </div>
      </div>
      {/* Tab Content */}
      <div className="mt-0">{renderTabContent()}</div>
    </div>
  );
}
