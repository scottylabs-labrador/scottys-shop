"use client";
import React, { useState, useEffect } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { ShopEmbed } from "@/components/shop/ShopEmbed";
import PastSalesEmbed from "@/components/shop/PastSalesEmbed";
import Loading from "@/components/utils/Loading";
import { getUserByClerkId } from "@/firebase/users";

export default function SellerDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [andrewId, setAndrewId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shop" | "past sales">("shop");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn || !user?.id) return;

      try {
        setLoading(true);
        const userData = await getUserByClerkId(user.id);

        if (userData && userData.andrewId) {
          setAndrewId(userData.andrewId);
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
    switch (activeTab) {
      case "shop":
        return <ShopEmbed andrewId={andrewId} />;
      case "past sales":
        return <PastSalesEmbed />;
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
                ? "border-blue-500 text-gray-900 font-medium"
                : "border-transparent text-gray-400 hover:text-gray-500"
            }`}
          >
            Shop Details
          </button>

          <button
            onClick={() => setActiveTab("past sales")}
            className={`py-2 px-0 text-sm border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === "past sales"
                ? "border-blue-500 text-gray-900 font-medium"
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
