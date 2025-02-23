
import { formatDistance } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PropertyCardProps {
  property: {
    title: string;
    price: string;
    location: string;
    bedrooms: string;
    propertyType: string;
    source: string;
    imageUrl: string;
    lastUpdated: Date;
    url: string;
  };
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={property.imageUrl || "/placeholder.svg"}
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
        <CardTitle className="text-xl font-semibold text-gray-900">{property.price}</CardTitle>
        <CardDescription className="text-sm text-gray-600">{property.location}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{property.bedrooms} beds</Badge>
          <Badge variant="outline">{property.propertyType}</Badge>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center text-sm text-gray-500">
        <span>
          Updated {formatDistance(property.lastUpdated, new Date(), { addSuffix: true })}
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
