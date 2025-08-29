import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '30d';
    const view = searchParams.get('view') || 'summary';

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Calculate date ranges based on period
    const currentDate = new Date()
    let startDate: Date
    let endDate: Date
    let lastPeriodStart: Date
    let lastPeriodEnd: Date

    switch (period) {
      case 'thisMonth':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        lastPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
        break
      case 'lastMonth':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
        lastPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0)
        break
      case 'last3Months':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        lastPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 0)
        break
      case 'thisYear':
        startDate = new Date(currentDate.getFullYear(), 0, 1)
        endDate = new Date(currentDate.getFullYear(), 11, 31)
        lastPeriodStart = new Date(currentDate.getFullYear() - 1, 0, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear() - 1, 11, 31)
        break
      default:
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        lastPeriodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
        lastPeriodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)
    }

    // Define a lean booking type to satisfy TypeScript when using .lean()
    type LeanBooking = {
      _id: { toString(): string } | string
      userId?: { name?: string; email?: string } | null
      totalAmount?: number
      status?: string
      paymentStatus?: string
      createdAt: Date
    }

    // Get bookings for current period
    const currentBookings = (await Booking.find({
      propertyId: propertyId,
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('userId', 'name email')
      .lean()) as unknown as LeanBooking[]

    // Get bookings for last period for comparison
    const lastPeriodBookings = await Booking.find({
      propertyId: propertyId,
      createdAt: { $gte: lastPeriodStart, $lte: lastPeriodEnd }
    }).lean()

    // Calculate revenue
    const currentRevenue = currentBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    const lastPeriodRevenue = lastPeriodBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0)
    const revenueGrowth = lastPeriodRevenue > 0 ? ((currentRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100 : 0

    // Revenue by source (mock data - can be enhanced with actual tracking)
    const revenueBySource = [
      { source: 'Direct Bookings', amount: currentRevenue * 0.6, percentage: 60 },
      { source: 'Online Platforms', amount: currentRevenue * 0.3, percentage: 30 },
      { source: 'Travel Agents', amount: currentRevenue * 0.1, percentage: 10 }
    ]

    // Mock expenses data (can be enhanced with actual expense tracking)
    const totalExpenses = currentRevenue * 0.3 // Assume 30% expenses
    const expenseCategories = [
      { category: 'Maintenance', amount: totalExpenses * 0.4, percentage: 40 },
      { category: 'Utilities', amount: totalExpenses * 0.25, percentage: 25 },
      { category: 'Staff', amount: totalExpenses * 0.2, percentage: 20 },
      { category: 'Marketing', amount: totalExpenses * 0.1, percentage: 10 },
      { category: 'Other', amount: totalExpenses * 0.05, percentage: 5 }
    ]

    // Calculate profit
    const grossProfit = currentRevenue - totalExpenses
    const netProfit = grossProfit * 0.85 // After taxes and other deductions
    const profitMargin = currentRevenue > 0 ? (netProfit / currentRevenue) * 100 : 0

    // Booking statistics
    const completedBookings = currentBookings.filter(b => b.status === 'confirmed').length
    const pendingPayments = currentBookings.filter(b => b.paymentStatus === 'pending').length
    const averageBookingValue = completedBookings > 0 ? currentRevenue / completedBookings : 0

    // Generate payment history from bookings
    const payments = currentBookings.map(booking => ({
      id: booking._id.toString(),
      bookingId: booking._id.toString(),
      guestName: booking.userId?.name || 'Guest',
      amount: booking.totalAmount || 0,
      method: 'Card', // Mock data
      status: booking.paymentStatus || 'completed',
      date: booking.createdAt,
      type: 'booking'
    }))

    // Tax information (mock data)
    const taxRate = 18 // GST rate
    const taxCollected = currentRevenue * (taxRate / 100)
    const pendingTax = pendingPayments * (taxRate / 100)

    const financialData = {
      revenue: {
        total: currentRevenue,
        thisMonth: currentRevenue,
        lastMonth: lastPeriodRevenue,
        growth: revenueGrowth,
        daily: [], // Can be enhanced with daily breakdown
        bySource: revenueBySource
      },
      expenses: {
        total: totalExpenses,
        thisMonth: totalExpenses,
        categories: expenseCategories
      },
      profit: {
        gross: grossProfit,
        net: netProfit,
        margin: profitMargin
      },
      bookings: {
        totalValue: currentRevenue,
        averageValue: averageBookingValue,
        completedBookings,
        pendingPayments
      },
      payments: payments.slice(0, 20), // Limit to recent 20 payments
      taxes: {
        totalCollected: taxCollected,
        pending: pendingTax,
        rate: taxRate
      }
    }

    // Enhanced financial data with new view options
    if (view === 'summary') {
      const enhancedData = await enhanceWithTransactionData(financialData, propertyId, startDate, endDate);
      return NextResponse.json({
        success: true,
        financial: enhancedData,
        period: range
      });
    } else if (view === 'detailed') {
      const detailedFinancials = await getDetailedFinancials(propertyId, startDate, endDate);
      return NextResponse.json({ 
        success: true,
        financial: detailedFinancials 
      });
    } else if (view === 'cashflow') {
      const cashflowData = await getCashflowData(propertyId, startDate, endDate);
      return NextResponse.json({ 
        success: true,
        financial: cashflowData 
      });
    }

    return NextResponse.json({
      success: true,
      financials: financialData,
      period: range
    });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}

// POST: Create financial transaction
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const body = await request.json();

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate transaction data
    const { type, amount, category, description, date, paymentMethod, reference, taxAmount = 0 } = body;

    if (!type || !amount || !category || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const transaction = {
      propertyId: new ObjectId(propertyId),
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: new Date(date || Date.now()),
      paymentMethod: paymentMethod || 'cash',
      reference,
      taxAmount: parseFloat(taxAmount),
      netAmount: parseFloat(amount) - parseFloat(taxAmount),
      createdBy: session.user?.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('financial_transactions').insertOne(transaction);

    return NextResponse.json({ 
      success: true, 
      transactionId: result.insertedId,
      transaction: { ...transaction, _id: result.insertedId }
    });

  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

// PUT: Update financial transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const body = await request.json();
    const { transactionId, ...updates } = body;

    if (!session || !propertyId || !transactionId) {
      return NextResponse.json({ error: 'Unauthorized or missing data' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    const updateData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: session.user?.email
    };

    if (updates.amount && updates.taxAmount) {
      updateData.netAmount = parseFloat(updates.amount) - parseFloat(updates.taxAmount);
    }

    const result = await db.collection('financial_transactions').updateOne(
      { 
        _id: new ObjectId(transactionId),
        propertyId: new ObjectId(propertyId)
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

// DELETE: Delete financial transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const { searchParams } = request.nextUrl;
    const transactionId = searchParams.get('transactionId');

    if (!session || !propertyId || !transactionId) {
      return NextResponse.json({ error: 'Unauthorized or missing data' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    const result = await db.collection('financial_transactions').deleteOne({
      _id: new ObjectId(transactionId),
      propertyId: new ObjectId(propertyId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Transaction deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}

// Helper functions for enhanced financial management
async function enhanceWithTransactionData(financialData: any, propertyId: string, startDate: Date, endDate: Date) {
  const { db } = await connectToDatabase();

  // Get actual financial transactions from database
  const transactions = await db.collection('financial_transactions')
    .find({
      propertyId: new ObjectId(propertyId),
      date: { $gte: startDate, $lte: endDate }
    })
    .toArray();

  // Calculate actual transaction totals
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const actualIncome = incomeTransactions.reduce((sum, t) => sum + t.netAmount, 0);
  const actualExpenses = expenseTransactions.reduce((sum, t) => sum + t.netAmount, 0);

  // Merge with booking revenue data
  const totalRevenue = financialData.revenue.total + actualIncome;
  const totalExpenses = financialData.expenses.total + actualExpenses;

  return {
    ...financialData,
    revenue: {
      ...financialData.revenue,
      total: totalRevenue,
      fromBookings: financialData.revenue.total,
      fromTransactions: actualIncome
    },
    expenses: {
      ...financialData.expenses,
      total: totalExpenses,
      fromTransactions: actualExpenses
    },
    profit: {
      gross: totalRevenue - totalExpenses,
      net: (totalRevenue - totalExpenses) * 0.85,
      margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
    },
    transactions: {
      total: transactions.length,
      income: incomeTransactions.length,
      expense: expenseTransactions.length,
      recentTransactions: transactions.slice(0, 10)
    }
  };
}

async function getDetailedFinancials(propertyId: string, startDate: Date, endDate: Date) {
  const { db } = await connectToDatabase();

  const transactions = await db.collection('financial_transactions')
    .find({
      propertyId: new ObjectId(propertyId),
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: -1 })
    .limit(100)
    .toArray();

  // Category breakdown
  const categoryBreakdown = await getCategoryBreakdown(propertyId, startDate, endDate);

  // Monthly trend
  const monthlyData = await getMonthlyFinancialData(propertyId, startDate, endDate);

  return {
    transactions,
    categoryBreakdown,
    monthlyData,
    summary: {
      totalTransactions: transactions.length,
      totalIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.netAmount, 0),
      totalExpense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.netAmount, 0)
    }
  };
}

async function getCashflowData(propertyId: string, startDate: Date, endDate: Date) {
  const { db } = await connectToDatabase();

  // Daily cashflow aggregation
  const pipeline = [
    {
      $match: {
        propertyId: new ObjectId(propertyId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
          type: '$type'
        },
        total: { $sum: '$netAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ];

  const results = await db.collection('financial_transactions').aggregate(pipeline).toArray();

  const dailyMap = new Map();
  let runningBalance = 0;

  results.forEach(result => {
    const dateStr = `${result._id.year}-${result._id.month.toString().padStart(2, '0')}-${result._id.day.toString().padStart(2, '0')}`;
    if (!dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, { date: dateStr, income: 0, expense: 0, net: 0, balance: 0 });
    }
    const data = dailyMap.get(dateStr);
    data[result._id.type] = result.total;
  });

  const cashflowData = Array.from(dailyMap.values()).map(day => {
    day.net = day.income - day.expense;
    runningBalance += day.net;
    day.balance = runningBalance;
    return day;
  });

  return {
    dailyCashflow: cashflowData,
    summary: {
      totalInflow: cashflowData.reduce((sum, day) => sum + day.income, 0),
      totalOutflow: cashflowData.reduce((sum, day) => sum + day.expense, 0),
      netCashflow: cashflowData.reduce((sum, day) => sum + day.net, 0),
      endingBalance: runningBalance
    }
  };
}

async function getMonthlyFinancialData(propertyId: string, startDate: Date, endDate: Date) {
  const { db } = await connectToDatabase();

  const pipeline = [
    {
      $match: {
        propertyId: new ObjectId(propertyId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        },
        total: { $sum: '$netAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ];

  const results = await db.collection('financial_transactions').aggregate(pipeline).toArray();

  const monthlyMap = new Map();
  results.forEach(result => {
    const key = `${result._id.year}-${result._id.month.toString().padStart(2, '0')}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { month: key, income: 0, expense: 0 });
    }
    const data = monthlyMap.get(key);
    data[result._id.type] = result.total;
    data.net = data.income - data.expense;
  });

  return Array.from(monthlyMap.values());
}

async function getCategoryBreakdown(propertyId: string, startDate: Date, endDate: Date) {
  const { db } = await connectToDatabase();

  const pipeline = [
    {
      $match: {
        propertyId: new ObjectId(propertyId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          type: '$type'
        },
        total: { $sum: '$netAmount' },
        count: { $sum: 1 }
      }
    }
  ];

  const results = await db.collection('financial_transactions').aggregate(pipeline).toArray();

  const categories = {};
  results.forEach(result => {
    const category = result._id.category;
    if (!categories[category]) {
      categories[category] = { income: 0, expense: 0, transactions: 0 };
    }
    categories[category][result._id.type] = result.total;
    categories[category].transactions += result.count;
    categories[category].net = categories[category].income - categories[category].expense;
  });

  return Object.entries(categories).map(([category, data]) => ({
    category,
    ...data
  }));
}
