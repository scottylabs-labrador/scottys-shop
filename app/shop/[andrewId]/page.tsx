"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ShopEmbed } from "@/components/shop/ShopEmbed";

export default function ShopPage() {
  // Router
  const params = useParams();
  const andrewId = typeof params?.andrewId === "string" ? params.andrewId : "";

  return <ShopEmbed andrewId={andrewId} />;
}