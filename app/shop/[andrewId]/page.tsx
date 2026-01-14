"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ShopEmbed } from "@/components/shop/ShopEmbed";
import { AndrewID } from "@/utils/types";

export default function ShopPage() {
  // Router
  const params = useParams();
  const andrewId = params.andrewId as AndrewID;

  return (
    <div className="max-w-8xl mx-auto p-8">
      <ShopEmbed andrewId={andrewId} />
    </div>
  );
}
