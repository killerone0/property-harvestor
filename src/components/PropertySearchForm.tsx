
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface SearchCriteria {
  location: string;
  minPrice: number;
  maxPrice: number;
  propertyType: string;
  bedrooms: string;
}

interface PropertySearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
}

export const PropertySearchForm = ({ onSearch, isLoading }: PropertySearchFormProps) => {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    location: "",
    minPrice: 0,
    maxPrice: 1000000,
    propertyType: "any",
    bedrooms: "any",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-sm border border-gray-100 transition-all duration-300">
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Enter city, postcode, or area"
          value={criteria.location}
          onChange={(e) => setCriteria({ ...criteria, location: e.target.value })}
          className="w-full transition-all duration-200"
          required
        />
      </div>

      <div className="space-y-4">
        <Label>Price Range</Label>
        <div className="flex items-center space-x-4">
          <Input
            type="number"
            placeholder="Min"
            value={criteria.minPrice}
            onChange={(e) => setCriteria({ ...criteria, minPrice: Number(e.target.value) })}
            className="w-1/2"
          />
          <span>to</span>
          <Input
            type="number"
            placeholder="Max"
            value={criteria.maxPrice}
            onChange={(e) => setCriteria({ ...criteria, maxPrice: Number(e.target.value) })}
            className="w-1/2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type</Label>
          <Select
            value={criteria.propertyType}
            onValueChange={(value) => setCriteria({ ...criteria, propertyType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="bungalow">Bungalow</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Select
            value={criteria.bedrooms}
            onValueChange={(value) => setCriteria({ ...criteria, bedrooms: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select bedrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-[#8BA888] hover:bg-[#7A957E] transition-colors"
        disabled={isLoading}
      >
        {isLoading ? "Searching..." : "Search Properties"}
      </Button>
    </form>
  );
};
