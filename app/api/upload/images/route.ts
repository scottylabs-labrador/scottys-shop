import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/firebase/users";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ClerkID } from "@/utils/types";

const storage = getStorage();

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserByClerkId(clerkId as ClerkID);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const images = formData.getAll("images") as File[];

    if (images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    if (images.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 images allowed" },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    for (const image of images) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
        return NextResponse.json(
          { error: "Invalid file type" },
          { status: 400 }
        );
      }
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds 5MB limit" },
          { status: 400 }
        );
      }
    }

    // Upload images
    const uploadPromises = images.map(async (image, index) => {
      const buffer = await image.arrayBuffer();
      const storageRef = ref(
        storage,
        `items/${user.id}/${Date.now()}-${index}-${image.name}`
      );
      const snapshot = await uploadBytes(storageRef, buffer);
      return await getDownloadURL(snapshot.ref);
    });

    const urls = await Promise.all(uploadPromises);
    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
