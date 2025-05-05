"use client"

import React, { useState } from "react"
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  Share2, 
  Copy, 
  Check, 
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

// Social sharing platforms
enum SocialPlatform {
  FACEBOOK = "facebook",
  TWITTER = "twitter",
  LINKEDIN = "linkedin",
  WHATSAPP = "whatsapp",
  EMAIL = "email"
}

interface SocialShareProps {
  url: string
  title: string
  description?: string
  image?: string
  tags?: string[]
  className?: string
  variant?: "dropdown" | "buttons" | "icons"
}

export function SocialShare({
  url,
  title,
  description = "",
  image = "",
  tags = [],
  className = "",
  variant = "dropdown"
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  // Make sure we have an absolute URL
  const shareUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`
  
  // Encode all parameters for sharing
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)
  const encodedHashtags = tags.map(tag => tag.startsWith("#") ? tag.substring(1) : tag).join(",")
  
  // Generate sharing URLs for different platforms
  const sharePlatformUrl = (platform: SocialPlatform): string => {
    switch (platform) {
      case SocialPlatform.FACEBOOK:
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
      case SocialPlatform.TWITTER:
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&hashtags=${encodedHashtags}`
      case SocialPlatform.LINKEDIN:
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
      case SocialPlatform.WHATSAPP:
        return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
      case SocialPlatform.EMAIL:
        return `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
      default:
        return shareUrl
    }
  }
  
  // Open sharing link in a popup window
  const openShareWindow = (platform: SocialPlatform) => {
    const url = sharePlatformUrl(platform)
    
    if (platform === SocialPlatform.EMAIL) {
      window.location.href = url
      return
    }
    
    const width = 550
    const height = 450
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2
    
    window.open(
      url,
      `Share on ${platform}`,
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    )
  }
  
  // Copy URL to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard.",
        variant: "default",
      })
      
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy the link to your clipboard.",
        variant: "destructive",
      })
    }
  }
  
  // Render icons based on variant
  const renderShareContent = () => {
    if (variant === "dropdown") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => openShareWindow(SocialPlatform.FACEBOOK)}>
                <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                <span>Facebook</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openShareWindow(SocialPlatform.TWITTER)}>
                <Twitter className="mr-2 h-4 w-4 text-sky-500" />
                <span>Twitter</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openShareWindow(SocialPlatform.LINKEDIN)}>
                <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
                <span>LinkedIn</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openShareWindow(SocialPlatform.WHATSAPP)}>
                <div className="mr-2 h-4 w-4 text-green-500 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <span>WhatsApp</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openShareWindow(SocialPlatform.EMAIL)}>
                <Mail className="mr-2 h-4 w-4 text-gray-500" />
                <span>Email</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyToClipboard}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4 text-gray-500" />
                )}
                <span>Copy link</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
    
    if (variant === "buttons") {
      return (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium mb-1">Share this listing:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openShareWindow(SocialPlatform.FACEBOOK)}
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Facebook</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openShareWindow(SocialPlatform.TWITTER)}
            >
              <Twitter className="h-4 w-4 text-sky-500" />
              <span className="hidden sm:inline">Twitter</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => openShareWindow(SocialPlatform.WHATSAPP)}
            >
              <div className="h-4 w-4 text-green-500 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
            {!expanded ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setExpanded(true)}
              >
                <ChevronDown className="h-4 w-4" />
                <span className="hidden sm:inline">More</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => openShareWindow(SocialPlatform.LINKEDIN)}
                >
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <span className="hidden sm:inline">LinkedIn</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => openShareWindow(SocialPlatform.EMAIL)}
                >
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="hidden sm:inline">Email</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="hidden sm:inline">Copy</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setExpanded(false)}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Less</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )
    }
    
    // Default icons layout
    return (
      <div className="flex gap-2 items-center">
        <p className="text-sm font-medium mr-1">Share:</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => openShareWindow(SocialPlatform.FACEBOOK)}
        >
          <Facebook className="h-4 w-4 text-blue-600" />
          <span className="sr-only">Share on Facebook</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => openShareWindow(SocialPlatform.TWITTER)}
        >
          <Twitter className="h-4 w-4 text-sky-500" />
          <span className="sr-only">Share on Twitter</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => openShareWindow(SocialPlatform.WHATSAPP)}
        >
          <div className="h-4 w-4 text-green-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <span className="sr-only">Share on WhatsApp</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={copyToClipboard}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-gray-500" />
          )}
          <span className="sr-only">Copy link</span>
        </Button>
      </div>
    )
  }
  
  return (
    <div className={cn("social-share", className)}>
      {renderShareContent()}
    </div>
  )
}
