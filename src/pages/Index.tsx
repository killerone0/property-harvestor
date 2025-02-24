
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
  highlights?: string[];
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

      // Execute query to get existing properties
      const { data: existingProperties, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // If we have results, show them immediately
      if (existingProperties && existingProperties.length > 0) {
        setProperties(existingProperties);
        toast({
          title: "Found Existing Properties",
          description: `Showing ${existingProperties.length} properties from previous searches`,
        });
      }

      // Get local estate agents
      const agentSites = await supabase.functions.invoke('get-local-agents', {
        body: { 
          location: criteria.location,
          radius: parseInt(criteria.searchRadius)
        }
      });

      // Define search sources based on user selection
      const selectedSources = [];
      if (criteria.searchSources.includes('rightmove')) {
        selectedSources.push({
          url: `https://www.rightmove.co.uk/property-for-sale/find.html?searchType=SALE&locationIdentifier=${criteria.location}`,
          source: 'rightmove'
        });
      }
      if (criteria.searchSources.includes('zoopla')) {
        selectedSources.push({
          url: `https://www.zoopla.co.uk/for-sale/property/${criteria.location}`,
          source: 'zoopla'
        });
      }
      if (criteria.searchSources.includes('onthemarket')) {
        selectedSources.push({
          url: `https://www.onthemarket.com/for-sale/${criteria.location}`,
          source: 'onthemarket'
        });
      }

      // Add local agent sites
      const sites = [
        ...selectedSources,
        ...(agentSites.data?.agents || []).map((agent: any) => ({
          url: agent.website,
          source: 'local_agent'
        }))
      ];

      if (sites.length === 0) {
        toast({
          title: "No Search Sources Selected",
          description: "Please select at least one property website to search from.",
          variant: "destructive",
        });
        return;
      }

      // Scrape sites in batches to avoid rate limits
      const batchSize = 2; // Scrape 2 sites at a time
      const batches = [];
      
      for (let i = 0; i < sites.length; i += batchSize) {
        const batch = sites.slice(i, i + batchSize);
        
        try {
          const batchPromises = batch.map(site =>
            supabase.functions.invoke('scrape-properties', {
              body: { 
                url: site.url, 
                source: site.source,
                location: criteria.location,
                propertyTypes: criteria.propertyTypes,
                minPrice: criteria.minPrice,
                maxPrice: criteria.maxPrice,
                bedrooms: criteria.bedrooms,
                exclusions: criteria.exclusions
              }
            })
          );

          const batchResults = await Promise.allSettled(batchPromises);
          batches.push(...batchResults);

          // Wait 1 second between batches to respect rate limits
          if (i + batchSize < sites.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error: any) {
          console.error(`Batch scraping error:`, error);
          if (error.message?.includes('rate limit')) {
            toast({
              title: "Rate Limit Reached",
              description: "Please wait a minute before searching again.",
              variant: "destructive",
            });
            break;
          }
        }
      }

      // Process successful results
      const newProperties = batches
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
      } else if (!existingProperties || existingProperties.length === 0) {
        toast({
          title: "No Properties Found",
          description: "Try adjusting your search criteria or selecting different property websites",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch properties. Please try again.",
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
