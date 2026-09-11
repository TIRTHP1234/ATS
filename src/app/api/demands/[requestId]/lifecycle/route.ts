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

    // 1. Fetch demand details
    const { data: demand } = await supabase
      .from('demands')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle();

    let actualDemand = demand;
    if (!actualDemand) {
      const { data: demandById } = await supabase
        .from('demands')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();
      actualDemand = demandById;
    }

    if (!actualDemand) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    const reqIdStr = actualDemand.request_id || requestId;
    const demandUuid = actualDemand.id;

    // 2. Fetch interviews linked to this request_id
    let interviews: any[] = [];
    try {
      const { data: ivData } = await supabase
        .from('interviews')
        .select('*')
        .eq('demand_request_id', reqIdStr)
        .order('scheduled_date', { ascending: true });
      interviews = ivData || [];
    } catch (e) {
      console.warn('Interviews fetch warning:', e);
    }

    // 3. Fetch offers linked to this demand
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

    // 4. Fetch onboardings linked to this demand
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
      demand: actualDemand,
      interviews: interviews || [],
      offers: offers || [],
      onboardings: onboardings || []
    });
  } catch (err: any) {
    console.error('Error in /api/demands/[requestId]/lifecycle:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
