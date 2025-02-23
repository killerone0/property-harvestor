
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  location: string;
  radius: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { location, radius } = await req.json() as RequestBody

    // For now, we'll simulate finding local agents
    // In a real implementation, you'd want to use a geocoding service and proper estate agent database
    const mockAgents = [
      { name: "Local Homes", website: `https://localhomes.co.uk/properties/${location}` },
      { name: "Town & Country", website: `https://townandcountry.co.uk/search/${location}` },
      { name: "Premium Properties", website: `https://premiumproperties.co.uk/${location}` }
    ].filter(() => Math.random() > 0.3); // Randomly select some agents

    console.log(`Found ${mockAgents.length} agents within ${radius} miles of ${location}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        agents: mockAgents 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error finding local agents:', error)
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
