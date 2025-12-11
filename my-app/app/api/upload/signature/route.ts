import { NextResponse, type NextRequest } from "next/server"
import { generateUploadSignature } from "@/app/actions/cloudinary"
import { z } from "zod"

const signatureRequestSchema = z.object({
  folder: z.enum(['properties', 'users', 'misc']).default('misc'),
  publicId: z.string().optional(),
  maxFileSize: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    
    // Validate request data
    const result = signatureRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Validation failed", 
          errors: result.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      )
    }
    
    const { folder, publicId, maxFileSize } = result.data

    // Generate upload signature for Cloudinary
    const signature = await generateUploadSignature({
      folder,
      ...(publicId && { public_id: publicId }),
      ...(maxFileSize && { maxFileSize }),
    })

    // Return signature and required parameters
    return NextResponse.json(
      {
        success: true,
        signature,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error generating upload signature:", error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Error generating upload signature", 
        error: error.message || "Unknown error" 
      }, 
      { status: 500 }
    )
  }
} 