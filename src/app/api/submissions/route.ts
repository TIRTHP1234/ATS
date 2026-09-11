import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/submissions?demand_id=... or ?request_id=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const demandId = searchParams.get('demand_id');
    const requestId = searchParams.get('request_id');

    const supabase = await createClient();
    let targetDemandId = demandId;

    if (!targetDemandId && requestId) {
      const { data: dem } = await supabase
        .from('demands')
        .select('id')
        .eq('request_id', requestId)
        .maybeSingle();
      if (dem) {
        targetDemandId = dem.id;
      }
    }

    if (!targetDemandId) {
      return NextResponse.json({ submissions: [] });
    }

    const { data, error } = await supabase
      .from('submissions')
      .select('*, candidates(*), demands(request_id, skill_description)')
      .eq('demand_id', targetDemandId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ submissions: [] });
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (err: any) {
    console.error('Error in GET /api/submissions:', err);
    return NextResponse.json({ submissions: [] }, { status: 500 });
  }
}

// POST /api/submissions — Batch assign candidates to a demand
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { demand_id, candidate_ids, stage } = body;

    if (!demand_id || !candidate_ids || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      return NextResponse.json({ error: 'demand_id and candidate_ids array are required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch existing submissions for this demand to avoid duplicates
    const { data: existing } = await supabase
      .from('submissions')
      .select('candidate_id')
      .eq('demand_id', demand_id);

    const existingCandidateIds = new Set((existing || []).map((e: any) => e.candidate_id));

    const newSubmissions = candidate_ids
      .filter((cid: string) => !existingCandidateIds.has(cid))
      .map((cid: string) => ({
        demand_id,
        candidate_id: cid,
        stage: stage || 'phone_call_done',
        remarks: 'Assigned to Requirement'
      }));

    if (newSubmissions.length === 0) {
      return NextResponse.json({ message: 'All selected candidates are already assigned to this requirement', count: 0, success: true });
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert(newSubmissions)
      .select();

    if (error) {
      console.error('Error batch assigning candidates:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ submissions: data, count: data.length, success: true });
  } catch (err: any) {
    console.error('Error in POST /api/submissions:', err);
    return NextResponse.json({ error: 'Failed to assign candidates' }, { status: 500 });
  }
}

// PUT /api/submissions — Update candidate stage or remarks
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, stage, remarks } = body;

    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

    if (stage !== undefined) updatePayload.stage = stage;
    if (remarks !== undefined) updatePayload.remarks = remarks;

    const { data, error } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', id)
      .select('*, candidates(*)')
      .single();

    if (error) {
      console.error('Error updating submission stage:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ submission: data, success: true });
  } catch (err: any) {
    console.error('Error in PUT /api/submissions:', err);
    return NextResponse.json({ error: 'Failed to update submission stage' }, { status: 500 });
  }
}
