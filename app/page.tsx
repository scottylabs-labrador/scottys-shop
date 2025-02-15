"use client";

// import { ITEM_TYPE, MPITEM_STATUS } from "@/utils/constants";
// import ItemCard from "@/components/items/ItemCard";

export default function Home() {
//   const mpItem = useQuery(api.mpItems.search, {
//     status: MPITEM_STATUS.AVAILABLE,
//   });
//   const commItem = useQuery(api.commItems.search, { isAvailable: true });

//   const randomMPIndex =
//     mpItem && mpItem.length > 0 ? Math.floor(Math.random() * mpItem.length) : 0;
//   const randomCommIndex =
//     commItem && commItem.length > 0
//       ? Math.floor(Math.random() * commItem.length)
//       : 0;

  return (
    <div className="flex flex-col md:flex-row font-rubik">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-caladea mb-6">
          Welcome to Scotty&apos;s Shop!
        </h1>
        {/* <div className="grid grid-cols-2 gap-4">
          <div className="max-w-sm rounded overflow-hidden shadow-lg">
            <div className="px-6 py-4">
              <div className="text-xl mb-2">Featured Marketplace Item</div>
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
              <div className="text-xl mb-2">Featured Commission</div>
              {commItem && commItem.length > 0 ? (
                <ItemCard
                  itemId={commItem[randomCommIndex]._id}
                  type={ITEM_TYPE.COMMISSION}
                />
              ) : (
                <p className="text-gray-700 text-base">No commissions found</p>
              )}
            </div>
          </div>
        </div> */}
      </main>
    </div>
  );
}
