import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch candidate profile details
    const { data: candidate, error: candidateErr } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .maybeSingle();

    if (candidateErr || !candidate) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 });
    }

    // 2. Fetch interviews for this candidate
    let interviews: any[] = [];
    try {
      if (candidate.email) {
        const { data: ivByEmail } = await supabase
          .from('interviews')
          .select('*')
          .eq('candidate_email', candidate.email)
          .order('scheduled_date', { ascending: true });
        interviews = ivByEmail || [];
      }

      if (interviews.length === 0 && candidate.full_name) {
        const { data: ivByName } = await supabase
          .from('interviews')
          .select('*')
          .ilike('candidate_name', `%${candidate.full_name.trim()}%`)
          .order('scheduled_date', { ascending: true });
        interviews = ivByName || [];
      }
    } catch (e) {
      console.warn('Interviews fetch warning:', e);
    }

    // 3. Fetch offers for this candidate
    let offers: any[] = [];
    try {
      const { data: offerData } = await supabase
        .from('offers')
        .select('*, demands(request_id, skill_description)')
        .eq('candidate_id', candidateId);
      offers = offerData || [];
    } catch (e) {
      console.warn('Offers fetch warning:', e);
    }

    // 4. Fetch onboardings for this candidate
    let onboardings: any[] = [];
    try {
      const { data: onboardingData } = await supabase
        .from('onboardings')
        .select('*, demands(request_id, skill_description)')
        .eq('candidate_id', candidateId);
      onboardings = onboardingData || [];
    } catch (e) {
      console.warn('Onboardings fetch warning:', e);
    }

    // 5. Gather all linked Request IDs
    const linkedReqIds = new Set<string>();
    if (candidate.demand_request_id) linkedReqIds.add(candidate.demand_request_id);
    if (candidate.request_id) linkedReqIds.add(candidate.request_id);
    interviews.forEach(i => { if (i.demand_request_id) linkedReqIds.add(i.demand_request_id); });
    offers.forEach(o => { if (o.demands?.request_id) linkedReqIds.add(o.demands.request_id); });
    onboardings.forEach(ob => { if (ob.demands?.request_id) linkedReqIds.add(ob.demands.request_id); });

    return NextResponse.json({
      success: true,
      candidate,
      linkedRequestIds: Array.from(linkedReqIds),
      interviews: interviews || [],
      offers: offers || [],
      onboardings: onboardings || []
    });
  } catch (err: any) {
    console.error('Error in /api/candidates/[candidateId]/history:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
