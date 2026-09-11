import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const source = searchParams.get('source') || '';

    const supabase = await createClient();
    let query = supabase.from('candidates').select('*');

    if (source) {
      query = query.eq('source', source);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,current_company.ilike.%${search}%,current_location.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).limit(200);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase error fetching candidates:', error);
      return NextResponse.json({ candidates: [], total: 0 });
    }

    return NextResponse.json({ candidates: data || [], total: count || (data ? data.length : 0) });
  } catch (err) {
    console.error('Error in /api/candidates:', err);
    return NextResponse.json({ candidates: [], total: 0 }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const email = body.email ? body.email.trim().toLowerCase() : null;
    const phone = body.phone ? body.phone.trim() : null;

    // 1. Duplicate Detection (§5.3.2 step 1 & §6.6)
    if (email || phone) {
      let dedupeQuery = supabase.from('candidates').select('*');
      if (email && phone) {
        dedupeQuery = dedupeQuery.or(`email.eq.${email},phone.eq.${phone}`);
      } else if (email) {
        dedupeQuery = dedupeQuery.eq('email', email);
      } else if (phone) {
        dedupeQuery = dedupeQuery.eq('phone', phone);
      }

      const { data: existing } = await dedupeQuery;
      if (existing && existing.length > 0) {
        return NextResponse.json({
          error: 'Duplicate Candidate Found! A profile with this email or phone number already exists.',
          isDuplicate: true,
          existingCandidate: existing[0]
        }, { status: 409 });
      }
    }

    // 2. Insert New Candidate
    const newCandidate = {
      full_name: body.full_name || 'New Candidate',
      phone: phone || '',
      email: email || '',
      source: body.source || 'naukri',
      current_company: body.current_company || '',
      current_location: body.current_location || '',
      current_ctc: body.current_ctc ? parseFloat(body.current_ctc) : null,
      expected_ctc: body.expected_ctc ? parseFloat(body.expected_ctc) : null,
      availability: body.availability || 'Immediate',
    };

    const { data, error } = await supabase
      .from('candidates')
      .insert([newCandidate])
      .select()
      .single();

    if (error) {
      console.error('Error inserting candidate:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ candidate: data, success: true });
  } catch (err) {
    console.error('Error in POST /api/candidates:', err);
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const updateData: Record<string, any> = {};

    if (body.full_name !== undefined) updateData.full_name = body.full_name?.trim();
    if (body.phone !== undefined) updateData.phone = body.phone?.trim();
    if (body.email !== undefined) updateData.email = body.email?.trim().toLowerCase();
    if (body.current_company !== undefined) updateData.current_company = body.current_company?.trim();
    if (body.current_location !== undefined) updateData.current_location = body.current_location?.trim();
    if (body.current_ctc !== undefined) updateData.current_ctc = body.current_ctc ? parseFloat(body.current_ctc) : null;
    if (body.expected_ctc !== undefined) updateData.expected_ctc = body.expected_ctc ? parseFloat(body.expected_ctc) : null;
    if (body.source !== undefined) updateData.source = body.source;

    const { data, error } = await supabase
      .from('candidates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating candidate:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ candidate: data, success: true });
  } catch (err) {
    console.error('Error in PUT /api/candidates:', err);
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('candidates').delete().eq('id', id);

    if (error) {
      console.error('Error deleting candidate:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/candidates:', err);
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}
