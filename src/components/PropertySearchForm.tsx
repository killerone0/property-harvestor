
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

interface SearchCriteria {
  location: string;
  minPrice: number;
  maxPrice: number;
  propertyTypes: string[];
  bedrooms: string;
  daysListed: number;
  agentRadius: number;
  sortBy: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc';
  exclusions: string[];
}

interface PropertySearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  isLoading: boolean;
}

const propertyTypeOptions = [
  { id: 'house', label: 'House' },
  { id: 'flat', label: 'Flat' },
  { id: 'bungalow', label: 'Bungalow' },
];

const exclusionOptions = [
  { id: 'retirement', label: 'Retirement Homes' },
  { id: 'auction', label: 'Auction Properties' },
  { id: 'sold_stc', label: 'Sold STC' },
  { id: 'park_home', label: 'Park Homes' },
];

export const PropertySearchForm = ({ onSearch, isLoading }: PropertySearchFormProps) => {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    location: "",
    minPrice: 0,
    maxPrice: 1000000,
    propertyTypes: [],
    bedrooms: "any",
    daysListed: 30,
    agentRadius: 5,
    sortBy: 'date_desc',
    exclusions: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(criteria);
  };

  const togglePropertyType = (typeId: string) => {
    setCriteria(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(typeId)
        ? prev.propertyTypes.filter(id => id !== typeId)
        : [...prev.propertyTypes, typeId]
    }));
  };

  const toggleExclusion = (exclusionId: string) => {
    setCriteria(prev => ({
      ...prev,
      exclusions: prev.exclusions.includes(exclusionId)
        ? prev.exclusions.filter(id => id !== exclusionId)
        : [...prev.exclusions, exclusionId]
    }));
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

      <div className="space-y-4">
        <Label>Property Types</Label>
        <div className="grid grid-cols-2 gap-4">
          {propertyTypeOptions.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <Checkbox
                id={type.id}
                checked={criteria.propertyTypes.includes(type.id)}
                onCheckedChange={() => togglePropertyType(type.id)}
              />
              <Label htmlFor={type.id} className="cursor-pointer">{type.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Exclude Properties</Label>
        <div className="grid grid-cols-2 gap-4">
          {exclusionOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`exclude-${option.id}`}
                checked={criteria.exclusions.includes(option.id)}
                onCheckedChange={() => toggleExclusion(option.id)}
              />
              <Label htmlFor={`exclude-${option.id}`} className="cursor-pointer">{option.label}</Label>
            </div>
          ))}
        </div>
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

      <div className="space-y-4">
        <Label>Listed Within (days)</Label>
        <div className="space-y-2">
          <Slider
            value={[criteria.daysListed]}
            onValueChange={([value]) => setCriteria({ ...criteria, daysListed: value })}
            max={90}
            step={1}
          />
          <div className="text-sm text-gray-500 text-center">
            {criteria.daysListed} days
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Search Radius for Estate Agents (miles)</Label>
        <div className="space-y-2">
          <Slider
            value={[criteria.agentRadius]}
            onValueChange={([value]) => setCriteria({ ...criteria, agentRadius: value })}
            min={1}
            max={50}
            step={1}
          />
          <div className="text-sm text-gray-500 text-center">
            {criteria.agentRadius} miles
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortBy">Sort By</Label>
        <Select
          value={criteria.sortBy}
          onValueChange={(value: 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc') => 
            setCriteria({ ...criteria, sortBy: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Newest First</SelectItem>
            <SelectItem value="date_asc">Oldest First</SelectItem>
            <SelectItem value="price_desc">Price (High to Low)</SelectItem>
            <SelectItem value="price_asc">Price (Low to High)</SelectItem>
          </SelectContent>
        </Select>
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
