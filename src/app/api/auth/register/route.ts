// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // 1. SECURITY CHECK: Cek apakah user sudah login & apakah dia Admin
    const currentUser = await getCurrentUser();

    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Access denied. Admin privileges required.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, name, department, role, phone } = body;

    // Validate required fields
    if (!email || !password || !name || !department || !role) {
      return NextResponse.json(
        {
          success: false,
          error: "All required fields must be provided",
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        department,
        role,
        phone: phone || null,
        isActive: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during user creation",
      },
      { status: 500 }
    );
  }
}
