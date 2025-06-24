import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';
import { generateQuarterlyReport, generateGroupQuarterlyReport, exportReportToCSV, getCurrentQuarter } from '@/app/utils/reportingUtils';

export async function GET(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Check if user is admin (you can implement your own admin check logic)
    // For now, we'll check if the user has a specific email or custom claim
    const isAdmin = decodedToken.email === 'admin@helixcard.app' || decodedToken.admin === true;
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const quarterParam = searchParams.get('quarter');
    const groupParam = searchParams.get('group');
    const format = searchParams.get('format') || 'json';

    // Use current quarter if not specified
    const currentQuarter = getCurrentQuarter();
    const year = yearParam ? parseInt(yearParam) : currentQuarter.year;
    const quarter = quarterParam ? parseInt(quarterParam) : currentQuarter.quarter;

    // Validate parameters
    if (isNaN(year) || year < 2020 || year > 2030) {
      return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
    }

    if (isNaN(quarter) || quarter < 1 || quarter > 4) {
      return NextResponse.json({ error: 'Invalid quarter parameter (must be 1-4)' }, { status: 400 });
    }

    let report;

    if (groupParam) {
      // Generate report for specific group
      report = await generateGroupQuarterlyReport(groupParam, year, quarter);
    } else {
      // Generate full quarterly report
      report = await generateQuarterlyReport(year, quarter);
    }

    // Return CSV format if requested
    if (format === 'csv') {
      let csvContent: string;
      
      if (groupParam) {
        // For single group, create a minimal report structure
        const fullReport = {
          quarter: `Q${quarter}`,
          year,
          startDate: new Date(year, (quarter - 1) * 3, 1),
          endDate: new Date(year, quarter * 3, 0),
          totalUsers: (report as any).totalUsers,
          groupReports: [report as any],
          ungroupedUsers: []
        };
        csvContent = exportReportToCSV(fullReport);
      } else {
        csvContent = exportReportToCSV(report as any);
      }
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="quarterly-report-${year}-Q${quarter}.csv"`
        }
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error generating quarterly report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 