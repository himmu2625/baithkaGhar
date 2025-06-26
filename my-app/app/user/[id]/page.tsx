"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReportButton } from '@/components/ui/report-button';
import { ReportTargetType } from '@/models/reportTypes';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Calendar, MapPin, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Define user type
interface User {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  joinedAt: string;
  location?: string;
  bio?: string;
  reviews?: number;
  rating?: number;
  isVerified: boolean;
}

// Force dynamic routes with no static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function UserProfilePage() {
  const params = useParams();
  const userId = params && params.id ? String(params.id) : null;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        if (!userId) {
          throw new Error('User ID is missing');
        }
        
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user details');
        }
        
        const data = await response.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching user details');
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserDetails();
    } else {
      setLoading(false);
      setError('User ID is missing');
    }
  }, [userId]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Loading user profile...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-700">{error}</p>
        <Button className="mt-4" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }
  
  // Show not found state
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">User Not Found</h2>
        <p className="text-gray-700">The user profile you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button className="mt-4" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 border">
              <AvatarImage src={user.profileImage} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <ReportButton 
                  targetType={ReportTargetType.USER}
                  targetId={user._id}
                  targetName={user.name}
                  variant="outline"
                  size="sm"
                />
              </div>
              
              <div className="flex flex-wrap gap-4 mt-2">
                {user.isVerified && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Verified User
                  </Badge>
                )}
                
                <div className="flex items-center text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    Joined {format(new Date(user.joinedAt), "MMMM yyyy")}
                  </span>
                </div>
                
                {user.location && (
                  <div className="flex items-center text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}
                
                {user.rating && (
                  <div className="flex items-center text-gray-500">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    <span className="text-sm">
                      {user.rating.toFixed(1)} ({user.reviews} reviews)
                    </span>
                  </div>
                )}
              </div>
              
              {user.bio && (
                <p className="mt-4 text-gray-700">
                  {user.bio}
                </p>
              )}
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Contact</h3>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Additional sections like listings, reviews, etc. can be added here */}
      
      <div className="mt-8 flex justify-end">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>
    </div>
  );
} 