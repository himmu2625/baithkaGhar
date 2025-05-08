"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { ListPropertyClientWrapper } from "./client-wrapper";

export const dynamic = "force-dynamic";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Building,
  Home,
  Hotel,
  Bed,
  Bath,
  Wifi,
  Tv,
  CookingPotIcon as Kitchen,
  Car,
  Upload,
  Check,
  MapPin,
  DollarSign,
} from "lucide-react";
import Image from "next/image";

export default function ListPropertyPage() {
  const [activeTab, setActiveTab] = useState("basic");
  const [propertyType, setPropertyType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    bedrooms: "",
    bathrooms: "",
    price: "",
  });
  const [amenities, setAmenities] = useState({
    wifi: false,
    tv: false,
    kitchen: false,
    parking: false,
    ac: false,
    pool: false,
  });
  const [images, setImages] = useState<string[]>([]);
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [amenity]: !prev[amenity] }));
  };

  const handleImageUpload = () => {
    // In a real app, this would handle file uploads
    // For now, we'll just add placeholder images
    setImages((prev) => [
      ...prev,
      `/placeholder.svg?height=300&width=400&text=Image ${prev.length + 1}`,
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Reset form or redirect
    setIsSubmitting(false);
    alert("Property submitted successfully!");
  };

  const propertyTypes = [
    { value: "apartment", label: "Apartment", icon: Building },
    { value: "house", label: "House", icon: Home },
    { value: "hotel", label: "Hotel", icon: Hotel },
    { value: "villa", label: "Villa", icon: Home },
    { value: "resort", label: "Resort", icon: Hotel },
  ];

  return (
    <ListPropertyClientWrapper>
      <main className="pt-24 pb-16">
        {navigationError ? (
          <div className="container mx-auto px-4 py-16">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Navigation Error: </strong>
              <span className="block sm:inline">{navigationError}</span>
              <div className="mt-4">
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow mr-2"
                >
                  Go to Home Page
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-lightGreen text-darkGreen"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        ) : isPageLoading ? (
          <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 border-4 border-lightGreen border-t-transparent rounded-full animate-spin"></div>
              <p className="text-mediumGreen mt-4">
                Loading property listing page...
              </p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-darkGreen mb-2">
                  List Your Property
                </h1>
                <p className="text-mediumGreen">
                  Share your space and start earning
                </p>
              </div>

              <Card className="border-lightGreen shadow-md">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-darkGreen text-xl sm:text-2xl">
                    Property Details
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Fill in the details about your property
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 mb-6 sm:mb-8">
                      <TabsTrigger
                        value="basic"
                        className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen text-xs sm:text-sm py-1.5"
                      >
                        Basic Info
                      </TabsTrigger>
                      <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen text-xs sm:text-sm py-1.5"
                      >
                        Details & Amenities
                      </TabsTrigger>
                      <TabsTrigger
                        value="photos"
                        className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen text-xs sm:text-sm py-1.5"
                      >
                        Photos & Pricing
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">
                          Property Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Enter property name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="border-lightGreen focus:border-lightGreen text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Property Type</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                          {propertyTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <div
                                key={type.value}
                                className={`border rounded-lg p-2 sm:p-3 text-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                                  propertyType === type.value
                                    ? "border-lightGreen bg-lightGreen/20"
                                    : "border-gray-200"
                                }`}
                                onClick={() => setPropertyType(type.value)}
                              >
                                <Icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-mediumGreen" />
                                <span className="text-xs sm:text-sm font-medium text-darkGreen">
                                  {type.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm">
                          Address
                        </Label>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-mediumGreen mr-2" />
                          <Input
                            id="address"
                            name="address"
                            placeholder="Street address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm">
                            City
                          </Label>
                          <Input
                            id="city"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm">
                            State
                          </Label>
                          <Input
                            id="state"
                            name="state"
                            placeholder="State"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-sm">
                            Zip Code
                          </Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            placeholder="Zip code"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Describe your property"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="min-h-[100px] sm:min-h-[120px] border-lightGreen focus:border-lightGreen text-sm"
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => setActiveTab("details")}
                          className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow text-sm"
                        >
                          Next: Details & Amenities
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bedrooms">Bedrooms</Label>
                          <div className="flex items-center">
                            <Bed className="h-5 w-5 text-mediumGreen mr-2" />
                            <Select
                              value={formData.bedrooms}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  bedrooms: value,
                                }))
                              }
                            >
                              <SelectTrigger className="border-lightGreen">
                                <SelectValue placeholder="Select number of bedrooms" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 1 ? "Bedroom" : "Bedrooms"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bathrooms">Bathrooms</Label>
                          <div className="flex items-center">
                            <Bath className="h-5 w-5 text-mediumGreen mr-2" />
                            <Select
                              value={formData.bathrooms}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  bathrooms: value,
                                }))
                              }
                            >
                              <SelectTrigger className="border-lightGreen">
                                <SelectValue placeholder="Select number of bathrooms" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(
                                  (num) => (
                                    <SelectItem
                                      key={num}
                                      value={num.toString()}
                                    >
                                      {num}{" "}
                                      {num === 1 ? "Bathroom" : "Bathrooms"}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Amenities</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.wifi
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("wifi")}
                          >
                            <Wifi className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              WiFi
                            </span>
                            {amenities.wifi && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.tv
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("tv")}
                          >
                            <Tv className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              TV
                            </span>
                            {amenities.tv && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.kitchen
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("kitchen")}
                          >
                            <Kitchen className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              Kitchen
                            </span>
                            {amenities.kitchen && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.parking
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("parking")}
                          >
                            <Car className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              Parking
                            </span>
                            {amenities.parking && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.ac
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("ac")}
                          >
                            <svg
                              className="h-5 w-5 text-mediumGreen mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M9.25 7C9.25 8.24264 8.24264 9.25 7 9.25C5.75736 9.25 4.75 8.24264 4.75 7C4.75 5.75736 5.75736 4.75 7 4.75C8.24264 4.75 9.25 5.75736 9.25 7Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                              <path
                                d="M9.25 17C9.25 18.2426 8.24264 19.25 7 19.25C5.75736 19.25 4.75 18.2426 4.75 17C4.75 15.7574 5.75736 14.75 7 14.75C8.24264 14.75 9.25 15.7574 9.25 17Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                              <path
                                d="M19.25 7C19.25 8.24264 18.2426 9.25 17 9.25C15.7574 9.25 14.75 8.24264 14.75 7C14.75 5.75736 15.7574 4.75 17 4.75C18.2426 4.75 19.25 5.75736 19.25 7Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                              <path
                                d="M19.25 17C19.25 18.2426 18.2426 19.25 17 19.25C15.7574 19.25 14.75 18.2426 14.75 17C14.75 15.7574 15.7574 14.75 17 14.75C18.2426 14.75 19.25 15.7574 19.25 17Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                            </svg>
                            <span className="text-sm font-medium text-darkGreen">
                              AC
                            </span>
                            {amenities.ac && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.pool
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("pool")}
                          >
                            <svg
                              className="h-5 w-5 text-mediumGreen mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M2 16C2 13.7909 3.79086 12 6 12C8.20914 12 10 13.7909 10 16M10 16C10 13.7909 11.7909 12 14 12C16.2091 12 18 13.7909 18 16M18 16C18 13.7909 19.7909 12 22 12M22 20C19.7909 20 18 18.2091 18 16M18 16C18 18.2091 16.2091 20 14 20C11.7909 20 10 18.2091 10 16M10 16C10 18.2091 8.20914 20 6 20C3.79086 20 2 18.2091 2 16M6 12C6 9.79086 7.79086 8 10 8C12.2091 8 14 9.79086 14 12M14 12C14 9.79086 15.7909 8 18 8C20.2091 8 22 9.79086 22 12M22 8C19.7909 8 18 6.20914 18 4M6 4C8.20914 4 10 5.79086 10 8M10 8C10 5.79086 11.7909 4 14 4C16.2091 4 18 5.79086 18 8M18 8C18 5.79086 19.7909 4 22 4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              ></path>
                            </svg>
                            <span className="text-sm font-medium text-darkGreen">
                              Pool
                            </span>
                            {amenities.pool && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("basic")}
                          className="border-lightGreen text-darkGreen"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => setActiveTab("photos")}
                          className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow"
                        >
                          Next: Photos & Pricing
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="photos" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Property Photos</Label>
                        <div className="border-2 border-dashed border-lightGreen rounded-lg p-6 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-mediumGreen" />
                          <p className="text-sm text-darkGreen mb-2">
                            Drag and drop your photos here, or click to browse
                          </p>
                          <Button
                            variant="outline"
                            onClick={handleImageUpload}
                            className="border-lightGreen text-darkGreen"
                          >
                            Upload Photos
                          </Button>
                        </div>
                      </div>

                      {images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          {images.map((image, index) => (
                            <div
                              key={index}
                              className="relative rounded-lg overflow-hidden h-32"
                            >
                              <Image
                                src={image || "/placeholder.svg"}
                                alt={`Property ${index + 1}`}
                                width={400}
                                height={300}
                                className="object-cover"
                              />
                              <button
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                onClick={() =>
                                  setImages((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="price">Price per Night</Label>
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-mediumGreen mr-2" />
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            placeholder="Enter price per night"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("details")}
                          className="border-lightGreen text-darkGreen"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Submitting...
                            </span>
                          ) : (
                            "Submit Property"
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-4">
                  <p className="text-sm text-mediumGreen">
                    By submitting, you agree to our{" "}
                    <a href="/terms" className="text-darkGreen hover:underline">
                      Terms and Conditions
                    </a>
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </main>
    </ListPropertyClientWrapper>
  );
}
