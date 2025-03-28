
import { formatDistance } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={property.image_url || "/placeholder.svg"}
          alt={property.title}
          className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
        />
        <Badge 
          className="absolute top-2 right-2 bg-white/90 text-gray-800"
          variant="secondary"
        >
          {property.source}
        </Badge>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">£{property.price.toLocaleString()}</CardTitle>
        <CardDescription className="text-sm text-gray-600">{property.location}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline">{property.bedrooms} beds</Badge>
          <Badge variant="outline">{property.property_type}</Badge>
        </div>
        <p className="mb-4 text-sm text-gray-700">{property.title}</p>
        
        {property.highlights && property.highlights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700">Key Features:</h4>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {property.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between items-center text-sm text-gray-500">
        <span>
          Updated {formatDistance(new Date(property.updated_at), new Date(), { addSuffix: true })}
        </span>
        <a
          href={property.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8BA888] hover:text-[#7A957E] font-medium transition-colors"
        >
          View Details →
        </a>
      </CardFooter>
    </Card>
  );
};
