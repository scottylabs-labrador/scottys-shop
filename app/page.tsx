<<<<<<< Updated upstream
"use client"

import { api } from "@/convex/_generated/api";
import { ITEM_TYPE, MPITEM_STATUS } from "@/convex/constants";
import { useQuery } from "convex/react";
import ItemCard from "@/components/ItemCard";


=======
>>>>>>> Stashed changes
export default function Home() {
  const mpItem = useQuery(api.mpItems.search,{status:MPITEM_STATUS.AVAILABLE});
  const commItem = useQuery(api.commItems.search,{isAvailable: true});

  const randomMPIndex = mpItem && mpItem.length>0 ? Math.floor(Math.random() * mpItem.length) : 0;
  const randomCommIndex = commItem && commItem.length>0 ? Math.floor(Math.random() * commItem.length) : 0;
  

  return (
    <div className="flex flex-col md:flex-row">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to Scotty's Shop!</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="max-w-sm rounded overflow-hidden shadow-lg">
            <div className="px-6 py-4">
              <div className="font-bold text-xl mb-2">Featured Marketplace Item</div>
              {mpItem && mpItem.length > 0 ? (
                <ItemCard
                  itemId={mpItem[randomMPIndex]._id}
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
<<<<<<< Updated upstream
              <div className="font-bold text-xl mb-2">Featured Commission</div>
              {commItem && commItem.length > 0 ? (
                <ItemCard
                  itemId={commItem[randomCommIndex]._id}
                  type={ITEM_TYPE.COMMISSION}
                />
              ) : (
              <p className="text-gray-700 text-base">
                No commissions found
              </p>
              )}
=======
              <div className="font-bold text-xl mb-2">Commissions</div>
              <p className="text-gray-700 text-base">Featured commission</p>
>>>>>>> Stashed changes
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
