// // app/api/orders/[id]/transfers/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/prisma";

// // GET /api/orders/[id]/transfers
// export async function GET(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const transfers = await prisma.transferLog.findMany({
//       where: {
//         orderId: (await params).id,
//       },
//       include: {
//         items: true,
//       },
//       orderBy: {
//         transferDate: "desc",
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       data: transfers,
//     });
//   } catch (error) {
//     console.error("Error fetching transfer logs:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to fetch transfer logs",
//       },
//       { status: 500 }
//     );
//   }
// }
