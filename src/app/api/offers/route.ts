import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const supabase = await createClient();
    let query = supabase.from('offers').select(`
      *,
      candidates ( full_name, email, phone ),
      demands ( request_id, skill_description, account_name )
    `);

    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`status.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching offers:', error);
      return NextResponse.json({ offers: [] });
    }

    return NextResponse.json({ offers: data || [] });
  } catch (err) {
    console.error('Error in GET /api/offers:', err);
    return NextResponse.json({ offers: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const newOffer = {
      candidate_id: body.candidate_id || null,
      demand_id: body.demand_id || null,
      submission_id: body.submission_id || null,
      offered_ctc: body.offered_ctc || null,
      offer_date: body.offer_date || new Date().toISOString().split('T')[0],
      status: body.status || 'Pending',
      notes: body.notes || ''
    };

    const { data, error } = await supabase
      .from('offers')
      .insert([newOffer])
      .select()
      .single();

    if (error) {
      console.error('Error creating offer:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ offer: data, success: true });
  } catch (err) {
    console.error('Error in POST /api/offers:', err);
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('offers').delete().eq('id', id);

    if (error) {
      console.error('Error deleting offer:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/offers:', err);
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 });
  }
}
