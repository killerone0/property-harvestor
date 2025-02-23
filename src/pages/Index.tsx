
import { useState } from "react";
import { PropertySearchForm } from "@/components/PropertySearchForm";
import { PropertyResults } from "@/components/PropertyResults";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

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
      // Build the query
      let query = supabase
        .from('properties')
        .select('*')
        .ilike('location', `%${criteria.location}%`)
        .gte('price', criteria.minPrice)
        .lte('price', criteria.maxPrice);

      // Apply property type filter
      if (criteria.propertyTypes.length > 0) {
        query = query.in('property_type', criteria.propertyTypes);
      }

      // Apply bedrooms filter
      if (criteria.bedrooms !== 'any') {
        query = query.eq('bedrooms', parseInt(criteria.bedrooms));
      }

      // Apply date filter
      if (criteria.daysListed) {
        const cutoffDate = subDays(new Date(), criteria.daysListed);
        query = query.gte('created_at', cutoffDate.toISOString());
      }

      // Apply sorting
      switch (criteria.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'date_asc':
          query = query.order('created_at', { ascending: true });
          break;
        case 'date_desc':
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Execute query
      const { data: existingProperties, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // If we have results, show them immediately
      if (existingProperties && existingProperties.length > 0) {
        setProperties(existingProperties);
        toast({
          title: "Found Properties",
          description: `Showing ${existingProperties.length} properties matching your criteria`,
        });
      }

      // Get local estate agents
      const agentSites = await supabase.functions.invoke('get-local-agents', {
        body: { 
          location: criteria.location,
          radius: criteria.agentRadius
        }
      });

      // Combine default sites with local agent sites
      const sites = [
        `https://www.rightmove.co.uk/property-for-sale/find.html?searchType=SALE&locationIdentifier=${criteria.location}`,
        `https://www.zoopla.co.uk/for-sale/property/${criteria.location}`,
        `https://www.onthemarket.com/for-sale/${criteria.location}`,
        ...(agentSites.data?.agents || []).map((agent: any) => agent.website)
      ];

      // Scrape each site
      const scrapePromises = sites.map(url =>
        supabase.functions.invoke('scrape-properties', {
          body: { 
            url, 
            location: criteria.location,
            propertyTypes: criteria.propertyTypes,
            minPrice: criteria.minPrice,
            maxPrice: criteria.maxPrice,
            bedrooms: criteria.bedrooms
          }
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
        const { data: updatedProperties, error: updateError } = await query;

        if (updateError) throw updateError;

        if (updatedProperties) {
          setProperties(updatedProperties);
          toast({
            title: "Search Complete",
            description: `Found ${updatedProperties.length} properties matching your criteria`,
          });
        }
      } else if (existingProperties?.length === 0) {
        toast({
          title: "No Properties Found",
          description: "Try adjusting your search criteria",
          variant: "destructive",
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
