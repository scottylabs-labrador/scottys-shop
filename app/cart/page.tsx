"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
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
    const [totalPrice, setTotalPrice] = useState(0);
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
                setTotalPrice(cartMPItems.reduce((sum, item) => sum + item.price, 0));
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

    // useEffect(() => {
    //     const newTotalPrice = mpItems.reduce((sum, item) => sum + item.price, 0);
    //     setTotalPrice(newTotalPrice);
    // }, [mpItems]);

    if (loading) return <Loading />;

    return (
        <div className="flex max-w-7xl mx-auto px-4 py-6">
            {/* Cart items display */}
            <div className="w-3/4">
                <h1 className="text-4xl font-bold mb-4">Your Cart</h1>
                <hr className="mb-10 w-1/4 h-0.5 border-t-0 bg-neutral-100 dark:bg-white/10" />
                <h1 className="text-2xl font-bold mb-4">Marketplace</h1>
                <div className="flex-1 pl-9">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {mpItems.map((item) => (
                            <ItemCard key={item.id} itemId={item.id} type={ITEM_TYPE.MARKETPLACE} />
                        ))}
                        {mpItems.length === 0 && (
                            <div className="col-span-full text-center py-10 text-muted-foreground">
                                No items found
                            </div>
                        )}
                    </div>
                </div>
                <hr className="my-8 h-0.5 border-t-0 bg-neutral-100 dark:bg-white/10" />
                <h1 className="text-2xl font-bold mb-4">Commissions</h1>
                <div className="flex-1 pl-9">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {commItems.map((item) => (
                            <ItemCard key={item.id} itemId={item.id} type={ITEM_TYPE.COMMISSION} />
                        ))}
                        {commItems.length === 0 && (
                            <div className="col-span-full text-center py-10 text-muted-foreground">
                                No items found
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="w-1/4 pl-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold">Summary
                    </h2>
                    <p className="text-sm text-gray-600"> &#40;marketplace items only&#41;</p>
                    
                    {/* Subtotal*/}
                    <div className="my-5 flex justify-between items-center text-sm text-gray-600">
                        <span className="text-base">Subtotal</span>
                        <span className="font-bold text-lg text-black dark:text-white">${totalPrice.toFixed(2)}</span>
                    </div>

                    {/* Checkout Button */}
                    <button className="w-full mt-4 py-2 px-4 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 transition">
                        Proceed to Checkout
                    </button>
                </div>
            </div>

        </div>
      );
  }