import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, getAmDemandAssignedEmailHtml } from '@/lib/email';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const redFlagsOnly = searchParams.get('redFlagsOnly') === 'true';

    const supabase = await createClient();
    let query = supabase.from('v_demands_with_aging').select('*');

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (redFlagsOnly) {
      query = query.eq('is_red_flag', true);
    }
    if (search) {
      query = query.or(`request_id.ilike.%${search}%,skill_description.ilike.%${search}%,client_name.ilike.%${search}%,external_requisition_id.ilike.%${search}%`);
    }

    query = query.order('opened_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching demands:', error);
      return NextResponse.json({ demands: [] });
    }

    return NextResponse.json({ demands: data || [] });
  } catch (err) {
    console.error('Error in /api/demands:', err);
    return NextResponse.json({ demands: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Generate Request ID if not provided: CSF-2026-NNNN
    const timestamp = Date.now().toString().slice(-4);
    const request_id = body.request_id?.trim() || `CSF-2026-${timestamp}`;

    const newDemand = {
      request_id,
      external_requisition_id: body.external_requisition_id?.trim() || null,
      buzzworks_id: body.buzzworks_id?.trim() || null,
      client_name: body.client_name?.trim() || null,
      am_name: body.am_name?.trim() || null,
      skill_description: body.skill_description?.trim() || 'New Requirement',
      role_category: body.role_category || 'Permanent',
      experience_level: body.experience_level?.trim() || 'Mid-Senior',
      num_positions: parseInt(body.num_positions) || 1,
      status: body.status || 'Open',
      priority: body.priority || 'High',
      budget_min: body.budget_min ? parseFloat(body.budget_min) : null,
      budget_max: body.budget_max ? parseFloat(body.budget_max) : null,
      locations: body.locations || [],
      notes: body.notes?.trim() || ''
    };

    const { data, error } = await supabase
      .from('demands')
      .insert([newDemand])
      .select()
      .single();

    if (error) {
      console.error('Error creating demand:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger Automated SMTP Email to Account Manager (AM) if AM email is provided
    const amEmail = body.am_email?.trim() || body.am_name?.includes('@') ? body.am_name.trim() : null;
    if (amEmail) {
      sendEmail({
        to: amEmail,
        subject: `[Costaff ATS] New Client Mandate Assigned: ${data.request_id} — ${data.skill_description}`,
        html: getAmDemandAssignedEmailHtml({ ...data, am_name: body.am_name || 'Account Manager', client_name: body.client_name })
      }).catch(e => console.error('Error triggering AM email:', e));
    }

    return NextResponse.json({ demand: data, success: true });
  } catch (err) {
    console.error('Error in POST /api/demands:', err);
    return NextResponse.json({ error: 'Failed to create demand' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Demand ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const updateData: Record<string, any> = {};

    if (body.request_id !== undefined) updateData.request_id = body.request_id?.trim();
    if (body.external_requisition_id !== undefined) updateData.external_requisition_id = body.external_requisition_id?.trim();
    if (body.client_name !== undefined) updateData.client_name = body.client_name?.trim() || null;
    if (body.am_name !== undefined) updateData.am_name = body.am_name?.trim() || null;
    if (body.skill_description !== undefined) updateData.skill_description = body.skill_description?.trim();
    if (body.role_category !== undefined) updateData.role_category = body.role_category;
    if (body.experience_level !== undefined) updateData.experience_level = body.experience_level?.trim();
    if (body.num_positions !== undefined) updateData.num_positions = parseInt(body.num_positions) || 1;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.budget_min !== undefined) updateData.budget_min = body.budget_min ? parseFloat(body.budget_min) : null;
    if (body.budget_max !== undefined) updateData.budget_max = body.budget_max ? parseFloat(body.budget_max) : null;
    if (body.locations !== undefined) updateData.locations = body.locations || [];
    if (body.notes !== undefined) updateData.notes = body.notes?.trim();

    const { data, error } = await supabase
      .from('demands')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating demand:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger Automated SMTP Email to AM on Demand Update if AM email is provided
    const amEmail = body.am_email?.trim() || (body.am_name?.includes('@') ? body.am_name.trim() : null);
    if (amEmail) {
      sendEmail({
        to: amEmail,
        subject: `[Costaff ATS] Mandate Updated: ${data.request_id} — ${data.skill_description}`,
        html: getAmDemandAssignedEmailHtml({ ...data, am_name: body.am_name || 'Account Manager', client_name: body.client_name })
      }).catch(e => console.error('Error triggering AM email on update:', e));
    }

    return NextResponse.json({ demand: data, success: true });
  } catch (err) {
    console.error('Error in PUT /api/demands:', err);
    return NextResponse.json({ error: 'Failed to update demand' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Demand ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('demands').delete().eq('id', id);

    if (error) {
      console.error('Error deleting demand:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/demands:', err);
    return NextResponse.json({ error: 'Failed to delete demand' }, { status: 500 });
  }
}
