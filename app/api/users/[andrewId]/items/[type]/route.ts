import { NextRequest, NextResponse } from "next/server";
import { getCommItemsBySeller } from "@/firebase/commItems";
import { getMPItemsBySeller } from "@/firebase/mpItems";
import { AndrewID } from "@/utils/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ andrewId: AndrewID; type: string }> }
) {
  try {
    const resolvedParams = await params;
    const itemType = resolvedParams.type.toLowerCase();

    if (itemType !== "commission" && itemType !== "marketplace") {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    // Fetch items using FirebaseID
    const items =
      itemType === "commission"
        ? await getCommItemsBySeller(resolvedParams.andrewId)
        : await getMPItemsBySeller(resolvedParams.andrewId);

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching user items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
