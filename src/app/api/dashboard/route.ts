import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Query 1: Open Demands
    const { count: openDemandsCount } = await supabase
      .from('demands')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Open');

    // Query 2: Active Candidates
    const { count: candidatesCount } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true });

    // Query 3: Today's Interviews
    const todayStr = new Date().toISOString().split('T')[0];
    const { count: interviewsCount } = await supabase
      .from('interviews')
      .select('*', { count: 'exact', head: true })
      .eq('scheduled_date', todayStr);

    // Query 4: Offers Out
    const { count: offersCount } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true });

    // Query 5: Onboardings
    const { count: onboardingsCount } = await supabase
      .from('onboardings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'onboarded');

    // Query 6: Aging Demands (>30 Days)
    const { data: agingDemandsData } = await supabase
      .from('v_demands_with_aging')
      .select('*')
      .eq('is_red_flag', true)
      .limit(5);

    const formattedAging = (agingDemandsData || []).map((item: any) => ({
      id: item.id,
      client: item.client_name || 'Client',
      role: item.skill_description || 'Requirement',
      priority: item.priority || 'High',
      daysOpen: item.days_open || 30,
      assignedAM: item.am_name || 'Unassigned',
      assignedTA: 'Unassigned',
    }));

    return NextResponse.json({
      kpis: {
        openDemands: openDemandsCount || 0,
        agingDemandsRedFlag: formattedAging.length,
        activeCandidates: candidatesCount || 0,
        interviewsToday: interviewsCount || 0,
        offersThisMonth: offersCount || 0,
        onboardingsThisMonth: onboardingsCount || 0,
      },
      agingDemands: formattedAging,
      taAmPerformance: [],
    });
  } catch (error) {
    console.error('Error fetching Supabase dashboard data:', error);
    return NextResponse.json({
      kpis: {
        openDemands: 0,
        agingDemandsRedFlag: 0,
        activeCandidates: 0,
        interviewsToday: 0,
        offersThisMonth: 0,
        onboardingsThisMonth: 0,
      },
      agingDemands: [],
      taAmPerformance: [],
    });
  }
}
