"use client";
import React, { useState, useEffect } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { ShopEmbed } from "@/components/shop/ShopEmbed";
import Loading from "@/components/utils/Loading";
import { getUserByClerkId } from "@/firebase/users";

export default function SellerDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [andrewId, setAndrewId] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
 
  if (!user) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <SignIn />
      </div>
    );
  }

  return (
    <div className="flex-col md:flex-row max-w-6xl align-center mx-auto px-4 py-4">
        <span>
            <h1 className="text-5xl font-caladea mb-6 border-b-4 border-[#C41230] pb-2">
                Seller Dashboard
            </h1>
        </span>
        <ShopEmbed andrewId={andrewId} />
    </div>
  );
}