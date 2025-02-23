
import { useState } from "react";
import { PropertySearchForm } from "@/components/PropertySearchForm";
import { PropertyResults } from "@/components/PropertyResults";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  property_type: 'house' | 'flat' | 'bungalow';
  source: string;
  image_url: string;
  url: string;
  updated_at: string;
}

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);

  const handleSearch = async (criteria: any) => {
    setIsLoading(true);
    try {
      // First, check for existing properties in the database
      const { data: existingProperties, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .ilike('location', `%${criteria.location}%`)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      // If we have recent results, show them immediately
      if (existingProperties && existingProperties.length > 0) {
        setProperties(existingProperties);
        toast({
          title: "Found Existing Properties",
          description: `Showing ${existingProperties.length} properties from our database`,
        });
      }

      // Scrape new properties
      const sites = [
        `https://www.rightmove.co.uk/property-for-sale/find.html?searchType=SALE&locationIdentifier=${criteria.location}`,
        `https://www.zoopla.co.uk/for-sale/property/${criteria.location}`,
        `https://www.onthemarket.com/for-sale/${criteria.location}`
      ];

      // Scrape each site
      const scrapePromises = sites.map(url =>
        supabase.functions.invoke('scrape-properties', {
          body: { url, location: criteria.location }
        })
      );

      const results = await Promise.allSettled(scrapePromises);

      // Process successful results
      const newProperties = results
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value.data?.success)
        .flatMap(result => result.value.data.properties);

      if (newProperties.length > 0) {
        // Get fresh data from database after scraping
        const { data: updatedProperties, error: updateError } = await supabase
          .from('properties')
          .select('*')
          .ilike('location', `%${criteria.location}%`)
          .order('updated_at', { ascending: false });

        if (updateError) throw updateError;

        setProperties(updatedProperties || []);
        toast({
          title: "Search Complete",
          description: `Found ${updatedProperties?.length || 0} properties matching your criteria`,
        });
      }

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
