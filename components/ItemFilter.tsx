"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal } from "lucide-react";
import { MPITEM_STATUS } from "@/convex/constants";

interface FilterProps {
  onFilterChange: (filters: any) => void;
  isMarketplace?: boolean;
}

export function ItemFilter({
  onFilterChange,
  isMarketplace = false,
}: FilterProps) {
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [maxTurnaroundDays, setMaxTurnaroundDays] = useState<number>(30);

  const handleFilterChange = () => {
    onFilterChange({
      minPrice,
      maxPrice,
      category: category || undefined,
      status: status || undefined,
      maxTurnaroundDays: !isMarketplace ? maxTurnaroundDays : undefined,
    });
  };

  const resetFilters = () => {
    setMinPrice(0);
    setMaxPrice(1000);
    setCategory(null);
    setStatus(null);
    setMaxTurnaroundDays(30);
    onFilterChange({});
  };

  const filterContent = (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Price Range</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Min</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Max</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Category</h4>
        <Select value={category || undefined} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="art">Art</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="photography">Photography</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isMarketplace ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Status</h4>
          <Select value={status || undefined} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={MPITEM_STATUS.AVAILABLE}>Available</SelectItem>
              <SelectItem value={MPITEM_STATUS.PENDING}>Pending</SelectItem>
              <SelectItem value={MPITEM_STATUS.SOLD}>Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Max Turnaround Days</h4>
          <div className="pt-2">
            <Slider
              value={[maxTurnaroundDays]}
              onValueChange={([value]) => setMaxTurnaroundDays(value)}
              max={30}
              step={1}
            />
            <span className="text-sm text-muted-foreground">
              {maxTurnaroundDays} days
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleFilterChange} className="flex-1">
          Apply
        </Button>
        <Button variant="outline" onClick={resetFilters}>
          Reset
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block w-[250px] p-4 border-r min-h-[calc(100vh-4rem)]">
        {filterContent}
      </div>

      {/* Mobile View */}
      <div className="md:hidden w-full p-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            {filterContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
