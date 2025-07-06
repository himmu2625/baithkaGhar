"use client"

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, UploadCloud, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { SpecialOfferCard } from "@/components/features/special-offers/SpecialOfferCard";
import { ISpecialOffer } from "@/models/SpecialOffer";
import { Progress } from "@/components/ui/progress";

const offerSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long.").max(100),
  subtitle: z.string().max(150).optional(),
  description: z.string().min(10, "Description must be at least 10 characters long.").max(500),
  label: z.string().max(50).optional(),
  tag: z.string().max(50).optional(),
  validUntil: z.date({ required_error: "Validity date is required." }),
  isActive: z.boolean().default(true),
  targetProperties: z.string().optional(), // Comma-separated string of ObjectIds
  imageUrl: z.string().url("A valid image URL is required."),
  publicId: z.string().min(1, "Image public ID is required."),
});

type SpecialOfferFormValues = z.infer<typeof offerSchema>;

interface SpecialOfferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ISpecialOffer>) => void;
  offer?: Partial<ISpecialOffer> | null;
  isLoading: boolean;
}

export function SpecialOfferForm({ isOpen, onClose, onSave, offer, isLoading }: SpecialOfferFormProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<SpecialOfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      isActive: true,
      ...offer,
      validUntil: offer?.validUntil ? new Date(offer.validUntil) : new Date(),
      targetProperties: Array.isArray(offer?.targetProperties) ? offer.targetProperties.join(", ") : "",
    },
  });

  const watchAllFields = form.watch();

  useEffect(() => {
    form.reset({
      isActive: true,
      ...offer,
      validUntil: offer?.validUntil ? new Date(offer.validUntil) : new Date(),
      targetProperties: Array.isArray(offer?.targetProperties) ? offer.targetProperties.join(", ") : "",
    });
  }, [offer, form]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const signResponse = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'special_offers' })
      });
      if (!signResponse.ok) throw new Error("Failed to get upload signature.");
      const signData = await signResponse.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`);
      xhr.upload.onprogress = (event) => {
        setUploadProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          form.setValue('imageUrl', response.secure_url);
          form.setValue('publicId', response.public_id);
          toast({ title: "Image uploaded successfully!" });
        } else {
          toast({ title: "Image upload failed.", variant: "destructive" });
        }
        setIsUploading(false);
      };
      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error during upload setup.", variant: "destructive" });
      setIsUploading(false);
    }
  };
  
  const onSubmit = (data: SpecialOfferFormValues) => {
    onSave({
        ...data,
        targetProperties: data.targetProperties?.split(',').map(id => id.trim()).filter(Boolean)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl grid-cols-1 md:grid-cols-2">
        <div className="p-4 space-y-4">
            <DialogHeader>
            <DialogTitle>{offer?._id ? "Edit Special Offer" : "Create Special Offer"}</DialogTitle>
            <DialogDescription>
                Fill in the details below. The preview will update as you type.
            </DialogDescription>
            </DialogHeader>
            <form id="special-offer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[60vh] p-1">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" {...form.register("title")} />
                        {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="subtitle">Subtitle</Label>
                        <Input id="subtitle" {...form.register("subtitle")} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="label">Label (e.g., 30% OFF)</Label>
                        <Input id="label" {...form.register("label")} />
                    </div>
                    <div>
                        <Label htmlFor="tag">Tag (e.g., Hot Deal)</Label>
                        <Input id="tag" {...form.register("tag")} />
                    </div>
                </div>
                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" {...form.register("description")} />
                    {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
                </div>
                <div>
                    <Label htmlFor="targetProperties">Target Property IDs (comma-separated)</Label>
                    <Input id="targetProperties" {...form.register("targetProperties")} placeholder="e.g. 60d21b4667d0d8992e610c85, ..."/>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-2">
                        <Label>Valid Until</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !watchAllFields.validUntil && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {watchAllFields.validUntil ? format(watchAllFields.validUntil, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={watchAllFields.validUntil} onSelect={(date) => form.setValue('validUntil', date!, { shouldValidate: true })} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                        <Switch id="isActive" checked={watchAllFields.isActive} onCheckedChange={(checked) => form.setValue('isActive', checked)} />
                        <Label htmlFor="isActive">Active</Label>
                    </div>
                </div>
                <div>
                    <Label>Offer Image</Label>
                    <div className="mt-1">
                        {watchAllFields.imageUrl && (
                            <div className="relative w-full h-48 rounded-md overflow-hidden mb-2">
                                <Image src={watchAllFields.imageUrl} alt="preview" layout="fill" objectFit="cover" />
                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => {form.setValue('imageUrl', ''); form.setValue('publicId', '');}}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-darkGreen hover:text-darkGreen/80 focus-within:outline-none">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => handleImageUpload(e.target.files![0])} accept="image/*" disabled={isUploading} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                {isUploading && <Progress value={uploadProgress} className="w-full mt-2" />}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            <SpecialOfferCard {...watchAllFields} validUntil={watchAllFields.validUntil || new Date()} isLivePreview />
        </div>
        <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" form="special-offer-form" disabled={isLoading || isUploading}>
            {isLoading ? "Saving..." : "Save Offer"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// A more complete form to be placed inside the form tag
/*
<div className="grid grid-cols-2 gap-4">
    <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
    </div>
    <div>
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input id="subtitle" {...form.register("subtitle")} />
    </div>
</div>
<div className="grid grid-cols-2 gap-4">
    <div>
        <Label htmlFor="label">Label (e.g., 30% OFF)</Label>
        <Input id="label" {...form.register("label")} />
    </div>
    <div>
        <Label htmlFor="tag">Tag (e.g., Hot Deal)</Label>
        <Input id="tag" {...form.register("tag")} />
    </div>
</div>
<div>
    <Label htmlFor="description">Description</Label>
    <Textarea id="description" {...form.register("description")} />
    {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
</div>
<div>
    <Label htmlFor="targetProperties">Target Property IDs (comma-separated)</Label>
    <Input id="targetProperties" {...form.register("targetProperties")} />
</div>
<div className="flex items-center justify-between">
    <div className="flex flex-col space-y-2">
        <Label>Valid Until</Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-[240px] justify-start text-left font-normal", !watchAllFields.validUntil && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchAllFields.validUntil ? format(watchAllFields.validUntil, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={watchAllFields.validUntil} onSelect={(date) => form.setValue('validUntil', date!)} initialFocus />
            </PopoverContent>
        </Popover>
    </div>
    <div className="flex items-center space-x-2">
        <Switch id="isActive" checked={watchAllFields.isActive} onCheckedChange={(checked) => form.setValue('isActive', checked)} />
        <Label htmlFor="isActive">Active</Label>
    </div>
</div>
<div>
    <Label>Offer Image</Label>
    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
            {watchAllFields.imageUrl ? (
                <>
                    <Image src={watchAllFields.imageUrl} alt="preview" width={200} height={200} className="mx-auto rounded-md" />
                    <Button variant="link" size="sm" onClick={() => form.setValue('imageUrl', '')}>Remove</Button>
                </>
            ) : (
                <>
                    <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-darkGreen hover:text-darkGreen/80 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => handleImageUpload(e.target.files![0])} accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                </>
            )}
            {isUploading && <Progress value={uploadProgress} className="w-full mt-2" />}
        </div>
    </div>
</div>
*/ 