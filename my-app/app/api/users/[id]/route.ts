import { NextResponse, type NextRequest } from "next/server";

// This helper function is needed for static site generation
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  return NextResponse.json(
    {
      _id: id,
      name: "Sample User",
      email: "user@example.com",
      profileImage: "/images/avatar-placeholder.jpg",
      joinedAt: new Date().toISOString(),
      location: "Sample Location",
      bio: "This is a sample user for static generation",
      reviews: 10,
      rating: 4.5,
      isVerified: true,
    },
    { status: 200 }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { 
      success: true, 
      message: "User updated successfully",
    }, 
    { status: 200 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { 
      success: true, 
      message: "User deleted successfully",
    }, 
    { status: 200 }
  );
} 