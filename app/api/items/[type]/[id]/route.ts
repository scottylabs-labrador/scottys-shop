import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/firebase/users";
import { getCommItemById, updateCommItem } from "@/firebase/commItems";
import { getMPItemById, updateMPItem } from "@/firebase/mpItems";
import { getUserById } from "@/firebase/users";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { ITEM_TYPE } from "@/utils/itemConstants";
import { ItemID, ClerkID } from "@/utils/types";

const storage = getStorage();

// Helper function to delete images from storage
const deleteImagesFromStorage = async (imageUrls: string[]): Promise<void> => {
  const deletionPromises = imageUrls.map(async (imageUrl) => {
    try {
      const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
      if (imageUrl.includes(baseUrl)) {
        const urlParts = imageUrl.split(baseUrl)[1];
        const bucketAndPath = urlParts.split("/o/")[1];
        const filePath = decodeURIComponent(bucketAndPath.split("?")[0]);
        const imageRef = ref(storage, filePath);
        await deleteObject(imageRef);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  });
  await Promise.allSettled(deletionPromises);
};

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const itemType = params.type.toLowerCase();
    const itemId = params.id as ItemID;

    if (
      itemType !== ITEM_TYPE.COMMISSION.toLowerCase() &&
      itemType !== ITEM_TYPE.MARKETPLACE.toLowerCase()
    ) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    // Fetch item based on type - no auth needed for viewing
    const isCommission = itemType === ITEM_TYPE.COMMISSION.toLowerCase();
    const item = isCommission
      ? await getCommItemById(itemId)
      : await getMPItemById(itemId);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Return item data with seller's AndrewID
    const safeItemData = {
      id: item.id,
      sellerId: item.sellerId, // Seller identified by AndrewID
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      tags: item.tags,
      images: item.images,
      createdAt: item.createdAt,
      // Type-specific fields
      ...(isCommission
        ? { isAvailable: (item as any).isAvailable }
        : { status: (item as any).status, condition: (item as any).condition }),
    };

    return NextResponse.json(safeItemData);
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId as ClerkID);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const itemType = params.type.toLowerCase();
    const itemId = params.id as ItemID;

    if (
      itemType !== ITEM_TYPE.COMMISSION.toLowerCase() &&
      itemType !== ITEM_TYPE.MARKETPLACE.toLowerCase()
    ) {
      return NextResponse.json({ error: "Invalid item type" }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      description,
      price,
      category,
      tags,
      images,
      removedImages,
      condition,
    } = body;

    // Fetch item to verify ownership
    const isCommission = itemType === ITEM_TYPE.COMMISSION.toLowerCase();
    const item = isCommission
      ? await getCommItemById(itemId)
      : await getMPItemById(itemId);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify ownership using FirebaseID (server-side only)
    if (item.sellerId !== user.andrewId) {
      return NextResponse.json(
        { error: "Unauthorized - not item owner" },
        { status: 403 }
      );
    }

    // Delete removed images
    if (removedImages && removedImages.length > 0) {
      await deleteImagesFromStorage(removedImages);
    }

    // Prepare update data
    const updateData = {
      title,
      description,
      price: Number(price),
      category,
      tags,
      images,
      updatedAt: Date.now(),
    };

    // Update item based on type
    if (isCommission) {
      const commissionData = {
        ...updateData,
        isAvailable: true,
      };
      await updateCommItem(itemId, commissionData);
    } else {
      const marketplaceData = {
        ...updateData,
        condition,
        status: (item as any).status, // Preserve current status
      };
      await updateMPItem(itemId, marketplaceData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
