import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const bgv = searchParams.get('bgv') || '';

    const supabase = await createClient();
    let query = supabase.from('onboardings').select(`
      *,
      candidates ( full_name, email, phone ),
      demands ( request_id, skill_description, account_name ),
      offers ( offered_ctc, offer_date, status )
    `);

    if (status) {
      query = query.eq('status', status);
    }
    if (bgv) {
      query = query.eq('bgv_status', bgv);
    }
    if (search) {
      query = query.or(`status.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching onboardings:', error);
      return NextResponse.json({ onboardings: [] });
    }

    return NextResponse.json({ onboardings: data || [] });
  } catch (err) {
    console.error('Error in GET /api/onboardings:', err);
    return NextResponse.json({ onboardings: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const newOnboarding = {
      offer_id: body.offer_id || null,
      candidate_id: body.candidate_id || null,
      demand_id: body.demand_id || null,
      bgv_status: body.bgv_status || 'in_progress',
      actual_joining_date: body.actual_joining_date || null,
      status: body.status || 'yet_to_join',
      notes: body.notes || ''
    };

    const { data, error } = await supabase
      .from('onboardings')
      .insert([newOnboarding])
      .select()
      .single();

    if (error) {
      console.error('Error creating onboarding:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ onboarding: data, success: true });
  } catch (err) {
    console.error('Error in POST /api/onboardings:', err);
    return NextResponse.json({ error: 'Failed to create onboarding' }, { status: 500 });
  }
}
