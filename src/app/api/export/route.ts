import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const supabase = await createClient();

    const [
      { data: demands },
      { data: candidates },
      { data: interviews },
      { data: offers },
      { data: onboardings }
    ] = await Promise.all([
      supabase.from('demands').select('*').order('created_at', { ascending: false }),
      supabase.from('candidates').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('interviews').select('*').order('created_at', { ascending: false }),
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
      supabase.from('onboardings').select('*').order('created_at', { ascending: false })
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Costaff North ATS Engine';
    workbook.created = new Date();

    // Sheet 1: Demands
    const demandsSheet = workbook.addWorksheet('Client_Staffing Log');
    demandsSheet.columns = [
      { header: 'Request ID', key: 'request_id', width: 20 },
      { header: 'VMS ID', key: 'external_requisition_id', width: 20 },
      { header: 'Skill Description', key: 'skill_description', width: 35 },
      { header: 'Role Category', key: 'role_category', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Num Positions', key: 'num_positions', width: 15 },
      { header: 'Created Date', key: 'created_at', width: 22 }
    ];
    (demands || []).forEach(d => demandsSheet.addRow(d));

    // Sheet 2: Candidates
    const candidatesSheet = workbook.addWorksheet('TA_Daily Call Log');
    candidatesSheet.columns = [
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Current Company', key: 'current_company', width: 25 },
      { header: 'Location', key: 'current_location', width: 20 },
      { header: 'Current CTC', key: 'current_ctc', width: 15 },
      { header: 'Expected CTC', key: 'expected_ctc', width: 15 },
      { header: 'Source', key: 'source', width: 15 }
    ];
    (candidates || []).forEach(c => candidatesSheet.addRow(c));

    // Sheet 3: Interviews
    const interviewsSheet = workbook.addWorksheet('Interview Sheet');
    interviewsSheet.columns = [
      { header: 'Level', key: 'level', width: 12 },
      { header: 'Interviewer', key: 'interviewer_name', width: 22 },
      { header: 'Skill Tested', key: 'skill_tested', width: 25 },
      { header: 'Mode', key: 'mode', width: 12 },
      { header: 'Scheduled Date', key: 'scheduled_date', width: 15 },
      { header: 'Scheduled Time', key: 'scheduled_time', width: 15 },
      { header: 'Status', key: 'status', width: 15 }
    ];
    (interviews || []).forEach(i => interviewsSheet.addRow(i));

    // Sheet 4: Offers & Onboarding
    const offersSheet = workbook.addWorksheet('Offers & Onboardings');
    offersSheet.columns = [
      { header: 'Offered CTC', key: 'offered_ctc', width: 15 },
      { header: 'Offer Date', key: 'offer_date', width: 15 },
      { header: 'Offer Status', key: 'status', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];
    (offers || []).forEach(o => offersSheet.addRow(o));

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Costaff_Master_Export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel export:', error);
    return NextResponse.json({ error: 'Failed to export Excel file' }, { status: 500 });
  }
}
