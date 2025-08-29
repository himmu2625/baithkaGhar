import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { format } from 'date-fns';

// GET: Export analytics report as PDF/Excel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const { searchParams } = request.nextUrl;
    const range = searchParams.get('range') || '30d';
    const format_type = searchParams.get('format') || 'pdf';

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch analytics data (reuse logic from main analytics endpoint)
    const analyticsResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/os/analytics/${propertyId}?range=${range}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });

    if (!analyticsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    const { analytics } = await analyticsResponse.json();

    if (format_type === 'pdf') {
      // Generate PDF report
      const pdfBuffer = await generatePDFReport(analytics, range, propertyId);
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="analytics-report-${format(new Date(), 'yyyy-MM-dd')}.pdf"`
        }
      });
    } else if (format_type === 'csv') {
      // Generate CSV report
      const csvContent = generateCSVReport(analytics, range);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${format(new Date(), 'yyyy-MM-dd')}.csv"`
        }
      });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}

async function generatePDFReport(analytics: any, range: string, propertyId: string): Promise<Buffer> {
  // In a real implementation, you would use a PDF generation library like puppeteer, jsPDF, or PDFKit
  // For this example, we'll return a mock PDF buffer
  
  const reportContent = `
    ANALYTICS REPORT
    Property ID: ${propertyId}
    Date Range: ${range}
    Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
    
    REVENUE SUMMARY
    Total Revenue: ₹${(analytics.revenue.total / 100000).toFixed(1)}L
    Growth: ${analytics.revenue.growth}%
    
    OCCUPANCY SUMMARY
    Current Occupancy: ${analytics.occupancy.current}%
    Average Occupancy: ${analytics.occupancy.average}%
    Trend: ${analytics.occupancy.trend}%
    
    BOOKING SUMMARY
    Total Bookings: ${analytics.bookings.total}
    Confirmed: ${analytics.bookings.confirmed}
    Cancelled: ${analytics.bookings.cancelled}
    Pending: ${analytics.bookings.pending}
    
    PERFORMANCE METRICS
    ADR: ₹${analytics.performance.adr}
    RevPAR: ₹${analytics.performance.revpar}
    Average Length of Stay: ${analytics.performance.los} nights
    Guest Satisfaction: ${analytics.performance.guestSatisfaction}/5.0
    Repeat Guests: ${analytics.performance.repeatGuests}%
  `;
  
  // Mock PDF generation - in real implementation, convert reportContent to PDF
  return Buffer.from(reportContent, 'utf-8');
}

function generateCSVReport(analytics: any, range: string): string {
  const csvRows = [
    'Metric,Value,Unit',
    `Report Range,${range},`,
    `Generated Date,${format(new Date(), 'yyyy-MM-dd')},`,
    '',
    'REVENUE METRICS,,',
    `Total Revenue,${analytics.revenue.total},INR`,
    `Revenue Growth,${analytics.revenue.growth},%`,
    '',
    'OCCUPANCY METRICS,,',
    `Current Occupancy,${analytics.occupancy.current},%`,
    `Average Occupancy,${analytics.occupancy.average},%`,
    `Occupancy Trend,${analytics.occupancy.trend},%`,
    '',
    'BOOKING METRICS,,',
    `Total Bookings,${analytics.bookings.total},Count`,
    `Confirmed Bookings,${analytics.bookings.confirmed},Count`,
    `Cancelled Bookings,${analytics.bookings.cancelled},Count`,
    `Pending Bookings,${analytics.bookings.pending},Count`,
    `Booking Growth,${analytics.bookings.growth},%`,
    '',
    'PERFORMANCE METRICS,,',
    `Average Daily Rate,${analytics.performance.adr},INR`,
    `Revenue Per Available Room,${analytics.performance.revpar},INR`,
    `Average Room Rate,${analytics.performance.arr},INR`,
    `Length of Stay,${analytics.performance.los},Nights`,
    `Guest Satisfaction,${analytics.performance.guestSatisfaction},Rating`,
    `Repeat Guests,${analytics.performance.repeatGuests},%`,
    '',
    'MONTHLY REVENUE DATA,,',
    'Month,Revenue,Bookings'
  ];

  // Add monthly revenue data
  analytics.revenue.monthlyData.forEach((month: any) => {
    csvRows.push(`${month.month},${month.revenue},${month.bookings}`);
  });

  csvRows.push('', 'CHANNEL BREAKDOWN,,', 'Channel,Revenue,Percentage');
  
  // Add channel breakdown
  analytics.revenue.channelBreakdown.forEach((channel: any) => {
    csvRows.push(`${channel.channel},${channel.revenue},${channel.percentage}`);
  });

  return csvRows.join('\n');
}