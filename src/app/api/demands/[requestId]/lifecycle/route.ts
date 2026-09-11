import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch demand details from v_demands_with_aging view (or fallback to demands table)
    let { data: demand } = await supabase
      .from('v_demands_with_aging')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle();

    if (!demand) {
      const { data: demandById } = await supabase
        .from('v_demands_with_aging')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();
      demand = demandById;
    }

    // Fallback to demands base table if view didn't return
    if (!demand) {
      const { data: rawDemand } = await supabase
        .from('demands')
        .select('*')
        .or(`request_id.eq.${requestId},id.eq.${requestId}`)
        .maybeSingle();
      demand = rawDemand;
    }

    if (!demand) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    // Ensure client_name fallback to account_name
    if (!demand.client_name && demand.account_name) {
      demand.client_name = demand.account_name;
    }

    const reqIdStr = demand.request_id || requestId;
    const demandUuid = demand.id;

    // 2. Fetch assigned candidate submissions linked to this demand
    let submissions: any[] = [];
    if (demandUuid) {
      try {
        const { data: subData } = await supabase
          .from('submissions')
          .select('*, candidates(*)')
          .eq('demand_id', demandUuid)
          .order('created_at', { ascending: false });
        submissions = subData || [];
      } catch (e) {
        console.warn('Submissions fetch warning:', e);
      }
    }

    // 3. Fetch interviews linked to this request_id or demand_id
    let interviews: any[] = [];
    try {
      const { data: ivData } = await supabase
        .from('interviews')
        .select('*')
        .or(`demand_request_id.eq.${reqIdStr},demand_id.eq.${demandUuid}`)
        .order('scheduled_date', { ascending: true });
      interviews = ivData || [];
    } catch (e) {
      console.warn('Interviews fetch warning:', e);
    }

    // 4. Fetch offers linked to this demand
    let offers: any[] = [];
    if (demandUuid) {
      try {
        const { data: offerData } = await supabase
          .from('offers')
          .select('*, candidates(full_name, email, phone)')
          .eq('demand_id', demandUuid);
        offers = offerData || [];
      } catch (e) {
        console.warn('Offers fetch warning:', e);
      }
    }

    // 5. Fetch onboardings linked to this demand
    let onboardings: any[] = [];
    if (demandUuid) {
      try {
        const { data: onboardingData } = await supabase
          .from('onboardings')
          .select('*, candidates(full_name, email, phone)')
          .eq('demand_id', demandUuid);
        onboardings = onboardingData || [];
      } catch (e) {
        console.warn('Onboardings fetch warning:', e);
      }
    }

    return NextResponse.json({
      success: true,
      demand,
      submissions: submissions || [],
      interviews: interviews || [],
      offers: offers || [],
      onboardings: onboardings || []
    });
  } catch (err: any) {
    console.error('Error in /api/demands/[requestId]/lifecycle:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
