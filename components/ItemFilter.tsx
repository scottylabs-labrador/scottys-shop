import { useState, useEffect } from "react";
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
import { SlidersHorizontal, X } from "lucide-react";
import { ITEM_CATEGORIES } from "@/convex/constants";
import { Input } from "@/components/ui/input";

interface FilterState {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition?: string;
  maxTurnaroundDays?: number;
}

interface FilterProps {
  onFilterChange: (filters: FilterState) => void;
  isMarketplace?: boolean;
  initialFilters?: FilterState;
}

interface ActiveFilter {
  type: string;
  value: string;
  displayValue: string;
}

const categories = Object.values(ITEM_CATEGORIES);

export function ItemFilter({
  onFilterChange,
  isMarketplace = false,
  initialFilters = {},
}: FilterProps) {
  const [priceRange, setPriceRange] = useState<number[]>([
    initialFilters.minPrice || 0,
    initialFilters.maxPrice || 1000,
  ]);
  const [category, setCategory] = useState<string | undefined>(
    initialFilters.category
  );
  const [condition, setCondition] = useState<string | undefined>(
    initialFilters.condition
  );
  const [maxTurnaroundDays, setMaxTurnaroundDays] = useState<number>(
    initialFilters.maxTurnaroundDays || 30
  );
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  useEffect(() => {
    const initialActiveFilters: ActiveFilter[] = [];

    if (
      (initialFilters.minPrice && initialFilters.minPrice > 0) ||
      (initialFilters.maxPrice && initialFilters.maxPrice < 1000)
    ) {
      initialActiveFilters.push({
        type: "price",
        value: `${initialFilters.minPrice || 0}-${initialFilters.maxPrice || 1000}`,
        displayValue: `$${initialFilters.minPrice || 0} - $${initialFilters.maxPrice || 1000}`,
      });
    }

    if (initialFilters.category) {
      initialActiveFilters.push({
        type: "category",
        value: initialFilters.category,
        displayValue: initialFilters.category,
      });
    }

    if (initialFilters.condition) {
      initialActiveFilters.push({
        type: "condition",
        value: initialFilters.condition,
        displayValue: initialFilters.condition,
      });
    }

    if (
      !isMarketplace &&
      initialFilters.maxTurnaroundDays &&
      initialFilters.maxTurnaroundDays < 30
    ) {
      initialActiveFilters.push({
        type: "turnaround",
        value: initialFilters.maxTurnaroundDays.toString(),
        displayValue: `${initialFilters.maxTurnaroundDays} days`,
      });
    }

    setActiveFilters(initialActiveFilters);
  }, []);

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const newPriceRange = [value, priceRange[1]];
    if (value >= 0 && value <= priceRange[1]) {
      setPriceRange(newPriceRange);
    }
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const newPriceRange = [priceRange[0], value];
    if (value >= priceRange[0] && value <= 1000) {
      setPriceRange(newPriceRange);
    }
  };

  const handleFilterChange = () => {
    const [minPrice, maxPrice] = priceRange;
    const newFilters: ActiveFilter[] = [];

    // Only add price filter if it's different from default range
    if (minPrice > 0 || maxPrice < 1000) {
      newFilters.push({
        type: "price",
        value: `${minPrice}-${maxPrice}`,
        displayValue: `$${minPrice} - $${maxPrice}`,
      });
    }

    if (category) {
      newFilters.push({
        type: "category",
        value: category,
        displayValue: category,
      });
    }

    if (condition) {
      newFilters.push({
        type: "condition",
        value: condition,
        displayValue: condition,
      });
    }

    if (!isMarketplace && maxTurnaroundDays < 30) {
      newFilters.push({
        type: "turnaround",
        value: maxTurnaroundDays.toString(),
        displayValue: `${maxTurnaroundDays} days`,
      });
    }

    setActiveFilters(newFilters);

    onFilterChange({
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 1000 ? maxPrice : undefined,
      category,
      condition,
      maxTurnaroundDays: !isMarketplace ? maxTurnaroundDays : undefined,
    });
  };

  const removeFilter = (filterToRemove: ActiveFilter) => {
    switch (filterToRemove.type) {
      case "price":
        setPriceRange([0, 1000]);
        break;
      case "category":
        setCategory(undefined);
        break;
      case "condition":
        setCondition(undefined);
        break;
      case "turnaround":
        setMaxTurnaroundDays(30);
        break;
    }

    const newFilters = activeFilters.filter(
      (filter) => filter.type !== filterToRemove.type
    );
    setActiveFilters(newFilters);

    onFilterChange({
      minPrice:
        filterToRemove.type === "price"
          ? undefined
          : priceRange[0] > 0
            ? priceRange[0]
            : undefined,
      maxPrice:
        filterToRemove.type === "price"
          ? undefined
          : priceRange[1] < 1000
            ? priceRange[1]
            : undefined,
      category: filterToRemove.type === "category" ? undefined : category,
      condition: filterToRemove.type === "condition" ? undefined : condition,
      maxTurnaroundDays:
        filterToRemove.type === "turnaround"
          ? undefined
          : !isMarketplace
            ? maxTurnaroundDays
            : undefined,
    });
  };

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setCategory(undefined);
    setCondition(undefined);
    setMaxTurnaroundDays(30);
    setActiveFilters([]);
    onFilterChange({});
  };

  const filterTabs =
    activeFilters.length > 0 ? (
      <div className="space-y-2">
        <h4 className="text-sm font-rubik font-medium">Selected Filters</h4>
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg text-sm font-rubik"
            >
              <span>{filter.displayValue}</span>
              <button
                onClick={() => removeFilter(filter)}
                className="hover:bg-secondary-foreground/10 rounded-full p-1 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  const filterContent = (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-sm font-rubik font-medium">Price Range</h4>
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              type="number"
              value={priceRange[0]}
              onChange={handleMinPriceChange}
              min={0}
              max={priceRange[1]}
              className="w-full font-rubik"
              placeholder="Min price"
            />
          </div>
          <span className="text-muted-foreground font-rubik">to</span>
          <div className="flex-1">
            <Input
              type="number"
              value={priceRange[1]}
              onChange={handleMaxPriceChange}
              min={priceRange[0]}
              max={1000}
              className="w-full font-rubik"
              placeholder="Max price"
            />
          </div>
        </div>
        <div className="pt-2">
          <div className="h-2">
            <div className="w-full h-2 rounded-full bg-secondary">
              <div
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${((priceRange[1] - priceRange[0]) / 1000) * 100}%`,
                  marginLeft: `${(priceRange[0] / 1000) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-rubik font-medium">Category</h4>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="cursor-pointer font-rubik">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem
                key={cat}
                value={cat}
                className="cursor-pointer font-rubik"
              >
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isMarketplace ? (
        <div className="space-y-2">
          <h4 className="text-sm font-rubik font-medium">Condition</h4>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger className="cursor-pointer font-rubik">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New" className="cursor-pointer font-rubik">
                New
              </SelectItem>
              <SelectItem
                value="Like New"
                className="cursor-pointer font-rubik"
              >
                Like New
              </SelectItem>
              <SelectItem value="Good" className="cursor-pointer font-rubik">
                Good
              </SelectItem>
              <SelectItem value="Fair" className="cursor-pointer font-rubik">
                Fair
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-sm font-rubik font-medium">
            Max Turnaround Days
          </h4>
          <div className="pt-2">
            <div className="h-2 cursor-pointer">
              <Slider
                value={[maxTurnaroundDays]}
                onValueChange={([value]) => setMaxTurnaroundDays(value)}
                max={30}
                step={1}
                className="w-full cursor-pointer"
              />
            </div>
            <span className="text-sm font-rubik text-muted-foreground mt-2 block">
              {maxTurnaroundDays} days
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleFilterChange} className="flex-1 font-rubik">
          Apply
        </Button>
        <Button variant="outline" onClick={resetFilters} className="font-rubik">
          Reset
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block w-[250px] p-6 border-r min-h-[calc(100vh-4rem)] sticky top-[8rem]">
        {filterTabs}
        <div className={activeFilters.length > 0 ? "mt-6" : ""}>
          {filterContent}
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden w-full p-4 sticky top-[8rem] bg-background z-10">
        {filterTabs}
        <div className={activeFilters.length > 0 ? "mt-4" : ""}>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full cursor-pointer font-rubik"
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="font-rubik font-medium">
                  Filters
                </SheetTitle>
              </SheetHeader>
              {filterContent}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
