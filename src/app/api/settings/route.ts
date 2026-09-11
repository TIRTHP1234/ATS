import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: dropdowns } = await supabase
      .from('dropdown_masters')
      .select('*')
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      slaConfig: {
        redFlagDaysThreshold: 30,
        intakeToAllocationSlaDays: 2,
        submissionToClientSlaDays: 1,
        autoArchiveDays: 90
      },
      idScheme: {
        demandPrefix: 'CSF',
        yearFormat: 'YYYY',
        sequenceLength: 4,
        exampleId: 'CSF-2026-0001'
      },
      dropdowns: dropdowns || []
    });
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json({
      slaConfig: { redFlagDaysThreshold: 30, intakeToAllocationSlaDays: 2, submissionToClientSlaDays: 1, autoArchiveDays: 90 },
      idScheme: { demandPrefix: 'CSF', yearFormat: 'YYYY', sequenceLength: 4, exampleId: 'CSF-2026-0001' },
      dropdowns: []
    }, { status: 500 });
  }
}
