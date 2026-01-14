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
      if (!isSignedIn || !user?.id) {
        setLoading(false);
        return;
      }

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
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="w-full h-full">
              <ShopEmbed andrewId={andrewId} containerized={true} />
            </div>
          </div>
        );
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
        return (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-0">
              <ShopEmbed andrewId={andrewId} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen font-rubik">
      <div className="max-w-8xl mx-auto px-12 py-8">
        <h1 className="text-2xl font-normal text-gray-900 mb-5">
          Seller Dashboard
        </h1>

        {/* Tabs Navigation */}
        <div className="flex mb-6">
          <div className="flex space-x-8 text-left font-rubik font-semibold">
            <button
              onClick={() => setActiveTab("shop")}
              className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
                activeTab === "shop"
                  ? "border-black text-gray-900 font-medium"
                  : "border-transparent font-medium hover:font-medium text-gray-400 hover:text-gray-500"
              }`}
            >
              Shop
            </button>
            <button
              onClick={() => setActiveTab("items")}
              className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
                activeTab === "items"
                  ? "border-black text-gray-900 font-medium"
                  : "border-transparent font-medium hover:font-medium text-gray-400 hover:text-gray-500"
              }`}
            >
              Items
            </button>
            <button
              onClick={() => setActiveTab("past sales")}
              className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
                activeTab === "past sales"
                  ? "border-black text-gray-900 font-medium"
                  : "border-transparent font-medium hover:font-medium text-gray-400 hover:text-gray-500"
              }`}
            >
              Past Sales
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-0">{renderTabContent()}</div>
      </div>
    </div>
  );
}
