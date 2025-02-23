"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ItemCard from "@/components/items/itemcard/ItemCard";
import Loading from "@/components/utils/Loading";
import { ITEM_TYPE, MPITEM_STATUS } from '@/utils/constants';
import { 
  getMPItemsByStatus,
  type MPItemWithId
} from '@/firebase/mpItems';
import { 
    getAvailableCommItems,
    type CommItemWithId
  } from '@/firebase/commItems';
import { isItemInCart } from '@/firebase/users';

export default function CartPage() {
    const [mpItems, setMPItems] = useState<MPItemWithId[]>([]);
    const [commItems, setCommItems] = useState<CommItemWithId[]>([]);
    const [loading, setLoading] = useState(true);
    const { isSignedIn, user } = useUser();

    // Fetch items 
    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                let cartMPItems: MPItemWithId[] = [];
                let cartCommItems: CommItemWithId[] = [];

                if (isSignedIn && user?.id) {
                    cartMPItems = await getMPItemsByStatus(MPITEM_STATUS.AVAILABLE);  // determine how we want to handle this
                    cartCommItems = await getAvailableCommItems();

                    // Find items in cart
                    const filteredMPItems = await Promise.all(
                        cartMPItems.map(async (item) => ({
                            item,
                            isInCart: await isItemInCart(user.id, item.id)
                        }))
                    );

                    const filteredCommItems = await Promise.all(
                        cartCommItems.map(async (item) => ({
                            item,
                            isInCart: await isItemInCart(user.id, item.id)
                        }))
                    );

                    // Filter out items that are not in the cart
                    cartMPItems = filteredMPItems
                        .filter(entry => entry.isInCart) // Keep only items that are in the cart
                        .map(entry => entry.item); 
                    cartCommItems = filteredCommItems
                        .filter(entry => entry.isInCart) 
                        .map(entry => entry.item);
                }
                setMPItems(cartMPItems);
                setCommItems(cartCommItems);
            } catch (error) {
                console.error('Error fetching items:', error);
                setMPItems([]);
                setCommItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [isSignedIn, user?.id]);

    return (
        <div className="flex flex-col max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold mb-4">Marketplace</h1>
            <div className="flex-1 pl-9">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mpItems.map((item) => (
                    <ItemCard
                    key={item.id}
                    itemId={item.id}
                    type={ITEM_TYPE.MARKETPLACE}
                    />
                ))}
                {mpItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                    No items found
                    </div>
                )}
                </div>
            </div>

            <h1 className="text-3xl font-bold mb-4 mt-10">Commissions</h1>
            <div className="flex-1 pl-9">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {commItems.map((item) => (
                    <ItemCard
                    key={item.id}
                    itemId={item.id}
                    type={ITEM_TYPE.COMMISSION}
                    />
                ))}
                {commItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                        No items found
                    </div>
                )}
                </div>
            </div>
        </div>
      );
  }