
import { PropertyCard } from "./PropertyCard";

interface Property {
  title: string;
  price: string;
  location: string;
  bedrooms: string;
  propertyType: string;
  source: string;
  imageUrl: string;
  lastUpdated: Date;
  url: string;
}

interface PropertyResultsProps {
  properties: Property[];
  isLoading: boolean;
}

export const PropertyResults = ({ properties, isLoading }: PropertyResultsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-[400px]"></div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-gray-600">No properties found</h3>
        <p className="text-gray-500 mt-2">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property, index) => (
        <PropertyCard key={index} property={property} />
      ))}
    </div>
  );
};
