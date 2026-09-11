import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, getCandidateInterviewEmailHtml, getAmInterviewNotificationEmailHtml } from '@/lib/email';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const level = searchParams.get('level') || '';
    const mode = searchParams.get('mode') || '';
    const status = searchParams.get('status') || '';

    const supabase = await createClient();
    let query = supabase.from('interviews').select('*');

    if (level) {
      query = query.eq('level', level);
    }
    if (mode) {
      query = query.eq('mode', mode);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`interviewer_name.ilike.%${search}%,skill_tested.ilike.%${search}%,status.ilike.%${search}%,candidate_name.ilike.%${search}%,demand_request_id.ilike.%${search}%`);
    }

    query = query.order('scheduled_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching interviews:', error);
      return NextResponse.json({ interviews: [] });
    }

    return NextResponse.json({ interviews: data || [] });
  } catch (err) {
    console.error('Error in GET /api/interviews:', err);
    return NextResponse.json({ interviews: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const newInterview = {
      demand_id: body.demand_id || null,
      demand_request_id: body.demand_request_id || '',
      candidate_id: body.candidate_id || null,
      candidate_name: body.candidate_name || '',
      interviewer_name: body.interviewer_name || 'SPOC Interviewer',
      level: body.level || 'L1',
      skill_tested: body.skill_tested || 'Technical Skills',
      mode: body.mode || 'Video',
      scheduled_date: body.scheduled_date || new Date().toISOString().split('T')[0],
      scheduled_time: body.scheduled_time || '10:00',
      status: body.status || 'Scheduled',
      link_status: body.link_status || 'Client_Shared',
      meeting_link: body.meeting_link || '',
      feedback: body.feedback || ''
    };

    const { data, error } = await supabase
      .from('interviews')
      .insert([newInterview])
      .select()
      .single();

    if (error) {
      console.error('Error scheduling interview:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Dual Email Dispatch: 1. To Candidate, 2. To AM
    const candidateEmail = body.candidate_email?.trim() || null;
    const amEmail = body.am_email?.trim() || null;

    if (candidateEmail) {
      sendEmail({
        to: candidateEmail,
        subject: `[Interview Invitation] ${data.skill_tested} (${data.level}) — Costaff Recruitment`,
        html: getCandidateInterviewEmailHtml(data)
      }).catch(e => console.error('Error sending candidate interview email:', e));
    }

    if (amEmail) {
      sendEmail({
        to: amEmail,
        subject: `[Costaff ATS] Interview Booked: Candidate ${data.candidate_name} for ${data.demand_request_id}`,
        html: getAmInterviewNotificationEmailHtml(data)
      }).catch(e => console.error('Error sending AM interview alert:', e));
    }

    return NextResponse.json({ interview: data, success: true });
  } catch (err) {
    console.error('Error in POST /api/interviews:', err);
    return NextResponse.json({ error: 'Failed to schedule interview' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, feedback } = body;

    if (!id) {
      return NextResponse.json({ error: 'Interview ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (feedback !== undefined) updateData.feedback = feedback;

    const { data, error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating interview status:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ interview: data, success: true });
  } catch (err) {
    console.error('Error in PUT /api/interviews:', err);
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Interview ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('interviews').delete().eq('id', id);

    if (error) {
      console.error('Error deleting interview:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/interviews:', err);
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 });
  }
}
