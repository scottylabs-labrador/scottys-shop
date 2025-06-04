"use client";

import { useState, useEffect } from "react";
import ItemCard from "@/components/items/ItemCard";
import Loading from "@/components/utils/Loading";
import { ITEM_STATUS, ITEM_TYPE } from "@/utils/itemConstants";
import { getMPItemsByStatus, type MPItemWithId } from "@/firebase/mpItems";
import {
  getAvailableCommItems,
  type CommItemWithId,
} from "@/firebase/commItems";

export default function Home() {
  const [mpItems, setMPItems] = useState<MPItemWithId[]>([]);
  const [commItems, setCommItems] = useState<CommItemWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [randomMPIndex, setRandomMPIndex] = useState(0);
  const [randomCommIndex, setRandomCommIndex] = useState(0);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        let MPItems: MPItemWithId[] = [];
        let CommItems: CommItemWithId[] = [];

        MPItems = await getMPItemsByStatus(ITEM_STATUS.AVAILABLE); // determine how we want to handle this
        CommItems = await getAvailableCommItems();

        setMPItems(MPItems);
        setCommItems(CommItems);
      } catch (error) {
        console.error("Error fetching items:", error);
        setMPItems([]);
        setCommItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Generate random featured items on refresh
  useEffect(() => {
    setRandomMPIndex(
      mpItems && mpItems.length > 0
        ? Math.floor(Math.random() * mpItems.length)
        : 0
    );
    setRandomCommIndex(
      commItems && commItems.length > 0
        ? Math.floor(Math.random() * commItems.length)
        : 0
    );
  }, [mpItems, commItems]);

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col md:flex-row font-rubik">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-caladea mb-6">
          Welcome to Scotty&apos;s Shop!
        </h1>

        <div className="grid grid-cols-2 gap-4">
          <div className="max-w-sm rounded overflow-hidden shadow-lg">
            <div className="px-6 py-4">
              <div className="text-xl mb-3">Featured Marketplace Item</div>
              {mpItems && mpItems.length > 0 ? (
                <ItemCard
                  itemId={mpItems[randomMPIndex].id}
                  type={ITEM_TYPE.MARKETPLACE}
                />
              ) : (
                <p className="text-gray-700 text-base">
                  No marketplace items found
                </p>
              )}
            </div>
          </div>

          <div className="max-w-sm rounded overflow-hidden shadow-lg">
            <div className="px-6 py-4">
              <div className="text-xl mb-3">Featured Commission</div>
              {commItems && commItems.length > 0 ? (
                <ItemCard
                  itemId={commItems[randomCommIndex].id}
                  type={ITEM_TYPE.COMMISSION}
                />
              ) : (
                <p className="text-gray-700 text-base">No commissions found</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
