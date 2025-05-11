import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/db";

import User from "@/models/User";
import Property from "@/models/Property";
import Booking from "@/models/Booking";

// Dummy implementations, replace with real ones
async function getRevenueByMonth() {
  return [];
}

async function getBookingsByMonth() {
  return [];
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    // Type assertion to avoid TypeScript error
    const userRole = (session as any)?.user?.role;

    if (!session || userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "day":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
      default:
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const [
      totalUsers,
      newUsers,
      totalProperties,
      newProperties,
      totalBookings,
      newBookings,
      totalRevenueAgg,
      newRevenueAgg,
      propertyStatusCounts,
      bookingStatusCounts,
      userRoleCounts,
      revenueByMonth,
      bookingsByMonth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Property.countDocuments(),
      Property.countDocuments({ createdAt: { $gte: startDate } }),
      Booking.countDocuments(),
      Booking.countDocuments({ createdAt: { $gte: startDate } }),
      Booking.aggregate([
        { $match: { paymentStatus: "completed" } },
        { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            paymentStatus: "completed",
            createdAt: { $gte: startDate },
          },
        },
        { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
      ]),
      Property.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: "$isAdmin", count: { $sum: 1 } } }]),
      getRevenueByMonth(),
      getBookingsByMonth(),
    ]);

    const totalRevenue = totalRevenueAgg[0]?.totalAmount || 0;
    const newRevenue = newRevenueAgg[0]?.totalAmount || 0;

    return NextResponse.json({
      users: {
        total: totalUsers,
        new: newUsers,
        growth: totalUsers > 0 ? (newUsers / totalUsers) * 100 : 0,
        roleDistribution: userRoleCounts.map((r) => ({
          role: r._id ? "admin" : "user",
          count: r.count,
        })),
      },
      properties: {
        total: totalProperties,
        new: newProperties,
        growth: totalProperties > 0
          ? (newProperties / totalProperties) * 100
          : 0,
        statusDistribution: propertyStatusCounts,
      },
      bookings: {
        total: totalBookings,
        new: newBookings,
        growth: totalBookings > 0
          ? (newBookings / totalBookings) * 100
          : 0,
        statusDistribution: bookingStatusCounts,
      },
      revenue: {
        total: totalRevenue,
        new: newRevenue,
        growth: totalRevenue > 0 ? (newRevenue / totalRevenue) * 100 : 0,
        revenueByMonth,
        bookingsByMonth,
      },
    });
  } catch (error: any) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
