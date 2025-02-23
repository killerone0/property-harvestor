
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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, location } = await req.json() as RequestBody
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY')
    
    if (!apiKey) {
      throw new Error('Firecrawl API key not configured')
    }

    // Initialize Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey })
    console.log(`Starting crawl for URL: ${url}`)
    
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
    const properties = result.data.map((item: any) => ({
      title: item.title || 'Unknown Property',
      price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0'),
      location: location,
      bedrooms: parseInt(item.bedrooms || '0'),
      property_type: item.propertyType?.toLowerCase() || 'house',
      source: new URL(url).hostname,
      image_url: item.imageUrl,
      url: item.url || url,
    }))

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
