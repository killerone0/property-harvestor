
import { useState } from "react";
import { PropertySearchForm } from "@/components/PropertySearchForm";
import { PropertyResults } from "@/components/PropertyResults";
import { useToast } from "@/components/ui/use-toast";
import { FirecrawlService } from "@/utils/FirecrawlService";

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState([]);

  const handleSearch = async (criteria: any) => {
    setIsLoading(true);
    try {
      // Here we'll implement the actual scraping logic with the Firecrawl service
      const sites = [
        `https://www.rightmove.co.uk/property-for-sale/find.html?searchType=SALE&locationIdentifier=${criteria.location}`,
        `https://www.zoopla.co.uk/for-sale/property/${criteria.location}`,
        `https://www.onthemarket.com/for-sale/${criteria.location}`
      ];
      
      // Example response structure (replace with actual scraping results)
      const mockProperties = [
        {
          title: "Beautiful 3-bed house",
          price: "£350,000",
          location: criteria.location,
          bedrooms: "3",
          propertyType: "House",
          source: "Rightmove",
          imageUrl: "/placeholder.svg",
          lastUpdated: new Date(),
          url: "#"
        },
        // Add more mock properties...
      ];
      
      setProperties(mockProperties);
      
      toast({
        title: "Search Complete",
        description: `Found ${mockProperties.length} properties matching your criteria`,
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Property Harvester</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find your perfect property across multiple platforms. We aggregate listings from Rightmove, Zoopla, and local estate agents.
          </p>
        </div>

        <div className="mb-12">
          <PropertySearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>

        <div className="mt-12">
          <PropertyResults properties={properties} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
