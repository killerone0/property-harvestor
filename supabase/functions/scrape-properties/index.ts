import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  url: string;
  location: string;
  propertyTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  exclusions?: string[];
}

const extractHighlights = (text: string): string[] => {
  const highlights: Set<string> = new Set();
  
  // Square footage
  const sqftMatch = text.match(/(\d+(?:,\d+)?)\s*(?:square feet|sq ft|sqft)/i);
  if (sqftMatch) highlights.add(`${sqftMatch[1]} sq ft`);
  
  // Common features
  const features = [
    { regex: /(?:private|rear|enclosed|beautiful|landscaped)\s+garden/i, text: 'Garden' },
    { regex: /garage/i, text: 'Garage' },
    { regex: /conservatory/i, text: 'Conservatory' },
    { regex: /recently\s+(?:renovated|refurbished|modernised|updated)/i, text: 'Recently renovated' },
    { regex: /off[\s-]street\s+parking/i, text: 'Off-street parking' },
    { regex: /en[\s-]suite/i, text: 'En-suite' },
    { regex: /(?:modern|newly\s+fitted)\s+kitchen/i, text: 'Modern kitchen' },
    { regex: /(?:south|north|east|west)[\s-]facing/i, output: (match) => `${match[0].toUpperCase()}${match.slice(1)} facing` },
    { regex: /double\s+glazing/i, text: 'Double glazing' },
    { regex: /central\s+heating/i, text: 'Central heating' },
  ];
  
  features.forEach(({ regex, text, output }) => {
    const match = text?.match(regex);
    if (match) {
      highlights.add(output ? output(match) : text);
    }
  });
  
  return Array.from(highlights);
};

const excludeProperty = (text: string, exclusions: string[]): boolean => {
  const exclusionPatterns = {
    retirement: /retirement|over[\s-](?:55|60|65)s|sheltered/i,
    auction: /auction|guide\s+price|for\s+sale\s+by\s+auction/i,
    sold_stc: /sold\s+stc|under\s+offer|sale\s+agreed/i,
    park_home: /park\s+home|mobile\s+home|residential\s+park/i,
  };

  return exclusions.some(exclusion => 
    exclusionPatterns[exclusion as keyof typeof exclusionPatterns]?.test(text)
  );
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, location, propertyTypes, minPrice, maxPrice, bedrooms, exclusions } = await req.json() as RequestBody
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY')
    
    if (!apiKey) {
      throw new Error('Firecrawl API key not configured')
    }

    // Initialize Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey })
    console.log(`Starting crawl for URL: ${url} with filters:`, { location, propertyTypes, minPrice, maxPrice, bedrooms, exclusions })
    
    // Crawl the website
    const result = await firecrawl.crawlUrl(url, {
      limit: 100,
      scrapeOptions: {
        formats: ['markdown', 'html'],
      }
    })

    if (!result.success) {
      throw new Error(result.error || 'Failed to crawl website')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Process and store the results
    const properties = result.data
      .filter(item => {
        const price = parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0');
        const bedroomCount = parseInt(item.bedrooms || '0');
        const itemType = item.propertyType?.toLowerCase();
        const description = (item.title || '') + ' ' + (item.description || '');
        
        // Check exclusions first
        if (exclusions?.length && excludeProperty(description, exclusions)) {
          return false;
        }
        
        return (
          (!minPrice || price >= minPrice) &&
          (!maxPrice || price <= maxPrice) &&
          (!bedrooms || bedrooms === 'any' || bedroomCount === parseInt(bedrooms)) &&
          (!propertyTypes?.length || propertyTypes.includes(itemType))
        );
      })
      .map((item: any) => ({
        title: item.title || 'Unknown Property',
        price: parseFloat(item.price?.replace(/[^0.9.]/g, '') || '0'),
        location: location,
        bedrooms: parseInt(item.bedrooms || '0'),
        property_type: (item.propertyType?.toLowerCase() || 'house') as 'house' | 'flat' | 'bungalow',
        source: new URL(url).hostname,
        image_url: item.imageUrl,
        url: item.url || url,
        highlights: extractHighlights((item.title || '') + ' ' + (item.description || '')),
      }));

    // Store properties in the database
    const { data, error } = await supabase
      .from('properties')
      .upsert(properties, { 
        onConflict: 'url',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error storing properties:', error)
      throw error
    }

    // Return the results
    return new Response(
      JSON.stringify({ success: true, properties: data }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in scrape-properties function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
