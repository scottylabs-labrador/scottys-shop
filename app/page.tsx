import { ItemGrid } from "@/components/ItemGrid";

export default function Home() {
  return (
    <div className="flex flex-col md:flex-row">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to Scotty's Shop!</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="max-w-sm rounded overflow-hidden shadow-lg">
            <div className="px-6 py-4">
              <div className="font-bold text-xl mb-2">Marketplace</div>
              <p className="text-gray-700 text-base">
                Featured Marketplace item
              </p>
            </div>
          </div>
            
          <div className="max-w-sm rounded overflow-hidden shadow-lg">
            <div className="px-6 py-4">
              <div className="font-bold text-xl mb-2">Commissions</div>
              <p className="text-gray-700 text-base">
                Featured commission
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
