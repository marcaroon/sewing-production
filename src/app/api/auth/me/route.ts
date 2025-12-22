// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
        avatar: user.avatar,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred",
      },
      { status: 500 }
    );
  }
}
