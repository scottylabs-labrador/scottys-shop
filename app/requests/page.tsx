"use client";

import { getUserByClerkId } from "@/firebase/users";
import { SignIn, useUser } from "@clerk/nextjs";
import { db } from "@/firebase/firebase";
import { getDocs, deleteDoc, doc } from "firebase/firestore";
import { collection, addDoc } from "firebase/firestore";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStorage } from "firebase/storage";
import { Button } from "@/components/ui/button";

export interface RequestItem {
  id: string;
  title: string;
  description: string;
}

export default function RequestsPage() {
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const storage = getStorage();

  const [requestUploading, setRequestUploading] = useState(false);

  function changeCreating() {
    setIsCreating(prev => !prev); // Toggling the state
  }

  // Form Data Series
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Form validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
  }>({});

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (isLoaded && user) {
        try {
          const userData = await getUserByClerkId(user.id);
          if (userData) {
            setUserId(userData.id);
          } else {
            console.error("User data not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [isLoaded, user]);

  // Handle input changes for title and description
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  // Handle form submission
  const handleSubmitRequest = async () => {
    const result = await uploadRequest();
    if (result.length > 0) {
      console.log("Request submitted successfully:", result[0]);
      await fetchRequests();
    }
  };

  // Upload request to Firestore
  const uploadRequest = async (): Promise<string[]> => {
    const validationErrors: { title?: string; description?: string } = {};

    if (title.trim().length === 0) {
      validationErrors.title = "Title is required.";
    }
    if (description.trim().length === 0) {
      validationErrors.description = "Description is required.";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return [];
    }

    try {
      setRequestUploading(true);

      // Add document to "requests" collection in Firestore
      const docRef = await addDoc(collection(db, "requests"), {
        title,
        description,
        userId: userId
      });

      console.log("Request successfully uploaded with ID:", docRef.id);

      // Reset form after successful upload
      setTitle("");
      setDescription("");
      setErrors({});
      setIsCreating(false);

      return [docRef.id];
    } catch (error) {
      console.error("Error uploading request:", error);
      return [];
    } finally {
      setRequestUploading(false);
    }
  };

  // Get Requests from Firestore Database for Display
  const fetchRequests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "requests"));
      const fetchedRequests: RequestItem[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedRequests.push({
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
        });
      });

      setRequests(fetchedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  // Delete a request by ID
  const deleteRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, "requests", id));
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 py-5">
        <h1 className="text-3xl font-bold mb-3 px-1">Requests Page</h1>
        <h2 className="text-xl font-bold mb-3 px-1"> Make requests for items you would like to see here </h2>
        <h2 className="text-xl font-bold mb-3 px-1"> Title: 100 character limit </h2>
        <h2 className="text-xl font-bold mb-3 px-1"> Description: 500 character limit </h2>
      </div>

      <div className="mt-2">
        {requests.length > 0 ? (
          <div className="grid grid-cols-1 py-3 gap-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="relative border border-gray-300 p-4 rounded-lg shadow-md hover:shadow-lg transition group"
              >
                <h2 className="text-xl font-bold mb-2">{request.title}</h2>
                <p className="text-gray-700">{request.description}</p>

                {/* Delete "X" appears on hover */}
                <button
                  onClick={() => deleteRequest(request.id)}
                  className="absolute top-2 right-2 text-red-600 font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="Delete Request"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No requests found.</p>
        )}
      </div>

      <div className="fixed top-1/4 transform -translate-y-12 right-4 z-50">
        <button
          className="bg-[#C41230] text-white px-4 py-2 rounded-xl shadow-lg hover:bg-white hover:text-[#C41230] border border-[#C41230] transition duration-200"
          onClick={changeCreating}
        >
          New Request
        </button>
      </div>

      {isCreating && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl z-50 w-1/2 border border-[#C41230]">
          <h1 className="text-3xl font-bold text-center text-[#C41230]">Make A Request</h1>
          <div className="flex flex-col space-y-4 mx-auto p-4">
            <h2 className="text-xl font-bold text-left">Request Title</h2>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              className="px-5 py-2 text-black border border-black-600"
              placeholder="Request Title"
              maxLength={100}
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
            
            <h2 className="text-xl font-bold text-left">Request Description</h2>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              className="px-5 py-2 text-black border border-black-600 min-h-[100px]"
              placeholder="Request Description"
              maxLength={500}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
            
            <button
              className="bg-[#C41230] text-white px-5 py-2 shadow-lg hover:bg-white hover:text-[#C41230] border border-[#C41230] transition duration-200"
              onClick={handleSubmitRequest}
              disabled={requestUploading}
            >
              {requestUploading ? "Submitting..." : "Submit Your Request"}
            </button>
            <button
              className="bg-white text-[#C41230] px-5 py-2 shadow-lg hover:bg-[#C41230] hover:text-white border border-[#C41230] transition duration-200"
              onClick={changeCreating}
            >
              Cancel Request
            </button>
          </div>
        </div>
      )}
    </>
  );
}