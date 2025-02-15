"use client";

import { useUser, SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Loading from "@/components/utils/Loading";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BarChart3, Package, ShoppingCart } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockChartData = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3000 },
  { month: "Mar", sales: 5000 },
  { month: "Apr", sales: 2780 },
  { month: "May", sales: 4890 },
  { month: "Jun", sales: 3390 },
];

const mockItems = [
  { id: 1, name: "Product A", status: "Active", price: "$299" },
  { id: 2, name: "Product B", status: "Out of Stock", price: "$199" },
  { id: 3, name: "Product C", status: "Active", price: "$399" },
];

const mockOrders = [
  { id: 1, customer: "John Doe", total: "$599", status: "Completed" },
  { id: 2, customer: "Jane Smith", total: "$299", status: "Pending" },
];

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <Loading />;

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <SignIn />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col pt-4 !overflow-hidden">
      <div className="grid grid-cols-2 gap-8 px-4 h-[calc(100vh-10rem)]">
        {/* Numbers Card */}
        <Link href="/dashboard/numbers" className="block h-full">
          <Card className="h-full shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <BarChart3 className="h-6 w-6" />
                <CardTitle>Numbers</CardTitle>
              </div>
              <CardDescription>Manage your commission items</CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-8rem)] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Link>

        {/* Right Side - Items and Orders */}
        <div className="flex flex-col gap-8 h-full">
          {/* Items Card */}
          <Link href="/dashboard/items" className="h-1/2">
            <Card className="h-full shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Package className="h-6 w-6" />
                  <CardTitle>Items</CardTitle>
                </div>
                <CardDescription>Manage your marketplace items</CardDescription>
              </CardHeader>
              <CardContent>
                {mockItems.length > 0 ? (
                  <div className="space-y-2">
                    {mockItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.status}
                          </div>
                        </div>
                        <div className="font-semibold">{item.price}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    No items available.
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Orders Card */}
          <Link href="/dashboard/orders" className="h-1/2">
            <Card className="h-full shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <ShoppingCart className="h-6 w-6" />
                  <CardTitle>Orders</CardTitle>
                </div>
                <CardDescription>View recent orders</CardDescription>
              </CardHeader>
              <CardContent>
                {mockOrders.length > 0 ? (
                  <div className="space-y-2">
                    {mockOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{order.customer}</div>
                          <div className="text-sm text-gray-500">
                            {order.status}
                          </div>
                        </div>
                        <div className="font-semibold">{order.total}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    No orders available.
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
