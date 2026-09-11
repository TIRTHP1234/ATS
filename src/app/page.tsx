'use client';

import React, { useEffect, useState } from 'react';

/* ─────────────── TYPE DEFINITIONS ─────────────── */

interface KPIState {
  openDemands: number;
  agingDemandsRedFlag: number;
  activeCandidates: number;
  interviewsToday: number;
  offersThisMonth: number;
  onboardingsThisMonth: number;
}

interface AgingDemand {
  id: string;
  client: string;
  role: string;
  priority: string;
  daysOpen: number;
  assignedAM: string;
}

interface Demand {
  id: string;
  request_id: string;
  external_requisition_id?: string;
  client_name?: string;
  skill_description: string;
  priority: string;
  status: string;
  days_open: number;
  is_red_flag: boolean;
  am_name?: string;
  role_category?: string;
  budget_min?: number;
  budget_max?: number;
  experience_level?: string;
  locations?: string[];
  num_positions?: number;
  is_public?: boolean;
  notes?: string;
}

interface Candidate {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  source: string;
  current_company?: string;
  current_location?: string;
  current_ctc?: number;
  expected_ctc?: number;
  skills?: string[];
  created_at: string;
}

interface Interview {
  id: string;
  demand_request_id?: string;
  candidate_name?: string;
  interviewer_name: string;
  level: string;
  skill_tested: string;
  mode: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  link_status?: string;
  meeting_link?: string;
  feedback?: string;
}

interface Offer {
  id: string;
  offered_ctc?: number;
  offer_date: string;
  status: string;
  notes?: string;
  candidates?: { full_name: string; email: string; phone: string };
  demands?: { request_id: string; skill_description: string; account_name?: string };
}

interface Onboarding {
  id: string;
  bgv_status: string;
  actual_joining_date?: string;
  status: string;
  notes?: string;
  candidates?: { full_name: string; email: string; phone: string };
  demands?: { request_id: string; skill_description: string; account_name?: string };
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

interface TAMetric {
  id: string;
  name: string;
  role: string;
  demandsWorked: number;
  candidatesScoped: number;
  submissions: number;
  targetDaily: number;
  targetAchievedPct: number;
  interviewsScheduled: number;
  selections: number;
}

interface AMMetric {
  id: string;
  name: string;
  intakeToAllocationDays: number;
  submissionToClientDays: number;
  offerAcceptanceRate: number;
  openDemandsManaged: number;
}

interface ClientMetric {
  id: string;
  clientName: string;
  totalDemands: number;
  openDemands: number;
  submissions: number;
  interviews: number;
  offers: number;
  joins: number;
}

interface GlobalKpiState {
  avgTimeToFillDays?: number;
  avgTimeToHireDays?: number;
  offerAcceptanceRatePct?: number;
  interviewAttendanceRatePct?: number;
  onboardingConversionRatePct?: number;
}

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  details: string;
  user_name: string;
  created_at: string;
}

interface ClientAccount {
  id: string;
  name: string;
  industry: string;
  location: string;
  notes: string;
}

interface SlaConfig {
  redFlagDaysThreshold: number;
  intakeToAllocationSlaDays: number;
  submissionToClientSlaDays: number;
  autoArchiveDays: number;
}

/* ─────────────── STAGE & BGV COLOR DEFINITIONS ─────────────── */
const STAGE_COLORS: Record<string, { bg: string; text: string }> = {
  'Sourced': { bg: '#f0f9ff', text: '#0369a1' },
  'Submitted for AM Review': { bg: '#fef3c7', text: '#92400e' },
  'Submitted to Client': { bg: '#eff6ff', text: '#1d4ed8' },
  'Shortlisted by Client': { bg: '#ecfdf5', text: '#065f46' },
  'L1 Interview': { bg: '#f0fdf4', text: '#15803d' },
  'L2 Interview': { bg: '#f0fdf4', text: '#15803d' },
  'Selected': { bg: '#ecfdf5', text: '#047857' },
  'Offer Released': { bg: '#eff6ff', text: '#1d4ed8' },
  'Joined': { bg: '#d1fae5', text: '#065f46' },
  'Rejected': { bg: '#fef2f2', text: '#991b1b' },
};

const BGV_COLORS: Record<string, { bg: string; text: string }> = {
  'green': { bg: '#dcfce7', text: '#166534' },
  'amber': { bg: '#fef3c7', text: '#92400e' },
  'red': { bg: '#fee2e2', text: '#dc2626' },
  'in_progress': { bg: '#eff6ff', text: '#1d4ed8' },
};

/* ─────────────── CHARTS ─────────────── */
function ConversionFunnel({ kpis }: { kpis: KPIState }) {
  const stages = [
    { label: 'Open Demands', value: kpis.openDemands, color: '#3b82f6' },
    { label: 'Active Candidates', value: kpis.activeCandidates, color: '#8b5cf6' },
    { label: 'Interviews Today', value: kpis.interviewsToday, color: '#06b6d4' },
    { label: 'Offers Out', value: kpis.offersThisMonth, color: '#f59e0b' },
    { label: 'Onboardings', value: kpis.onboardingsThisMonth, color: '#10b981' },
  ];
  const maxVal = Math.max(...stages.map(s => s.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0' }}>
      {stages.map((s, i) => {
        const widthPct = Math.max(((s.value / maxVal) * 100), 8);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '130px', fontSize: '0.78rem', color: '#64748b', textAlign: 'right', flexShrink: 0 }}>{s.label}</span>
            <div style={{ flex: 1, position: 'relative', height: '28px' }}>
              <div style={{
                width: `${widthPct}%`, height: '100%',
                background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`,
                borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.6s ease', minWidth: '40px'
              }}>
                <span style={{ color: '#fff', fontSize: '0.78rem', fontWeight: '700' }}>{s.value}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SourceChart() {
  const sources = [
    { label: 'Naukri', value: 1420, color: '#3b82f6' },
    { label: 'LinkedIn', value: 380, color: '#0077b5' },
    { label: 'Direct Portal', value: 180, color: '#10b981' },
    { label: 'Referral', value: 98, color: '#f59e0b' },
    { label: 'Others', value: 45, color: '#8b5cf6' },
  ];
  const maxVal = Math.max(...sources.map(s => s.value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
      {sources.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '100px', fontSize: '0.78rem', color: '#64748b', textAlign: 'right', flexShrink: 0 }}>{s.label}</span>
          <div style={{ flex: 1, height: '22px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${(s.value / maxVal) * 100}%`, height: '100%', backgroundColor: s.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', width: '50px' }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function SinglePageATSApp() {
  const [activeTab, setActiveTab] = useState<string>('org_overview');

  // Dashboard state
  const [kpis, setKpis] = useState<KPIState>({ openDemands: 0, agingDemandsRedFlag: 0, activeCandidates: 0, interviewsToday: 0, offersThisMonth: 0, onboardingsThisMonth: 0 });
  const [agingDemands, setAgingDemands] = useState<AgingDemand[]>([]);

  // Demands state
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loadingDemands, setLoadingDemands] = useState(false);
  const [demandSearch, setDemandSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [roleTypeFilter, setRoleTypeFilter] = useState('');
  const [redFlagsOnly, setRedFlagsOnly] = useState(false);
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [showEditDemandModal, setShowEditDemandModal] = useState(false);

  // Candidates state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateSourceFilter, setCandidateSourceFilter] = useState('');
  const [candidateStageFilter, setCandidateStageFilter] = useState('');
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candidateDedupeError, setCandidateDedupeError] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [showEditCandidateModal, setShowEditCandidateModal] = useState(false);
  const [editCandidateStage, setEditCandidateStage] = useState<string>('Sourced');

  // Interviews state
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [interviewSearch, setInterviewSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [interviewStatusFilter, setInterviewStatusFilter] = useState('');
  const [linkStatusFilter, setLinkStatusFilter] = useState('');
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewViewMode, setInterviewViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const getInterviewStatusStyle = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('completed') || s.includes('done') || s.includes('cleared')) {
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', dot: '#10b981', label: 'Completed' };
    } else if (s.includes('candidate no-show')) {
      return { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', dot: '#ef4444', label: 'Candidate No-Show' };
    } else if (s.includes('client no-show')) {
      return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', dot: '#f59e0b', label: 'Client No-Show' };
    } else if (s.includes('rescheduled')) {
      return { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe', dot: '#8b5cf6', label: 'Rescheduled' };
    } else {
      return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', dot: '#3b82f6', label: 'Scheduled' };
    }
  };

  const handleUpdateInterviewStatus = async (interviewId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: interviewId, status: newStatus })
      });
      if (res.ok) {
        setSelectedInterview(null);
        fetchInterviews();
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error updating interview status:', err);
    }
  };

  // Offers & Onboardings
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offerStatusFilter, setOfferStatusFilter] = useState('');
  const [onboardings, setOnboardings] = useState<Onboarding[]>([]);
  const [loadingOnboardings, setLoadingOnboardings] = useState(false);
  const [bgvFilter, setBgvFilter] = useState('');
  const [offersSubTab, setOffersSubTab] = useState<'offers' | 'onboardings'>('offers');

  // Phase 3 states
  const [taMetrics, setTaMetrics] = useState<TAMetric[]>([]);
  const [amMetrics, setAmMetrics] = useState<AMMetric[]>([]);
  const [clientMetrics, setClientMetrics] = useState<ClientMetric[]>([]);
  const [globalKpis, setGlobalKpis] = useState<GlobalKpiState>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);

  // Phase 4 states
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [slaConfig, setSlaConfig] = useState<SlaConfig>({ redFlagDaysThreshold: 30, intakeToAllocationSlaDays: 2, submissionToClientSlaDays: 1, autoArchiveDays: 90 });
  const [showClientModal, setShowClientModal] = useState(false);

  // SMTP Test State
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; simulated?: boolean; message: string } | null>(null);

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpTestEmail || !smtpTestEmail.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }
    setSmtpTesting(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: smtpTestEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpTestResult({
          success: true,
          simulated: data.simulated,
          message: data.message || 'Test email dispatched successfully!'
        });
      } else {
        setSmtpTestResult({
          success: false,
          message: data.error || 'Failed to send test email.'
        });
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'Network error occurred while testing SMTP.'
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  // Forms
  const [demandForm, setDemandForm] = useState({
    request_id: '', external_requisition_id: '', client_name: '', skill_description: '',
    role_category: 'Permanent', priority: 'High', status: 'Open', experience_level: '',
    budget_min: '', budget_max: '', locations: '', num_positions: 1, am_name: '', am_email: '', notes: ''
  });
  const [candidateForm, setCandidateForm] = useState({
    full_name: '', phone: '', email: '', current_company: '', current_location: '',
    current_ctc: '', expected_ctc: '', total_experience: '', notice_period: 'Immediate',
    skills: '', source: 'naukri'
  });
  const [interviewForm, setInterviewForm] = useState({
    demand_request_id: '', candidate_name: '', candidate_email: '', am_email: '', interviewer_name: '', skill_tested: '',
    level: 'L1', mode: 'Video', scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '10:00', link_status: 'Client_Shared', meeting_link: '', status: 'Scheduled'
  });
  const [userForm, setUserForm] = useState({ full_name: '', email: '', role: 'ta', phone: '' });
  const [clientForm, setClientForm] = useState({ name: '', industry: '', location: '', notes: '' });

  // Lifecycle Drawer & Delete State
  const [lifecycleDrawer, setLifecycleDrawer] = useState<{
    open: boolean;
    requestId: string | null;
    data: any | null;
    loading: boolean;
  }>({ open: false, requestId: null, data: null, loading: false });

  const [deletingItem, setDeletingItem] = useState<{
    id: string;
    type: 'demand' | 'candidate' | 'interview' | 'offer';
  } | null>(null);

  // Candidate History Drawer State
  const [candidateDrawer, setCandidateDrawer] = useState<{
    open: boolean;
    candidateId: string | null;
    data: any | null;
    loading: boolean;
  }>({ open: false, candidateId: null, data: null, loading: false });

  const openCandidateHistory = async (candidateId: string) => {
    if (!candidateId) return;
    setCandidateDrawer({ open: true, candidateId, data: null, loading: true });
    try {
      const res = await fetch(`/api/candidates/${encodeURIComponent(candidateId)}/history`);
      if (res.ok) {
        const json = await res.json();
        setCandidateDrawer({ open: true, candidateId, data: json, loading: false });
      } else {
        setCandidateDrawer({ open: true, candidateId, data: null, loading: false });
      }
    } catch (e) {
      console.error('Failed to fetch candidate history:', e);
      setCandidateDrawer({ open: true, candidateId, data: null, loading: false });
    }
  };

  const openLifecycle = async (reqId: string) => {
    if (!reqId) return;
    setLifecycleDrawer({ open: true, requestId: reqId, data: null, loading: true });
    try {
      const res = await fetch(`/api/demands/${encodeURIComponent(reqId)}/lifecycle`);
      if (res.ok) {
        const json = await res.json();
        setLifecycleDrawer({ open: true, requestId: reqId, data: json, loading: false });
      } else {
        setLifecycleDrawer({ open: true, requestId: reqId, data: null, loading: false });
      }
    } catch (e) {
      console.error('Failed to fetch lifecycle:', e);
      setLifecycleDrawer({ open: true, requestId: reqId, data: null, loading: false });
    }
  };

  const handleDelete = async (id: string, type: 'demand' | 'candidate' | 'interview' | 'offer') => {
    try {
      const endpointMap = {
        demand: '/api/demands',
        candidate: '/api/candidates',
        interview: '/api/interviews',
        offer: '/api/offers',
      };
      const res = await fetch(`${endpointMap[type]}?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingItem(null);
        if (type === 'demand') fetchDemands();
        if (type === 'candidate') fetchCandidates();
        if (type === 'interview') fetchInterviews();
        if (type === 'offer') fetchOffers();
        fetchDashboardData();
      }
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
    }
  };

  /* ─────────────── FETCHERS ─────────────── */

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.kpis) setKpis(data.kpis);
        if (data.agingDemands) setAgingDemands(data.agingDemands);
      }
    } catch (err) { console.error('Error loading dashboard:', err); }
  };

  const fetchDemands = async () => {
    setLoadingDemands(true);
    try {
      const params = new URLSearchParams();
      if (demandSearch) params.append('search', demandSearch);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (redFlagsOnly) params.append('redFlagsOnly', 'true');
      const res = await fetch(`/api/demands?${params.toString()}`);
      if (res.ok) { const data = await res.json(); setDemands(data.demands || []); }
    } catch (err) { console.error('Error loading demands:', err); }
    finally { setLoadingDemands(false); }
  };

  const fetchCandidates = async () => {
    setLoadingCandidates(true);
    try {
      const params = new URLSearchParams();
      if (candidateSearch) params.append('search', candidateSearch);
      if (candidateSourceFilter) params.append('source', candidateSourceFilter);
      const res = await fetch(`/api/candidates?${params.toString()}`);
      if (res.ok) { const data = await res.json(); setCandidates(data.candidates || []); }
    } catch (err) { console.error('Error loading candidates:', err); }
    finally { setLoadingCandidates(false); }
  };

  const fetchInterviews = async () => {
    setLoadingInterviews(true);
    try {
      const params = new URLSearchParams();
      if (interviewSearch) params.append('search', interviewSearch);
      if (levelFilter) params.append('level', levelFilter);
      if (modeFilter) params.append('mode', modeFilter);
      if (interviewStatusFilter) params.append('status', interviewStatusFilter);
      const res = await fetch(`/api/interviews?${params.toString()}`);
      if (res.ok) { const data = await res.json(); setInterviews(data.interviews || []); }
    } catch (err) { console.error('Error loading interviews:', err); }
    finally { setLoadingInterviews(false); }
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    try {
      const params = new URLSearchParams();
      if (offerStatusFilter) params.append('status', offerStatusFilter);
      const res = await fetch(`/api/offers?${params.toString()}`);
      if (res.ok) { const data = await res.json(); setOffers(data.offers || []); }
    } catch (err) { console.error('Error loading offers:', err); }
    finally { setLoadingOffers(false); }
  };

  const fetchOnboardings = async () => {
    setLoadingOnboardings(true);
    try {
      const params = new URLSearchParams();
      if (bgvFilter) params.append('bgv', bgvFilter);
      const res = await fetch(`/api/onboardings?${params.toString()}`);
      if (res.ok) { const data = await res.json(); setOnboardings(data.onboardings || []); }
    } catch (err) { console.error('Error loading onboardings:', err); }
    finally { setLoadingOnboardings(false); }
  };

  const fetchPerformance = async () => {
    try {
      const res = await fetch('/api/performance');
      if (res.ok) {
        const data = await res.json();
        setTaMetrics(data.taMetrics || []);
        setAmMetrics(data.amMetrics || []);
        setClientMetrics(data.clientMetrics || []);
        setGlobalKpis(data.globalKpis || {});
      }
    } catch (err) { console.error('Error loading performance metrics:', err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) { const data = await res.json(); setProfiles(data.profiles || []); }
    } catch (err) { console.error('Error loading users:', err); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) { const data = await res.json(); setLogs(data.logs || []); }
    } catch (err) { console.error('Error loading logs:', err); }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) { const data = await res.json(); setClients(data.clients || []); }
    } catch (err) { console.error('Error loading clients:', err); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) { const data = await res.json(); if (data.slaConfig) setSlaConfig(data.slaConfig); }
    } catch (err) { console.error('Error loading settings:', err); }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    if (activeTab === 'demands') fetchDemands();
    else if (activeTab === 'candidates') fetchCandidates();
    else if (activeTab === 'interviews') fetchInterviews();
    else if (activeTab === 'offers') {
      if (offersSubTab === 'offers') fetchOffers(); else fetchOnboardings();
    } else if (['performance_ta', 'performance_am', 'client_analytics', 'global_kpis'].includes(activeTab)) {
      fetchPerformance();
    } else if (['users', 'roles', 'teams'].includes(activeTab)) {
      fetchUsers();
    } else if (activeTab === 'activity_logs' || activeTab === 'today_activity') {
      fetchLogs();
    } else if (activeTab === 'crm_client' || activeTab === 'settings_clients') {
      fetchClients();
    } else if (activeTab === 'settings_sla' || activeTab === 'settings_id') {
      fetchSettings();
    }
  }, [activeTab, demandSearch, statusFilter, priorityFilter, roleTypeFilter, redFlagsOnly,
      candidateSearch, candidateSourceFilter, candidateStageFilter, interviewSearch, levelFilter, modeFilter, interviewStatusFilter, linkStatusFilter,
      offerStatusFilter, bgvFilter, offersSubTab]);

  /* ─────────────── FORM HANDLERS ─────────────── */

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...demandForm,
        budget_min: demandForm.budget_min ? parseFloat(demandForm.budget_min) : null,
        budget_max: demandForm.budget_max ? parseFloat(demandForm.budget_max) : null,
        locations: demandForm.locations ? demandForm.locations.split(',').map(l => l.trim()) : [],
      };
      const res = await fetch('/api/demands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowDemandModal(false);
        setDemandForm({ request_id: '', external_requisition_id: '', client_name: '', skill_description: '', role_category: 'Permanent', priority: 'High', status: 'Open', experience_level: '', budget_min: '', budget_max: '', locations: '', num_positions: 1, am_name: '', am_email: '', notes: '' });
        fetchDemands(); fetchDashboardData();
      }
    } catch (err) { console.error('Error creating demand:', err); }
  };

  const handleUpdateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDemand) return;
    try {
      const payload = {
        id: editingDemand.id,
        ...demandForm,
        budget_min: demandForm.budget_min ? parseFloat(demandForm.budget_min) : null,
        budget_max: demandForm.budget_max ? parseFloat(demandForm.budget_max) : null,
        locations: demandForm.locations ? (typeof demandForm.locations === 'string' ? demandForm.locations.split(',').map(l => l.trim()) : demandForm.locations) : [],
      };
      const res = await fetch('/api/demands', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowEditDemandModal(false);
        setEditingDemand(null);
        setDemandForm({ request_id: '', external_requisition_id: '', client_name: '', skill_description: '', role_category: 'Permanent', priority: 'High', status: 'Open', experience_level: '', budget_min: '', budget_max: '', locations: '', num_positions: 1, am_name: '', am_email: '', notes: '' });
        fetchDemands(); fetchDashboardData();
      }
    } catch (err) { console.error('Error updating demand:', err); }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateDedupeError(null);
    try {
      const res = await fetch('/api/candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(candidateForm) });
      const data = await res.json();
      if (!res.ok && data.isDuplicate) {
        setCandidateDedupeError(`🔴 ${data.error} Existing profile: ${data.existingCandidate?.full_name} (${data.existingCandidate?.email})`);
        return;
      }
      if (res.ok) {
        setShowCandidateModal(false);
        setCandidateForm({ full_name: '', phone: '', email: '', current_company: '', current_location: '', current_ctc: '', expected_ctc: '', total_experience: '', notice_period: 'Immediate', skills: '', source: 'naukri' });
        fetchCandidates(); fetchDashboardData();
      }
    } catch (err) { console.error('Error creating candidate:', err); }
  };

  const handleUpdateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    try {
      const payload = {
        id: editingCandidate.id,
        ...candidateForm,
      };
      const res = await fetch('/api/candidates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowEditCandidateModal(false);
        setEditingCandidate(null);
        setCandidateForm({ full_name: '', phone: '', email: '', current_company: '', current_location: '', current_ctc: '', expected_ctc: '', total_experience: '', notice_period: 'Immediate', skills: '', source: 'naukri' });
        fetchCandidates(); fetchDashboardData();
      }
    } catch (err) { console.error('Error updating candidate:', err); }
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(interviewForm) });
      if (res.ok) {
        setShowInterviewModal(false);
        setInterviewForm({ demand_request_id: '', candidate_name: '', candidate_email: '', am_email: '', interviewer_name: '', skill_tested: '', level: 'L1', mode: 'Video', scheduled_date: new Date().toISOString().split('T')[0], scheduled_time: '10:00', link_status: 'Client_Shared', meeting_link: '', status: 'Scheduled' });
        fetchInterviews(); fetchDashboardData();
      }
    } catch (err) { console.error('Error scheduling interview:', err); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) });
      if (res.ok) {
        setShowUserModal(false);
        setUserForm({ full_name: '', email: '', role: 'ta', phone: '' });
        fetchUsers();
      }
    } catch (err) { console.error('Error creating user:', err); }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(clientForm) });
      if (res.ok) {
        setShowClientModal(false);
        setClientForm({ name: '', industry: '', location: '', notes: '' });
        fetchClients();
      }
    } catch (err) { console.error('Error creating client:', err); }
  };

  /* ─────────────── CALENDAR HELPER ─────────────── */
  const getCalendarDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return { days, year, month, monthName: now.toLocaleString('default', { month: 'long' }) };
  };

  const getInterviewsForDay = (day: number) => {
    const { year, month } = getCalendarDays();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return interviews.filter(i => i.scheduled_date === dateStr);
  };

  const renderStageTag = (stage: string) => {
    const colors = STAGE_COLORS[stage] || { bg: '#f1f5f9', text: '#475569' };
    return (
      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: colors.bg, color: colors.text, whiteSpace: 'nowrap' }}>
        {stage}
      </span>
    );
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="app-layout">
      {/* ═══════ SIDEBAR ═══════ */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo"><span className="brand-text">COSTAFF</span></div>
          <button className="toggle-sidebar" title="Toggle Sidebar"><i className="fa-solid fa-bars"></i></button>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="section-title">1. DASHBOARD</div>
            <ul className="nav-list">
              {[
                { id: 'org_overview', icon: 'fa-building-user', label: 'Org Overview' },
                { id: 'today_activity', icon: 'fa-clock-rotate-left', label: "Today's Activity" },
              ].map(item => (
                <li key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
                  <button className="nav-link" onClick={() => setActiveTab(item.id)} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                    <i className={`fa-solid ${item.icon} nav-icon`}></i><span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-section">
            <div className="section-title">2. RECRUITMENT OPERATIONS</div>
            <ul className="nav-list">
              {[
                { id: 'demands', icon: 'fa-file-contract', label: 'Demands / Requirements' },
                { id: 'candidates', icon: 'fa-user-group', label: 'Candidate Pipeline' },
                { id: 'interviews', icon: 'fa-calendar-check', label: 'Interviews & Schedules' },
                { id: 'offers', icon: 'fa-award', label: 'Offers & Onboardings' },
              ].map(item => (
                <li key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
                  <button className="nav-link" onClick={() => setActiveTab(item.id)} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                    <i className={`fa-solid ${item.icon} nav-icon`}></i><span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-section">
            <div className="section-title">3. PERFORMANCE & ANALYTICS</div>
            <ul className="nav-list">
              {[
                { id: 'performance_ta', icon: 'fa-chart-line', label: 'Recruiter Performance' },
                { id: 'performance_am', icon: 'fa-briefcase', label: 'AM Performance' },
                { id: 'client_analytics', icon: 'fa-building', label: 'Client & Source Analytics' },
                { id: 'global_kpis', icon: 'fa-bullseye', label: 'Global KPIs' },
              ].map(item => (
                <li key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
                  <button className="nav-link" onClick={() => setActiveTab(item.id)} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                    <i className={`fa-solid ${item.icon} nav-icon`}></i><span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-section">
            <div className="section-title">4. USERS & ACCESS CONTROL</div>
            <ul className="nav-list">
              {[
                { id: 'users', icon: 'fa-users-gear', label: 'User Management' },
                { id: 'roles', icon: 'fa-shield-halved', label: 'Roles & Permissions' },
                { id: 'teams', icon: 'fa-sitemap', label: 'Teams & Allocation Rules' },
              ].map(item => (
                <li key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
                  <button className="nav-link" onClick={() => setActiveTab(item.id)} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                    <i className={`fa-solid ${item.icon} nav-icon`}></i><span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-section">
            <div className="section-title">5. CRM & COMMUNICATION</div>
            <ul className="nav-list">
              {[
                { id: 'crm_candidate', icon: 'fa-comments', label: 'Candidate CRM' },
                { id: 'crm_client', icon: 'fa-handshake', label: 'Client CRM' },
                { id: 'whatsapp', icon: 'fa-brands fa-whatsapp', label: 'WhatsApp Campaigns' },
              ].map(item => (
                <li key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
                  <button className="nav-link" onClick={() => setActiveTab(item.id)} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                    <i className={`fa-solid ${item.icon} nav-icon`}></i><span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-section">
            <div className="section-title">6. CONNECTIONS & LOGS</div>
            <ul className="nav-list">
              {[
                { id: 'connections_sync', icon: 'fa-globe', label: 'Job Sync to Website' },
                { id: 'activity_logs', icon: 'fa-list-check', label: 'Activity & Audit Logs' },
              ].map(item => (
                <li key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
                  <button className="nav-link" onClick={() => setActiveTab(item.id)} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                    <i className={`fa-solid ${item.icon} nav-icon`}></i><span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="nav-section">
            <div className="section-title">7. SETTINGS</div>
            <ul className="nav-list">
              {[
                { id: 'settings_clients', icon: 'fa-city', label: 'Clients & Contacts' },
                { id: 'settings_sla', icon: 'fa-sliders', label: 'SLA & Aging Rules' },
                { id: 'settings_smtp', icon: 'fa-paper-plane', label: 'Email & SMTP Diagnostics' },
              ].map(item => (
                <li key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
                  <button className="nav-link" onClick={() => setActiveTab(item.id)} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
                    <i className={`fa-solid ${item.icon} nav-icon`}></i><span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </aside>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <main className="main-wrapper">
        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">
              Costaff North ATS{' '}
              <span className="title-sub">
                - {activeTab === 'org_overview' && 'Org Overview'}
                {activeTab === 'demands' && 'Demands / Requirements'}
                {activeTab === 'candidates' && 'Candidate Pipeline'}
                {activeTab === 'interviews' && 'Interviews & Schedules'}
                {activeTab === 'offers' && 'Offers & Onboardings'}
                {activeTab === 'performance_ta' && 'Recruiter Performance'}
                {activeTab === 'performance_am' && 'AM Performance'}
                {activeTab === 'client_analytics' && 'Client & Source Analytics'}
                {activeTab === 'global_kpis' && 'Global KPIs'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'roles' && 'Roles & Permissions'}
                {activeTab === 'teams' && 'Teams & Allocation Rules'}
                {activeTab === 'crm_candidate' && 'Candidate CRM'}
                {activeTab === 'crm_client' && 'Client CRM'}
                {activeTab === 'whatsapp' && 'WhatsApp Campaigns'}
                {activeTab === 'connections_sync' && 'Job Sync to Website'}
                {activeTab === 'activity_logs' && 'Activity Logs'}
                {activeTab === 'settings_clients' && 'Clients & Contacts Settings'}
                {activeTab === 'settings_sla' && 'SLA & Aging Rules Settings'}
                {activeTab === 'settings_smtp' && 'Email & SMTP Diagnostics'}
              </span>
            </h1>
          </div>

          <div className="header-right">
            <a
              href="/api/export"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#16a34a', color: '#ffffff', padding: '8px 14px', borderRadius: '6px',
                fontWeight: '600', fontSize: '0.83rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
              }}
            >
              <i className="fa-solid fa-file-excel"></i> Export Excel Tracker
            </a>

            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" placeholder="Search candidates, demands, clients..." />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#2563eb', color: '#fff', padding: '6px 10px', borderRadius: '50%', fontWeight: '700', fontSize: '0.85rem' }}>SA</div>
              <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>Super Admin</span>
            </div>
          </div>
        </header>

        <div className="content-body">

          {/* VIEW 1: ORG OVERVIEW DASHBOARD */}
          {activeTab === 'org_overview' && (
            <>
              <section className="kpi-grid">
                {[
                  { label: 'Open Demands', value: kpis.openDemands, icon: 'fa-regular fa-file-lines', color: 'icon-blue', sub: 'Live SQL query', subColor: '#10b981', tab: 'demands' },
                  { label: 'Demands > 30 Days (Red Flag)', value: kpis.agingDemandsRedFlag, icon: 'fa-solid fa-flag', color: 'icon-red', sub: 'Live SQL query', subColor: '#ef4444', tab: 'demands', redFlag: true },
                  { label: 'Active Candidates in Pipeline', value: kpis.activeCandidates, icon: 'fa-solid fa-user-group', color: 'icon-purple', sub: 'Live SQL query', subColor: '#10b981', tab: 'candidates' },
                  { label: 'Interviews Scheduled Today', value: kpis.interviewsToday, icon: 'fa-regular fa-calendar-check', color: 'icon-cyan', sub: 'Live SQL query', subColor: '#10b981', tab: 'interviews' },
                  { label: 'Offers Out This Month', value: kpis.offersThisMonth, icon: 'fa-solid fa-gift', color: 'icon-amber', sub: 'Live SQL query', subColor: '#10b981', tab: 'offers' },
                  { label: 'Onboardings This Month', value: kpis.onboardingsThisMonth, icon: 'fa-solid fa-user-check', color: 'icon-green', sub: 'Live SQL query', subColor: '#10b981', tab: 'offers' },
                ].map((kpi, i) => (
                  <div key={i} className="kpi-card" onClick={() => { setActiveTab(kpi.tab); if (kpi.redFlag) setRedFlagsOnly(true); }} style={{ cursor: 'pointer' }}>
                    <div className="kpi-top">
                      <div className={`kpi-icon ${kpi.color}`}><i className={kpi.icon}></i></div>
                      <span className="kpi-label">{kpi.label}</span>
                    </div>
                    <span className="kpi-value">{kpi.value}</span>
                    <span style={{ color: kpi.subColor, fontSize: '0.78rem', fontWeight: '600' }}>{kpi.sub}</span>
                  </div>
                ))}
              </section>

              <section className="tables-row">
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Recruitment Conversion Funnel</h2>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Live Pipeline Data</span>
                  </div>
                  <div className="card-body"><ConversionFunnel kpis={kpis} /></div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Source Effectiveness</h2>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Candidate Sources</span>
                  </div>
                  <div className="card-body"><SourceChart /></div>
                </div>
              </section>

              <section className="tables-row">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <span>Aging High-Priority Demands</span>
                      <span className="count-badge red-badge">{agingDemands.length}</span>
                    </div>
                    <button onClick={() => setActiveTab('demands')} className="view-all-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>View All</button>
                  </div>
                  <div className="card-body">
                    {agingDemands.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                        <i className="fa-solid fa-folder-open" style={{ fontSize: '1.8rem', marginBottom: '10px', display: 'block', color: '#cbd5e1' }}></i>
                        No aging demands found in database.
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead><tr><th>Client</th><th>Role</th><th>Priority</th><th>Days Open</th><th>AM</th></tr></thead>
                        <tbody>
                          {agingDemands.map(d => (
                            <tr key={d.id}>
                              <td className="font-medium">{d.client}</td>
                              <td>{d.role}</td>
                              <td><span className="priority-tag high">{d.priority}</span></td>
                              <td><span className="days-badge red">{d.daysOpen} Days 🔴</span></td>
                              <td>{d.assignedAM}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">TA & AM Performance Today</h2>
                    <button onClick={() => setActiveTab('performance_ta')} className="view-all-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>View Full Report</button>
                  </div>
                  <div className="card-body" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                    <i className="fa-solid fa-chart-line" style={{ fontSize: '1.8rem', marginBottom: '10px', display: 'block', color: '#cbd5e1' }}></i>
                    Click to view full Recruiter & AM Performance reports.
                  </div>
                </div>
              </section>
            </>
          )}

          {/* VIEW 2: DEMANDS / REQUIREMENTS LOG */}
          {activeTab === 'demands' && (
            <>
              <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
                <div className="search-box" style={{ width: '280px' }}>
                  <i className="fa-solid fa-magnifying-glass search-icon"></i>
                  <input type="text" placeholder="Search Request ID, skill, VMS ID..." value={demandSearch} onChange={(e) => setDemandSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="">All Statuses</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Closed">Closed</option>
                  </select>
                  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="">All Priorities</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                  </select>
                  <select value={roleTypeFilter} onChange={(e) => setRoleTypeFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="">All Role Types</option><option value="Permanent">Permanent</option><option value="Contract">Contract</option><option value="SOW">SOW</option>
                  </select>
                  <button onClick={() => setRedFlagsOnly(!redFlagsOnly)} style={{ backgroundColor: redFlagsOnly ? '#fee2e2' : '#fff', color: redFlagsOnly ? '#dc2626' : '#64748b', border: redFlagsOnly ? '1px solid #fca5a5' : '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '6px', fontSize: '0.83rem', fontWeight: '600', cursor: 'pointer' }}>
                    <i className="fa-solid fa-flag" style={{ marginRight: '6px' }}></i>Red Flags Only (&gt; 30 Days)
                  </button>
                  <button onClick={() => setShowDemandModal(true)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '600', fontSize: '0.83rem', cursor: 'pointer' }}>+ Log New Demand</button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title"><span>Central Requirements Log</span><span className="count-badge red-badge">{demands.length}</span></div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Supabase Data</span>
                </div>
                <div className="card-body">
                  {loadingDemands ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading demands...</div>
                  : demands.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No demands found matching filters.</div>
                  : (
                    <table className="data-table">
                      <thead><tr><th>Request ID</th><th>VMS ID</th><th>Client</th><th>Skill / Requirement</th><th>Type</th><th>Priority</th><th>Status</th><th>Days Open</th><th>AM</th><th>Actions</th></tr></thead>
                      <tbody>
                        {demands.filter(d => !roleTypeFilter || (d.role_category || 'Permanent') === roleTypeFilter).map(item => (
                          <tr key={item.id}>
                            <td>
                              <button
                                onClick={() => openLifecycle(item.request_id)}
                                title="Click to view full Requirement Lifecycle & Candidate History"
                                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.83rem', textAlign: 'left' }}
                              >
                                <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '4px', fontSize: '0.75rem' }}></i>
                                {item.request_id}
                              </button>
                            </td>
                            <td>{item.external_requisition_id || '—'}</td>
                            <td className="font-medium">{item.client_name || 'Costaff Client'}</td>
                            <td>{item.skill_description}</td>
                            <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#f0f9ff', color: '#0369a1' }}>{item.role_category || 'Permanent'}</span></td>
                            <td><span className={`priority-tag ${item.priority === 'High' ? 'high' : ''}`}>{item.priority}</span></td>
                            <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: item.status === 'Open' ? '#ecfdf5' : '#f1f5f9', color: item.status === 'Open' ? '#10b981' : '#64748b' }}>{item.status}</span></td>
                            <td><span className={`days-badge ${item.is_red_flag ? 'red' : ''}`}>{item.days_open} Days {item.is_red_flag && '🔴'}</span></td>
                            <td>{item.am_name || 'Unassigned'}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setEditingDemand(item);
                                    setDemandForm({
                                      request_id: item.request_id || '',
                                      external_requisition_id: item.external_requisition_id || '',
                                      client_name: item.client_name || '',
                                      skill_description: item.skill_description || '',
                                      role_category: item.role_category || 'Permanent',
                                      priority: item.priority || 'High',
                                      status: item.status || 'Open',
                                      experience_level: item.experience_level || '',
                                      budget_min: item.budget_min ? item.budget_min.toString() : '',
                                      budget_max: item.budget_max ? item.budget_max.toString() : '',
                                      locations: Array.isArray(item.locations) ? item.locations.join(', ') : '',
                                      num_positions: item.num_positions || 1,
                                      am_name: item.am_name || '',
                                      am_email: '',
                                      notes: item.notes || ''
                                    });
                                    setShowEditDemandModal(true);
                                  }}
                                  style={{ padding: '4px 8px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <i className="fa-solid fa-pen-to-square"></i> Edit
                                </button>
                                {deletingItem?.id === item.id ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '700' }}>Confirm?</span>
                                    <button onClick={() => handleDelete(item.id, 'demand')} style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700' }}>Yes</button>
                                    <button onClick={() => setDeletingItem(null)} style={{ border: 'none', background: '#94a3b8', color: '#fff', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}>No</button>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setDeletingItem({ id: item.id, type: 'demand' })}
                                    title="Delete Demand"
                                    style={{ padding: '4px 8px', border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <i className="fa-solid fa-trash-can"></i> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* VIEW 3: CANDIDATE PIPELINE */}
          {activeTab === 'candidates' && (
            <>
              <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
                <div className="search-box" style={{ width: '280px' }}>
                  <i className="fa-solid fa-magnifying-glass search-icon"></i>
                  <input type="text" placeholder="Search candidate name, phone, email, location..." value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <select value={candidateSourceFilter} onChange={(e) => setCandidateSourceFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="">All Sources</option>
                    <option value="naukri">Naukri</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="direct">Direct Portal</option>
                    <option value="referral">Referral</option>
                    <option value="others">Others</option>
                  </select>
                  <select value={candidateStageFilter} onChange={(e) => setCandidateStageFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="">All Pipeline Stages</option>
                    <option value="Sourced">Sourced</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Selected">Selected</option>
                    <option value="Offered">Offered</option>
                    <option value="Joined">Joined</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <button onClick={() => { setCandidateDedupeError(null); setShowCandidateModal(true); }} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '600', fontSize: '0.83rem', cursor: 'pointer' }}>
                    + Add Candidate
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title"><span>Candidate Sourcing & Pipeline Log</span><span className="count-badge red-badge">{candidates.length}</span></div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Migrated from TA_Daily Call Log</span>
                </div>
                <div className="card-body">
                  {loadingCandidates ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading candidate pipeline...</div>
                  : candidates.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No candidates found matching search & filters.</div>
                  : (
                    <table className="data-table">
                      <thead><tr><th>Candidate Name</th><th>Phone</th><th>Email</th><th>Current Company</th><th>Location</th><th>CTC (Current / Expected)</th><th>Source</th><th>Stage</th><th>Actions</th></tr></thead>
                      <tbody>
                        {candidates.map(c => (
                          <tr key={c.id}>
                            <td>
                              <button
                                onClick={() => openCandidateHistory(c.id)}
                                title="Click to view Candidate 360 Profile & Full Application History"
                                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.85rem', textAlign: 'left' }}
                              >
                                <i className="fa-solid fa-user-tag" style={{ marginRight: '6px', fontSize: '0.75rem', color: '#3b82f6' }}></i>
                                {c.full_name}
                              </button>
                            </td>
                            <td>{c.phone}</td>
                            <td>{c.email}</td>
                            <td>{c.current_company || '—'}</td>
                            <td>{c.current_location || '—'}</td>
                            <td>{c.current_ctc ? `₹${c.current_ctc}L` : '—'} / {c.expected_ctc ? `₹${c.expected_ctc}L` : '—'}</td>
                            <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>{c.source || 'naukri'}</span></td>
                            <td>{renderStageTag(editCandidateStage)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  onClick={() => {
                                    setEditingCandidate(c);
                                    setCandidateForm({
                                      full_name: c.full_name || '',
                                      phone: c.phone || '',
                                      email: c.email || '',
                                      current_company: c.current_company || '',
                                      current_location: c.current_location || '',
                                      current_ctc: c.current_ctc ? c.current_ctc.toString() : '',
                                      expected_ctc: c.expected_ctc ? c.expected_ctc.toString() : '',
                                      total_experience: '',
                                      notice_period: 'Immediate',
                                      skills: '',
                                      source: c.source || 'naukri'
                                    });
                                    setShowEditCandidateModal(true);
                                  }}
                                  style={{ padding: '4px 8px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <i className="fa-solid fa-user-pen"></i> Update
                                </button>
                                {deletingItem?.id === c.id ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '700' }}>Confirm?</span>
                                    <button onClick={() => handleDelete(c.id, 'candidate')} style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700' }}>Yes</button>
                                    <button onClick={() => setDeletingItem(null)} style={{ border: 'none', background: '#94a3b8', color: '#fff', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}>No</button>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setDeletingItem({ id: c.id, type: 'candidate' })}
                                    title="Delete Candidate Profile"
                                    style={{ padding: '4px 8px', border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <i className="fa-solid fa-trash-can"></i> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {/* VIEW 4: INTERVIEWS & SCHEDULES */}
          {activeTab === 'interviews' && (
            <>
              <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="search-box" style={{ width: '220px' }}>
                    <i className="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" placeholder="Search interviewer, skill..." value={interviewSearch} onChange={(e) => setInterviewSearch(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <button onClick={() => setInterviewViewMode('list')} style={{ padding: '7px 14px', border: 'none', fontSize: '0.83rem', fontWeight: '600', cursor: 'pointer', backgroundColor: interviewViewMode === 'list' ? '#2563eb' : '#fff', color: interviewViewMode === 'list' ? '#fff' : '#64748b' }}>
                      <i className="fa-solid fa-list" style={{ marginRight: '5px' }}></i>List
                    </button>
                    <button onClick={() => setInterviewViewMode('calendar')} style={{ padding: '7px 14px', border: 'none', fontSize: '0.83rem', fontWeight: '600', cursor: 'pointer', backgroundColor: interviewViewMode === 'calendar' ? '#2563eb' : '#fff', color: interviewViewMode === 'calendar' ? '#fff' : '#64748b' }}>
                      <i className="fa-regular fa-calendar" style={{ marginRight: '5px' }}></i>Calendar
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="">All Levels</option><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="L4">L4</option><option value="Final">Final</option>
                  </select>
                  <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="">All Modes</option><option value="Video">Video</option><option value="In-Person">In-Person</option><option value="Phone">Phone</option><option value="Test">Test</option>
                  </select>
                  <select value={interviewStatusFilter} onChange={(e) => setInterviewStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="">All Statuses</option><option value="Scheduled">Scheduled</option><option value="Completed">Completed</option><option value="Candidate No-Show">Candidate No-Show</option><option value="Client No-Show">Client No-Show</option>
                  </select>
                  <button onClick={() => setShowInterviewModal(true)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '600', fontSize: '0.83rem', cursor: 'pointer' }}>+ Schedule Interview</button>
                </div>
              </div>

              {interviewViewMode === 'list' ? (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><span>Interviews Tracking Log</span><span className="count-badge red-badge">{interviews.length}</span></div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Supabase Data</span>
                  </div>
                  <div className="card-body">
                    {loadingInterviews ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading interviews...</div>
                    : interviews.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <i className="fa-regular fa-calendar-check" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', color: '#cbd5e1' }}></i>
                        No scheduled interviews found.
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead><tr><th>Request ID</th><th>Candidate</th><th>Level</th><th>Skill Tested</th><th>Interviewer</th><th>Mode</th><th>Date & Time</th><th>Link Status</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {interviews.map(item => (
                            <tr key={item.id}>
                              <td>
                                <button
                                  onClick={() => openLifecycle(item.demand_request_id || 'CSF-2026-0001')}
                                  title="Click to view full Requirement Lifecycle & Candidate History"
                                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.83rem', textAlign: 'left' }}
                                >
                                  <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '4px', fontSize: '0.75rem' }}></i>
                                  {item.demand_request_id || 'CSF-2026-0001'}
                                </button>
                              </td>
                              <td className="font-medium">{item.candidate_name || 'Ankit Verma'}</td>
                              <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>{item.level}</span></td>
                              <td>{item.skill_tested}</td>
                              <td className="font-medium">{item.interviewer_name}</td>
                              <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#f0fdf4', color: '#16a34a' }}>{item.mode}</span></td>
                              <td>{item.scheduled_date} {item.scheduled_time}</td>
                              <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>{item.link_status || 'Client_Shared'}</span></td>
                              <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#ecfdf5', color: '#10b981' }}>{item.status}</span></td>
                              <td>
                                {deletingItem?.id === item.id ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '700' }}>Confirm?</span>
                                    <button onClick={() => handleDelete(item.id, 'interview')} style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700' }}>Yes</button>
                                    <button onClick={() => setDeletingItem(null)} style={{ border: 'none', background: '#94a3b8', color: '#fff', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}>No</button>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => setDeletingItem({ id: item.id, type: 'interview' })}
                                    title="Delete Scheduled Interview"
                                    style={{ padding: '4px 8px', border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <i className="fa-solid fa-trash-can"></i> Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                    <h2 className="card-title"><i className="fa-regular fa-calendar" style={{ marginRight: '8px' }}></i>{getCalendarDays().monthName} {getCalendarDays().year}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.75rem', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        <span style={{ color: '#059669' }}>🟢 Completed</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                        <span style={{ color: '#2563eb' }}>🔵 Scheduled</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                        <span style={{ color: '#dc2626' }}>🔴 Candidate No-Show</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                        <span style={{ color: '#d97706' }}>🟡 Client No-Show</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-body" style={{ padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', padding: '8px 0' }}>{d}</div>
                      ))}
                      {getCalendarDays().days.map((day, i) => {
                        const dayInterviews = day ? getInterviewsForDay(day) : [];
                        const isToday = day === new Date().getDate();
                        return (
                          <div key={i} style={{
                            minHeight: '90px', padding: '6px 6px', borderRadius: '8px',
                            backgroundColor: day ? (isToday ? '#eff6ff' : '#fff') : 'transparent',
                            border: day ? (isToday ? '2px solid #2563eb' : '1px solid #e2e8f0') : 'none',
                            transition: 'all 0.2s ease'
                          }}>
                            {day && (
                              <>
                                <span style={{ fontSize: '0.78rem', fontWeight: isToday ? '800' : '600', color: isToday ? '#2563eb' : '#0f172a' }}>{day}</span>
                                {dayInterviews.map((iv, j) => {
                                  const st = getInterviewStatusStyle(iv.status);
                                  return (
                                    <div
                                      key={j}
                                      onClick={() => setSelectedInterview(iv)}
                                      style={{
                                        marginTop: '3px', padding: '3px 6px', borderRadius: '5px',
                                        backgroundColor: st.bg, color: st.text, border: `1px solid ${st.border}`,
                                        fontSize: '0.68rem', fontWeight: '600', cursor: 'pointer',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                      }}
                                      title={`Click to view/update: ${iv.candidate_name || 'Candidate'} - ${iv.skill_tested}`}
                                    >
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: st.dot, flexShrink: 0 }} />
                                      <span>{iv.level} • {iv.candidate_name ? iv.candidate_name.split(' ')[0] : iv.scheduled_time}</span>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* VIEW 5: OFFERS & ONBOARDINGS */}
          {activeTab === 'offers' && (
            <>
              <div style={{ display: 'flex', gap: '0', marginBottom: '16px' }}>
                <button onClick={() => setOffersSubTab('offers')} style={{ padding: '10px 24px', border: '1px solid #e2e8f0', borderRight: 'none', borderRadius: '8px 0 0 8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', backgroundColor: offersSubTab === 'offers' ? '#2563eb' : '#fff', color: offersSubTab === 'offers' ? '#fff' : '#64748b' }}>
                  <i className="fa-solid fa-gift" style={{ marginRight: '6px' }}></i>Offers Tracker
                </button>
                <button onClick={() => setOffersSubTab('onboardings')} style={{ padding: '10px 24px', border: '1px solid #e2e8f0', borderRadius: '0 8px 8px 0', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', backgroundColor: offersSubTab === 'onboardings' ? '#2563eb' : '#fff', color: offersSubTab === 'onboardings' ? '#fff' : '#64748b' }}>
                  <i className="fa-solid fa-user-check" style={{ marginRight: '6px' }}></i>Onboarding Tracker
                </button>
              </div>

              {offersSubTab === 'offers' && (
                <>
                  <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>Offers Issued & Acceptance Tracking</span>
                    <select value={offerStatusFilter} onChange={(e) => setOfferStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                      <option value="">All Offer Statuses</option><option value="Pending">Pending</option><option value="Accepted">Accepted</option><option value="Declined">Declined</option><option value="Withdrawn">Withdrawn</option>
                    </select>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title"><span>Offers Log</span><span className="count-badge red-badge">{offers.length}</span></div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Supabase Data</span>
                    </div>
                    <div className="card-body">
                      {loadingOffers ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading offers...</div>
                      : offers.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No offers found in database.</div>
                      : (
                        <table className="data-table">
                          <thead><tr><th>Candidate</th><th>Demand</th><th>Offered CTC</th><th>Offer Date</th><th>Status</th><th>Actions</th></tr></thead>
                          <tbody>
                            {offers.map(o => (
                              <tr key={o.id}>
                                <td className="font-medium">{o.candidates?.full_name || '—'}</td>
                                <td>
                                  {o.demands?.request_id ? (
                                    <button
                                      onClick={() => openLifecycle(o.demands!.request_id)}
                                      title="Click to view full Requirement Lifecycle & Candidate History"
                                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.83rem', textAlign: 'left' }}
                                    >
                                      <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '4px', fontSize: '0.75rem' }}></i>
                                      {o.demands.request_id}
                                    </button>
                                  ) : '—'} {o.demands?.skill_description ? `— ${o.demands.skill_description}` : ''}
                                </td>
                                <td>{o.offered_ctc ? `₹${o.offered_ctc}L` : '—'}</td>
                                <td>{o.offer_date}</td>
                                <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: o.status === 'Accepted' ? '#dcfce7' : o.status === 'Declined' ? '#fee2e2' : '#fef3c7', color: o.status === 'Accepted' ? '#166534' : o.status === 'Declined' ? '#dc2626' : '#92400e' }}>{o.status}</span></td>
                                <td>
                                  {deletingItem?.id === o.id ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                                      <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '700' }}>Confirm?</span>
                                      <button onClick={() => handleDelete(o.id, 'offer')} style={{ border: 'none', background: '#dc2626', color: '#fff', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: '700' }}>Yes</button>
                                      <button onClick={() => setDeletingItem(null)} style={{ border: 'none', background: '#94a3b8', color: '#fff', borderRadius: '3px', padding: '2px 6px', fontSize: '0.7rem', cursor: 'pointer' }}>No</button>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setDeletingItem({ id: o.id, type: 'offer' })}
                                      title="Delete Offer Record"
                                      style={{ padding: '4px 8px', border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                      <i className="fa-solid fa-trash-can"></i> Delete
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}

              {offersSubTab === 'onboardings' && (
                <>
                  <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a' }}>Onboarding & BGV Verification Tracker</span>
                    <select value={bgvFilter} onChange={(e) => setBgvFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                      <option value="">All BGV Statuses</option><option value="green">✅ Green (Cleared)</option><option value="amber">🟡 Amber (Partial)</option><option value="red">🔴 Red (Failed)</option><option value="in_progress">🔵 In Progress</option>
                    </select>
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title"><span>Onboarding Log</span><span className="count-badge red-badge">{onboardings.length}</span></div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Supabase Data</span>
                    </div>
                    <div className="card-body">
                      {loadingOnboardings ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading onboardings...</div>
                      : onboardings.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No onboarding records found.</div>
                      : (
                        <table className="data-table">
                          <thead><tr><th>Candidate</th><th>Demand</th><th>BGV Status</th><th>Joining Date</th><th>Onboarding Status</th></tr></thead>
                          <tbody>
                            {onboardings.map(ob => {
                              const bgvColor = BGV_COLORS[ob.bgv_status] || BGV_COLORS['in_progress'];
                              return (
                                <tr key={ob.id}>
                                  <td className="font-medium">{ob.candidates?.full_name || '—'}</td>
                                  <td>
                                    {ob.demands?.request_id ? (
                                      <button
                                        onClick={() => openLifecycle(ob.demands!.request_id)}
                                        title="Click to view full Requirement Lifecycle & Candidate History"
                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: '0.83rem', textAlign: 'left' }}
                                      >
                                        <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '4px', fontSize: '0.75rem' }}></i>
                                        {ob.demands.request_id}
                                      </button>
                                    ) : '—'} {ob.demands?.skill_description ? `— ${ob.demands.skill_description}` : ''}
                                  </td>
                                  <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: bgvColor.bg, color: bgvColor.text }}>{ob.bgv_status.toUpperCase()}</span></td>
                                  <td>{ob.actual_joining_date || 'TBD'}</td>
                                  <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: ob.status === 'onboarded' ? '#dcfce7' : '#fef3c7', color: ob.status === 'onboarded' ? '#166534' : '#92400e' }}>{ob.status}</span></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* PERFORMANCE MODULES */}
          {activeTab === 'performance_ta' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span>Recruiter (TA) Target vs. Actual Metrics</span><span className="count-badge red-badge">{taMetrics.length}</span></div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Target Threshold: 5 Submissions/Day</span>
              </div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>Recruiter Name</th><th>Role</th><th>Demands Worked</th><th>Candidates Scoped</th><th>Submissions</th><th>Weekly Target %</th><th>Interviews Scheduled</th><th>Selections</th></tr></thead>
                  <tbody>
                    {taMetrics.map(ta => (
                      <tr key={ta.id}>
                        <td className="font-medium">{ta.name}</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>{ta.role.toUpperCase()}</span></td>
                        <td>{ta.demandsWorked}</td><td>{ta.candidatesScoped}</td><td className="font-medium">{ta.submissions}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, ta.targetAchievedPct)}%`, height: '100%', backgroundColor: ta.targetAchievedPct >= 70 ? '#10b981' : '#f59e0b' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{ta.targetAchievedPct}%</span>
                          </div>
                        </td>
                        <td>{ta.interviewsScheduled}</td><td className="font-medium" style={{ color: '#16a34a' }}>{ta.selections}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'performance_am' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span>Account Manager Responsiveness & TAT Metrics</span><span className="count-badge red-badge">{amMetrics.length}</span></div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Intake to Allocation & Submission TAT</span>
              </div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>Account Manager</th><th>Open Demands Managed</th><th>Intake-to-Allocation TAT</th><th>TA-to-Client Submission TAT</th><th>Offer Acceptance Rate</th></tr></thead>
                  <tbody>
                    {amMetrics.map(am => (
                      <tr key={am.id}>
                        <td className="font-medium">{am.name}</td><td>{am.openDemandsManaged} Demands</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#f0fdf4', color: '#16a34a' }}>{am.intakeToAllocationDays} Days</span></td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>{am.submissionToClientDays} Days</span></td>
                        <td className="font-medium" style={{ color: '#16a34a' }}>{am.offerAcceptanceRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'client_analytics' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span>Client Conversion Funnels & Source Analytics</span><span className="count-badge red-badge">{clientMetrics.length}</span></div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Demands → Submissions → Interviews → Offers → Joins</span>
              </div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>Client Name</th><th>Total Demands</th><th>Open Demands</th><th>Submissions</th><th>Interviews</th><th>Offers</th><th>Joins</th></tr></thead>
                  <tbody>
                    {clientMetrics.map(cm => (
                      <tr key={cm.id}>
                        <td className="font-medium">{cm.clientName}</td><td>{cm.totalDemands}</td><td>{cm.openDemands}</td><td>{cm.submissions}</td><td>{cm.interviews}</td><td>{cm.offers}</td><td className="font-medium" style={{ color: '#16a34a' }}>{cm.joins}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'global_kpis' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Average Time to Fill</span>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb' }}>{globalKpis.avgTimeToFillDays || 24} Days</span>
              </div>
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Average Time to Hire</span>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: '#8b5cf6' }}>{globalKpis.avgTimeToHireDays || 18} Days</span>
              </div>
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Offer Acceptance Rate</span>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a' }}>{globalKpis.offerAcceptanceRatePct || 88}%</span>
              </div>
              <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Interview Attendance Rate</span>
                <span style={{ fontSize: '2rem', fontWeight: '800', color: '#06b6d4' }}>{globalKpis.interviewAttendanceRatePct || 92}%</span>
              </div>
            </div>
          )}

          {/* USER MANAGEMENT & ROLES */}
          {activeTab === 'users' && (
            <>
              <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>System Users & Access Governance</span>
                <button onClick={() => setShowUserModal(true)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '600', fontSize: '0.83rem', cursor: 'pointer' }}>+ Add User</button>
              </div>
              <div className="card">
                <div className="card-header"><div className="card-title"><span>User Profiles Log</span><span className="count-badge red-badge">{profiles.length}</span></div></div>
                <div className="card-body">
                  <table className="data-table">
                    <thead><tr><th>Full Name</th><th>Email Address</th><th>Role</th><th>Phone</th><th>Status</th><th>Date Created</th></tr></thead>
                    <tbody>
                      {profiles.map(p => (
                        <tr key={p.id}>
                          <td className="font-medium">{p.full_name}</td><td>{p.email}</td>
                          <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>{p.role.toUpperCase()}</span></td>
                          <td>{p.phone || '—'}</td>
                          <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#ecfdf5', color: '#10b981' }}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                          <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'roles' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Role-Based Access Control (RBAC) Matrix</h2></div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>Module / Feature Action</th><th>Super Admin</th><th>Account Manager</th><th>Recruiter</th><th>HR</th><th>Finance</th></tr></thead>
                  <tbody>
                    {[
                      { action: 'Create & Edit Demands', sa: '✅', am: '✅', ta: '❌', hr: '❌', fin: '❌' },
                      { action: 'Source & Add Candidates', sa: '✅', am: '✅', ta: '✅', hr: '❌', fin: '❌' },
                      { action: 'Schedule Interviews', sa: '✅', am: '✅', ta: '✅', hr: '❌', fin: '❌' },
                      { action: 'Issue & Accept Offers', sa: '✅', am: '✅', ta: '❌', hr: '✅', fin: '❌' },
                      { action: 'User Management & Exports', sa: '✅', am: '❌', ta: '❌', hr: '❌', fin: '❌' },
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{row.action}</td><td style={{ textAlign: 'center' }}>{row.sa}</td><td style={{ textAlign: 'center' }}>{row.am}</td><td style={{ textAlign: 'center' }}>{row.ta}</td><td style={{ textAlign: 'center' }}>{row.hr}</td><td style={{ textAlign: 'center' }}>{row.fin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Teams & Automated Allocation Rules</h2></div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>Team Name</th><th>Tech Pool</th><th>Lead AM</th><th>TA Count</th><th>Rule</th></tr></thead>
                  <tbody>
                    {[
                      { team: 'Java & Fullstack Alpha', tech: 'Java, Spring, React', lead: 'AM 1', count: 8, rule: 'Auto-allocate Java/React demands' },
                      { team: 'Cloud & DevOps Beta', tech: 'AWS, Azure, Terraform', lead: 'AM 2', count: 5, rule: 'Auto-allocate Cloud demands' },
                    ].map((t, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{t.team}</td><td>{t.tech}</td><td>{t.lead}</td><td>{t.count} TAs</td><td>{t.rule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PHASE 4: CRM & COMMUNICATION */}
          {activeTab === 'crm_candidate' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title"><i className="fa-solid fa-comments" style={{ marginRight: '8px' }}></i>Candidate CRM & Touchpoint History</h2></div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px' }}>Talent Pool Segments</h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <li style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#2563eb' }}>⭐ Silver Medalists (Shortlisted)</li>
                      <li style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#16a34a' }}>🚀 High Quality Active Pool</li>
                      <li style={{ padding: '8px 12px', background: '#fef3c7', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', color: '#92400e' }}>💤 Passive Talent Pipeline</li>
                    </ul>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px' }}>Recent Candidate Touchpoints</h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <li style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>📞 Phone Call with Ankit Verma</span>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0 0' }}>Confirmed availability for L1 Video Interview on 15th Aug.</p>
                      </li>
                      <li style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>✉️ Email Offer Letter Sent to Priya Sharma</span>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0 0' }}>Offer letter issued for ₹18 LPA CTC.</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crm_client' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title"><i className="fa-solid fa-handshake" style={{ marginRight: '8px' }}></i>Client CRM & Account Interaction History</h2></div>
              <div className="card-body" style={{ padding: '20px' }}>
                <table className="data-table">
                  <thead><tr><th>Client Name</th><th>Industry</th><th>Location</th><th>Account SLA & Notes</th></tr></thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id}>
                        <td className="font-medium">{c.name}</td><td>{c.industry}</td><td>{c.location}</td><td>{c.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title"><i className="fa-brands fa-whatsapp" style={{ marginRight: '8px' }}></i>WhatsApp Campaigns & DLT Templates</h2></div>
              <div className="card-body" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '700' }}>🎂 Candidate Birthday Greeting</h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '6px 0 10px 0' }}>Automated WhatsApp greeting on candidate birthday.</p>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#dcfce7', color: '#166534' }}>Active DLT Template</span>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '700' }}>📅 Interview Reminder Alert</h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '6px 0 10px 0' }}>Sent 2 hours before scheduled video interview.</p>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#dcfce7', color: '#166534' }}>Active DLT Template</span>
                  </div>
                  <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: '700' }}>🚀 Candidate Nurture Drip</h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '6px 0 10px 0' }}>Monthly job opening alerts for passive talent pool.</p>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>Scheduled</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 4: CONNECTIONS & LOGS */}
          {activeTab === 'connections_sync' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title"><i className="fa-solid fa-globe" style={{ marginRight: '8px' }}></i>Careers Website Job Sync Engine</h2></div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>Request ID</th><th>Skill Description</th><th>Public Careers Page Status</th><th>Inbound Applications</th><th>Actions</th></tr></thead>
                  <tbody>
                    {demands.slice(0, 5).map(d => (
                      <tr key={d.id}>
                        <td className="font-medium" style={{ color: '#2563eb' }}>{d.request_id}</td>
                        <td>{d.skill_description}</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', backgroundColor: '#ecfdf5', color: '#10b981' }}>Published to Website</span></td>
                        <td><span style={{ fontWeight: '700', color: '#0f172a' }}>14 Applications</span></td>
                        <td><button style={{ padding: '4px 10px', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Sync Now</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activity_logs' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><span>Immutable Activity & Audit Log Feed</span><span className="count-badge red-badge">{logs.length}</span></div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Supabase Audit Trail</span>
              </div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>Action</th><th>Entity</th><th>Details</th><th>Performed By</th><th>Timestamp</th></tr></thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td className="font-medium" style={{ color: '#2563eb' }}>{log.action}</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>{log.entity_type.toUpperCase()}</span></td>
                        <td>{log.details}</td>
                        <td className="font-medium">{log.user_name}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PHASE 4: SETTINGS */}
          {activeTab === 'settings_clients' && (
            <>
              <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>Clients Master Management</span>
                <button onClick={() => setShowClientModal(true)} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '600', fontSize: '0.83rem', cursor: 'pointer' }}>+ Add Client Account</button>
              </div>
              <div className="card">
                <div className="card-header"><div className="card-title"><span>Clients List</span><span className="count-badge red-badge">{clients.length}</span></div></div>
                <div className="card-body">
                  <table className="data-table">
                    <thead><tr><th>Client Account Name</th><th>Industry</th><th>Location</th><th>SLA & Account Notes</th></tr></thead>
                    <tbody>
                      {clients.map(c => (
                        <tr key={c.id}>
                          <td className="font-medium">{c.name}</td><td>{c.industry}</td><td>{c.location}</td><td>{c.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'settings_sla' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}><i className="fa-solid fa-flag" style={{ color: '#dc2626', marginRight: '8px' }}></i>30-Day Aging & SLA Rules</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Red Flag Days Threshold</label>
                    <input type="number" value={slaConfig.redFlagDaysThreshold} onChange={(e) => setSlaConfig({ ...slaConfig, redFlagDaysThreshold: parseInt(e.target.value) || 30 })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Intake to Allocation SLA (Days)</label>
                    <input type="number" value={slaConfig.intakeToAllocationSlaDays} onChange={(e) => setSlaConfig({ ...slaConfig, intakeToAllocationSlaDays: parseInt(e.target.value) || 2 })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>TA Submission to Client SLA (Days)</label>
                    <input type="number" value={slaConfig.submissionToClientSlaDays} onChange={(e) => setSlaConfig({ ...slaConfig, submissionToClientSlaDays: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}><i className="fa-solid fa-hashtag" style={{ color: '#2563eb', marginRight: '8px' }}></i>ID & Numbering Schemes</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Current Demand ID Format Syntax:</span>
                    <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#2563eb', margin: '4px 0 0 0' }}>CSF-2026-NNNN</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings_smtp' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-paper-plane" style={{ color: '#2563eb' }}></i> SMTP Mail Delivery Diagnostics
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
                  Test your SMTP connection and live email dispatch. When SMTP credentials are saved in <code>.env.local</code>, emails will be delivered directly to the target inbox.
                </p>

                <form onSubmit={handleTestSmtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. admin@costaff.com"
                      value={smtpTestEmail}
                      onChange={(e) => setSmtpTestEmail(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={smtpTesting}
                    style={{
                      backgroundColor: smtpTesting ? '#94a3b8' : '#2563eb',
                      color: '#ffffff',
                      padding: '10px 18px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: smtpTesting ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {smtpTesting ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i> Dispatching Test Mail...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i> Send Test Email
                      </>
                    )}
                  </button>
                </form>

                {smtpTestResult && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    backgroundColor: smtpTestResult.success ? (smtpTestResult.simulated ? '#fef3c7' : '#f0fdf4') : '#fef2f2',
                    border: `1px solid ${smtpTestResult.success ? (smtpTestResult.simulated ? '#fde68a' : '#bbf7d0') : '#fca5a5'}`,
                    color: smtpTestResult.success ? (smtpTestResult.simulated ? '#92400e' : '#166534') : '#991b1b'
                  }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {smtpTestResult.success ? (
                        smtpTestResult.simulated ? (
                          <><i className="fa-solid fa-triangle-exclamation"></i> Simulated Mode Active</>
                        ) : (
                          <><i className="fa-solid fa-circle-check"></i> SMTP Test Successful!</>
                        )
                      ) : (
                        <><i className="fa-solid fa-circle-xmark"></i> SMTP Connection Error</>
                      )}
                    </div>
                    <div>{smtpTestResult.message}</div>
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-gears" style={{ color: '#64748b' }}></i> SMTP Environment Variables Setup
                </h2>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px', lineHeight: '1.4' }}>
                  To switch from <strong>Simulated Console Mode</strong> to <strong>Live Mail Delivery</strong>, add the following variables into <code>.env.local</code> in your project root:
                </p>

                <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: '14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: '1.6' }}>
                  <div style={{ color: '#64748b' }}># SMTP Mail Engine Configuration</div>
                  <div>SMTP_HOST=<span style={{ color: '#38bdf8' }}>smtp.gmail.com</span></div>
                  <div>SMTP_PORT=<span style={{ color: '#f59e0b' }}>587</span></div>
                  <div>SMTP_USER=<span style={{ color: '#4ade80' }}>your-email@gmail.com</span></div>
                  <div>SMTP_PASS=<span style={{ color: '#f43f5e' }}>your-app-password</span></div>
                  <div>SMTP_FROM=<span style={{ color: '#cbd5e1' }}>"Costaff ATS" &lt;your-email@gmail.com&gt;</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'today_activity' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Today's Activity Audit Stream</h2></div>
              <div className="card-body">
                <table className="data-table">
                  <thead><tr><th>Action</th><th>Entity</th><th>Details</th><th>Performed By</th><th>Timestamp</th></tr></thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td className="font-medium">{log.action}</td>
                        <td><span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: '#eff6ff', color: '#2563eb' }}>{log.entity_type.toUpperCase()}</span></td>
                        <td>{log.details}</td>
                        <td>{log.user_name}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODALS */}
      {showDemandModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', width: '640px', maxHeight: '90vh', overflow: 'auto', borderRadius: '10px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Log New Demand</h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Enter structured client requirement details</span>
              </div>
              <button onClick={() => setShowDemandModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>×</button>
            </div>
            <form onSubmit={handleCreateDemand} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Internal Request ID</label>
                  <input type="text" placeholder="Auto-generated if blank (e.g. CSF-2026-0007)" value={demandForm.request_id} onChange={(e) => setDemandForm({ ...demandForm, request_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>External VMS / Requisition ID</label>
                  <input type="text" placeholder="e.g. VMS-88392" value={demandForm.external_requisition_id} onChange={(e) => setDemandForm({ ...demandForm, external_requisition_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Client Name</label>
                  <input type="text" placeholder="e.g. Costaff Key Account A" value={demandForm.client_name} onChange={(e) => setDemandForm({ ...demandForm, client_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Assigned AM & Email (for Auto-Alert)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <input type="text" placeholder="AM Name (e.g. Neha)" value={demandForm.am_name} onChange={(e) => setDemandForm({ ...demandForm, am_name: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }} />
                    <input type="email" placeholder="AM Email (neha@costaff.com)" value={demandForm.am_email} onChange={(e) => setDemandForm({ ...demandForm, am_email: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Skill Description / Role Title *</label>
                <input type="text" required placeholder="e.g. Senior Fullstack React / Java Developer" value={demandForm.skill_description} onChange={(e) => setDemandForm({ ...demandForm, skill_description: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Role Category</label>
                  <select value={demandForm.role_category} onChange={(e) => setDemandForm({ ...demandForm, role_category: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="SOW">SOW</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Priority</label>
                  <select value={demandForm.priority} onChange={(e) => setDemandForm({ ...demandForm, priority: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Status</label>
                  <select value={demandForm.status} onChange={(e) => setDemandForm({ ...demandForm, status: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Min Budget (LPA)</label>
                  <input type="number" placeholder="10" value={demandForm.budget_min} onChange={(e) => setDemandForm({ ...demandForm, budget_min: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Max Budget (LPA)</label>
                  <input type="number" placeholder="18" value={demandForm.budget_max} onChange={(e) => setDemandForm({ ...demandForm, budget_max: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Positions</label>
                  <input type="number" min="1" value={demandForm.num_positions} onChange={(e) => setDemandForm({ ...demandForm, num_positions: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Experience Level</label>
                  <input type="text" placeholder="e.g. 5-8 Years" value={demandForm.experience_level} onChange={(e) => setDemandForm({ ...demandForm, experience_level: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Locations</label>
                  <input type="text" placeholder="e.g. Bangalore, Hyderabad" value={demandForm.locations} onChange={(e) => setDemandForm({ ...demandForm, locations: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Notes / Special Instructions</label>
                <textarea rows={2} placeholder="Add any client specifications or contract notes..." value={demandForm.notes} onChange={(e) => setDemandForm({ ...demandForm, notes: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowDemandModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Save Demand</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCandidateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', width: '580px', maxHeight: '90vh', overflow: 'auto', borderRadius: '10px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Add New Candidate Profile</h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Automatic email & phone deduplication enabled</span>
              </div>
              <button onClick={() => setShowCandidateModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>×</button>
            </div>
            {candidateDedupeError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', marginBottom: '16px', border: '1px solid #fca5a5' }}>
                {candidateDedupeError}
              </div>
            )}
            <form onSubmit={handleCreateCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Candidate Full Name *</label>
                <input type="text" required placeholder="e.g. Ankit Verma" value={candidateForm.full_name} onChange={(e) => setCandidateForm({ ...candidateForm, full_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Phone Number *</label>
                  <input type="text" required placeholder="e.g. +91 9876543210" value={candidateForm.phone} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Email Address *</label>
                  <input type="email" required placeholder="e.g. ankit@gmail.com" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Current Company</label>
                  <input type="text" placeholder="e.g. TCS / Infosys" value={candidateForm.current_company} onChange={(e) => setCandidateForm({ ...candidateForm, current_company: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Current Location</label>
                  <input type="text" placeholder="e.g. Bangalore" value={candidateForm.current_location} onChange={(e) => setCandidateForm({ ...candidateForm, current_location: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Current CTC</label>
                  <input type="number" placeholder="12 LPA" value={candidateForm.current_ctc} onChange={(e) => setCandidateForm({ ...candidateForm, current_ctc: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Expected CTC</label>
                  <input type="number" placeholder="16 LPA" value={candidateForm.expected_ctc} onChange={(e) => setCandidateForm({ ...candidateForm, expected_ctc: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Total Exp (Yrs)</label>
                  <input type="number" placeholder="6" value={candidateForm.total_experience} onChange={(e) => setCandidateForm({ ...candidateForm, total_experience: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Notice Period</label>
                  <select value={candidateForm.notice_period} onChange={(e) => setCandidateForm({ ...candidateForm, notice_period: e.target.value })} style={{ width: '100%', padding: '8px 6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <option value="Immediate">Immediate</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Key Skills</label>
                  <input type="text" placeholder="e.g. React, Java, Spring Boot, Microservices" value={candidateForm.skills} onChange={(e) => setCandidateForm({ ...candidateForm, skills: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Source Portal</label>
                  <select value={candidateForm.source} onChange={(e) => setCandidateForm({ ...candidateForm, source: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="naukri">Naukri</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="direct">Direct Portal</option>
                    <option value="referral">Referral</option>
                    <option value="others">Others</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCandidateModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Save Candidate Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInterviewModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', width: '580px', maxHeight: '90vh', overflow: 'auto', borderRadius: '10px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Schedule New Interview</h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Link interview slot dynamically to candidate & demand</span>
              </div>
              <button onClick={() => setShowInterviewModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>×</button>
            </div>
            <form onSubmit={handleCreateInterview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Select / Write Request ID *</label>
                  <input
                    type="text" required placeholder="e.g. CSF-2026-0001"
                    list="demands-list"
                    value={interviewForm.demand_request_id}
                    onChange={(e) => setInterviewForm({ ...interviewForm, demand_request_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                  <datalist id="demands-list">
                    {demands.map(d => (
                      <option key={d.id} value={d.request_id}>{d.request_id} — {d.skill_description}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Select / Write Candidate Name *</label>
                  <input
                    type="text" required placeholder="e.g. Ankit Verma"
                    list="candidates-list"
                    value={interviewForm.candidate_name}
                    onChange={(e) => setInterviewForm({ ...interviewForm, candidate_name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}
                  />
                  <datalist id="candidates-list">
                    {candidates.map(c => (
                      <option key={c.id} value={c.full_name}>{c.full_name} ({c.email})</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Interviewer Name / SPOC *</label>
                  <input type="text" required placeholder="e.g. SPOC / Neha Sharma" value={interviewForm.interviewer_name} onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Skill Being Tested *</label>
                  <input type="text" required placeholder="e.g. Core Java / System Design" value={interviewForm.skill_tested} onChange={(e) => setInterviewForm({ ...interviewForm, skill_tested: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Candidate Email (for Auto-Invite)</label>
                  <input type="email" placeholder="e.g. candidate@email.com" value={interviewForm.candidate_email} onChange={(e) => setInterviewForm({ ...interviewForm, candidate_email: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>AM Email (for Auto-Alert)</label>
                  <input type="email" placeholder="e.g. am@costaff.com" value={interviewForm.am_email} onChange={(e) => setInterviewForm({ ...interviewForm, am_email: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Interview Level</label>
                  <select value={interviewForm.level} onChange={(e) => setInterviewForm({ ...interviewForm, level: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                    <option value="L4">L4</option>
                    <option value="Final">Final</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Interview Mode</label>
                  <select value={interviewForm.mode} onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="Video">Video</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Phone">Phone</option>
                    <option value="Test">Test</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Status</label>
                  <select value={interviewForm.status} onChange={(e) => setInterviewForm({ ...interviewForm, status: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Candidate No-Show">Candidate No-Show</option>
                    <option value="Client No-Show">Client No-Show</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Scheduled Date *</label>
                  <input type="date" required value={interviewForm.scheduled_date} onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_date: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Scheduled Time *</label>
                  <input type="time" required value={interviewForm.scheduled_time} onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_time: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Link Status</label>
                  <select value={interviewForm.link_status} onChange={(e) => setInterviewForm({ ...interviewForm, link_status: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="Client_Shared">Client_Shared</option>
                    <option value="Link_Sent">Link_Sent</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Meeting Link / Video Call URL</label>
                  <input type="url" placeholder="https://teams.microsoft.com/l/meetup-join/..." value={interviewForm.meeting_link} onChange={(e) => setInterviewForm({ ...interviewForm, meeting_link: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowInterviewModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Schedule Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditDemandModal && editingDemand && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: '#fff', width: '640px', maxHeight: '90vh', overflow: 'auto', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>Edit Demand — {editingDemand.request_id}</h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Update requirement details, status, priority, and allocation</span>
              </div>
              <button onClick={() => { setShowEditDemandModal(false); setEditingDemand(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#64748b' }}>×</button>
            </div>
            <form onSubmit={handleUpdateDemand} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Internal Request ID</label>
                  <input type="text" value={demandForm.request_id} onChange={(e) => setDemandForm({ ...demandForm, request_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>External VMS ID</label>
                  <input type="text" value={demandForm.external_requisition_id} onChange={(e) => setDemandForm({ ...demandForm, external_requisition_id: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Client Name</label>
                  <input type="text" value={demandForm.client_name} onChange={(e) => setDemandForm({ ...demandForm, client_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Assigned AM</label>
                  <input type="text" value={demandForm.am_name} onChange={(e) => setDemandForm({ ...demandForm, am_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Skill Description / Role Title *</label>
                <input type="text" required value={demandForm.skill_description} onChange={(e) => setDemandForm({ ...demandForm, skill_description: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Role Category</label>
                  <select value={demandForm.role_category} onChange={(e) => setDemandForm({ ...demandForm, role_category: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="SOW">SOW</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Priority</label>
                  <select value={demandForm.priority} onChange={(e) => setDemandForm({ ...demandForm, priority: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Status</label>
                  <select value={demandForm.status} onChange={(e) => setDemandForm({ ...demandForm, status: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Min Budget (LPA)</label>
                  <input type="number" value={demandForm.budget_min} onChange={(e) => setDemandForm({ ...demandForm, budget_min: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Max Budget (LPA)</label>
                  <input type="number" value={demandForm.budget_max} onChange={(e) => setDemandForm({ ...demandForm, budget_max: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Positions</label>
                  <input type="number" min="1" value={demandForm.num_positions} onChange={(e) => setDemandForm({ ...demandForm, num_positions: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Notes / Special Instructions</label>
                <textarea rows={2} value={demandForm.notes} onChange={(e) => setDemandForm({ ...demandForm, notes: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowEditDemandModal(false); setEditingDemand(null); }} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditCandidateModal && editingCandidate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: '#fff', width: '600px', maxHeight: '90vh', overflow: 'auto', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>Update Candidate — {editingCandidate.full_name}</h2>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Update pipeline stage tag and candidate profile</span>
              </div>
              <button onClick={() => { setShowEditCandidateModal(false); setEditingCandidate(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#64748b' }}>×</button>
            </div>

            <form onSubmit={handleUpdateCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#1e40af', marginBottom: '6px' }}>Current Pipeline Stage Tag (27 Stages)</label>
                <select value={editCandidateStage} onChange={(e) => setEditCandidateStage(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1px solid #93c5fd', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#1e3a8a', backgroundColor: '#fff' }}>
                  <option value="Sourced">Sourced</option>
                  <option value="Submitted to AM">Submitted to AM</option>
                  <option value="Submitted to Client">Submitted to Client</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="L1 Interview Scheduled">L1 Interview Scheduled</option>
                  <option value="L1 Interview Cleared">L1 Interview Cleared</option>
                  <option value="L2 Interview Scheduled">L2 Interview Scheduled</option>
                  <option value="L2 Interview Cleared">L2 Interview Cleared</option>
                  <option value="Client Selected">Client Selected</option>
                  <option value="Offer Released">Offer Released</option>
                  <option value="Offer Accepted">Offer Accepted</option>
                  <option value="BGV In Progress">BGV In Progress</option>
                  <option value="Joined">Joined</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Candidate Backout">Candidate Backout</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                <input type="text" required value={candidateForm.full_name} onChange={(e) => setCandidateForm({ ...candidateForm, full_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Phone Number *</label>
                  <input type="text" required value={candidateForm.phone} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Email Address *</label>
                  <input type="email" required value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Current Company</label>
                  <input type="text" value={candidateForm.current_company} onChange={(e) => setCandidateForm({ ...candidateForm, current_company: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Current Location</label>
                  <input type="text" value={candidateForm.current_location} onChange={(e) => setCandidateForm({ ...candidateForm, current_location: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Current CTC (LPA)</label>
                  <input type="number" value={candidateForm.current_ctc} onChange={(e) => setCandidateForm({ ...candidateForm, current_ctc: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Expected CTC (LPA)</label>
                  <input type="number" value={candidateForm.expected_ctc} onChange={(e) => setCandidateForm({ ...candidateForm, expected_ctc: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => { setShowEditCandidateModal(false); setEditingCandidate(null); }} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Save Candidate Updates</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInterview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: '#fff', width: '520px', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interview Slot Details</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>{selectedInterview.candidate_name || 'Candidate Interview'}</h2>
              </div>
              <button onClick={() => setSelectedInterview(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.84rem' }}>
                <div><span style={{ color: '#64748b' }}>Request ID:</span> <strong style={{ color: '#2563eb' }}>{selectedInterview.demand_request_id || 'CSF-2026-0001'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Level / Round:</span> <strong>{selectedInterview.level}</strong></div>
                <div><span style={{ color: '#64748b' }}>Skill Tested:</span> <strong>{selectedInterview.skill_tested}</strong></div>
                <div><span style={{ color: '#64748b' }}>Interviewer:</span> <strong>{selectedInterview.interviewer_name}</strong></div>
                <div><span style={{ color: '#64748b' }}>Mode:</span> <strong>{selectedInterview.mode}</strong></div>
                <div><span style={{ color: '#64748b' }}>Date & Time:</span> <strong>{selectedInterview.scheduled_date} at {selectedInterview.scheduled_time}</strong></div>
              </div>

              {selectedInterview.meeting_link && (
                <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <a href={selectedInterview.meeting_link} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563eb', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', textDecoration: 'none' }}>
                    <i className="fa-solid fa-video"></i> Join Video Interview Call
                  </a>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Update Interview Status:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={() => handleUpdateInterviewStatus(selectedInterview.id, 'Completed')} style={{ padding: '8px 12px', border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#059669', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  🟢 Mark Completed
                </button>
                <button onClick={() => handleUpdateInterviewStatus(selectedInterview.id, 'Scheduled')} style={{ padding: '8px 12px', border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  🔵 Mark Scheduled
                </button>
                <button onClick={() => handleUpdateInterviewStatus(selectedInterview.id, 'Candidate No-Show')} style={{ padding: '8px 12px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  🔴 Candidate No-Show
                </button>
                <button onClick={() => handleUpdateInterviewStatus(selectedInterview.id, 'Client No-Show')} style={{ padding: '8px 12px', border: '1px solid #fde68a', background: '#fffbeb', color: '#d97706', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  🟡 Client No-Show
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', width: '450px', borderRadius: '10px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Add System User</h2>
              <button onClick={() => setShowUserModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>×</button>
            </div>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Full Name *</label>
                <input type="text" required placeholder="e.g. Ramesh Kumar" value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowUserModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Create Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClientModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', width: '450px', borderRadius: '10px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Add Client Account</h2>
              <button onClick={() => setShowClientModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>×</button>
            </div>
            <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Client Account Name *</label>
                <input type="text" required placeholder="e.g. Acme Tech Solutions" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Industry</label>
                  <input type="text" placeholder="e.g. IT Services" value={clientForm.industry} onChange={(e) => setClientForm({ ...clientForm, industry: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Location</label>
                  <input type="text" placeholder="e.g. Bangalore" value={clientForm.location} onChange={(e) => setClientForm({ ...clientForm, location: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowClientModal(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQ LIFECYCLE & CANDIDATE HISTORY DRAWER */}
      {lifecycleDrawer.open && (
        <div
          onClick={() => setLifecycleDrawer({ ...lifecycleDrawer, open: false })}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 2000, backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '560px', maxWidth: '90vw', height: '100%', backgroundColor: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', backgroundColor: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: '#38bdf8' }}></i>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>Req Lifecycle & Candidate History</h2>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Request ID: <span style={{ color: '#38bdf8', fontWeight: '700' }}>{lifecycleDrawer.requestId}</span></div>
              </div>
              <button
                onClick={() => setLifecycleDrawer({ ...lifecycleDrawer, open: false })}
                style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {lifecycleDrawer.loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '12px', color: '#2563eb' }}></i>
                  <p style={{ fontWeight: '600' }}>Fetching Requirement Lifecycle History...</p>
                </div>
              ) : !lifecycleDrawer.data?.demand ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                  <p>Could not load lifecycle for Request ID {lifecycleDrawer.requestId}</p>
                </div>
              ) : (
                <>
                  {/* Step 1: Requirement Summary Card */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb' }}>1. Requirement Overview</span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: lifecycleDrawer.data.demand.status === 'Open' ? '#dcfce7' : '#f1f5f9', color: lifecycleDrawer.data.demand.status === 'Open' ? '#166534' : '#475569' }}>
                        {lifecycleDrawer.data.demand.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>{lifecycleDrawer.data.demand.skill_description}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: '#475569', marginTop: '10px' }}>
                      <div><strong>Client:</strong> {lifecycleDrawer.data.demand.client_name || 'Costaff Client'}</div>
                      <div><strong>Account Manager:</strong> {lifecycleDrawer.data.demand.am_name || 'Unassigned'}</div>
                      <div><strong>Role Category:</strong> {lifecycleDrawer.data.demand.role_category || 'Permanent'}</div>
                      <div><strong>Priority:</strong> <span className={`priority-tag ${lifecycleDrawer.data.demand.priority === 'High' ? 'high' : ''}`}>{lifecycleDrawer.data.demand.priority}</span></div>
                      <div><strong>Days Open:</strong> {lifecycleDrawer.data.demand.days_open || 0} Days</div>
                      <div><strong>Experience:</strong> {lifecycleDrawer.data.demand.experience_level || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Step 2: Interviews & Candidates Submitted */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c3aed' }}>
                        2. Interview Rounds & Candidates ({lifecycleDrawer.data.interviews?.length || 0})
                      </span>
                    </div>

                    {!lifecycleDrawer.data.interviews || lifecycleDrawer.data.interviews.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No interview rounds logged yet for this mandate.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {lifecycleDrawer.data.interviews.map((iv: any, idx: number) => {
                          const st = getInterviewStatusStyle(iv.status);
                          return (
                            <div key={idx} style={{ padding: '10px 12px', borderLeft: `4px solid ${st.dot}`, backgroundColor: st.bg, borderRadius: '0 8px 8px 0', fontSize: '0.82rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: st.text }}>
                                <span>{iv.level} • {iv.candidate_name || 'Candidate'}</span>
                                <span>{st.label}</span>
                              </div>
                              <div style={{ marginTop: '4px', color: '#475569', fontSize: '0.78rem' }}>
                                <span><strong>Interviewer:</strong> {iv.interviewer_name}</span> | <span><strong>Skill:</strong> {iv.skill_tested}</span>
                              </div>
                              <div style={{ marginTop: '2px', color: '#64748b', fontSize: '0.75rem' }}>
                                <i className="fa-regular fa-calendar" style={{ marginRight: '4px' }}></i>{iv.scheduled_date} at {iv.scheduled_time} ({iv.mode})
                              </div>
                              {iv.feedback && (
                                <div style={{ marginTop: '6px', fontStyle: 'italic', background: '#fff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155' }}>
                                  <i className="fa-regular fa-comment" style={{ marginRight: '4px' }}></i>{iv.feedback}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 3: Offers Issued */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669' }}>
                        3. Offers ({lifecycleDrawer.data.offers?.length || 0})
                      </span>
                    </div>

                    {!lifecycleDrawer.data.offers || lifecycleDrawer.data.offers.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No offers issued for this demand yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lifecycleDrawer.data.offers.map((off: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px 12px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#166534' }}>
                              <span>Candidate: {off.candidates?.full_name || 'Candidate'}</span>
                              <span>Status: {off.status}</span>
                            </div>
                            <div style={{ marginTop: '4px', color: '#15803d', fontSize: '0.78rem' }}>
                              Offered CTC: <strong>₹{off.offered_ctc} LPA</strong> | Offer Date: {off.offer_date}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Step 4: Onboarding Status */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7' }}>
                        4. Onboarding & BGV ({lifecycleDrawer.data.onboardings?.length || 0})
                      </span>
                    </div>

                    {!lifecycleDrawer.data.onboardings || lifecycleDrawer.data.onboardings.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No onboarding record for this requirement yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lifecycleDrawer.data.onboardings.map((ob: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px 12px', border: '1px solid #bae6fd', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#0369a1' }}>
                              <span>Candidate: {ob.candidates?.full_name || 'Candidate'}</span>
                              <span>BGV: {ob.bgv_status?.toUpperCase()}</span>
                            </div>
                            <div style={{ marginTop: '4px', color: '#0284c7', fontSize: '0.78rem' }}>
                              Joining Date: <strong>{ob.actual_joining_date || 'TBD'}</strong> | Status: {ob.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setLifecycleDrawer({ ...lifecycleDrawer, open: false })}
                style={{ padding: '8px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE 360 PROFILE & APPLICATION HISTORY DRAWER */}
      {candidateDrawer.open && (
        <div
          onClick={() => setCandidateDrawer({ ...candidateDrawer, open: false })}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 2000, backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '560px', maxWidth: '90vw', height: '100%', backgroundColor: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', backgroundColor: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-user-gear" style={{ color: '#38bdf8' }}></i>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>Candidate 360 Profile & History</h2>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Candidate: <span style={{ color: '#38bdf8', fontWeight: '700' }}>{candidateDrawer.data?.candidate?.full_name || 'Loading...'}</span>
                </div>
              </div>
              <button
                onClick={() => setCandidateDrawer({ ...candidateDrawer, open: false })}
                style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {candidateDrawer.loading ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '12px', color: '#2563eb' }}></i>
                  <p style={{ fontWeight: '600' }}>Fetching Candidate Profile & Application History...</p>
                </div>
              ) : !candidateDrawer.data?.candidate ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', marginBottom: '10px' }}></i>
                  <p>Could not load candidate profile details.</p>
                </div>
              ) : (
                <>
                  {/* Step 1: Candidate Personal & Contact Information Card */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-address-card"></i> Candidate Contact & Professional Details
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: '#eff6ff', color: '#2563eb' }}>
                        {candidateDrawer.data.candidate.source || 'Naukri'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                      {candidateDrawer.data.candidate.full_name}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem', color: '#334155' }}>
                      <div><i className="fa-solid fa-phone" style={{ color: '#64748b', width: '16px' }}></i> <strong>Phone:</strong> {candidateDrawer.data.candidate.phone || '—'}</div>
                      <div><i className="fa-regular fa-envelope" style={{ color: '#64748b', width: '16px' }}></i> <strong>Email:</strong> {candidateDrawer.data.candidate.email || '—'}</div>
                      <div><i className="fa-solid fa-building" style={{ color: '#64748b', width: '16px' }}></i> <strong>Current Company:</strong> {candidateDrawer.data.candidate.current_company || '—'}</div>
                      <div><i className="fa-solid fa-location-dot" style={{ color: '#64748b', width: '16px' }}></i> <strong>Location:</strong> {candidateDrawer.data.candidate.current_location || '—'}</div>
                      <div><i className="fa-solid fa-indian-rupee-sign" style={{ color: '#64748b', width: '16px' }}></i> <strong>Current CTC:</strong> {candidateDrawer.data.candidate.current_ctc ? `₹${candidateDrawer.data.candidate.current_ctc} LPA` : '—'}</div>
                      <div><i className="fa-solid fa-bullseye" style={{ color: '#64748b', width: '16px' }}></i> <strong>Expected CTC:</strong> {candidateDrawer.data.candidate.expected_ctc ? `₹${candidateDrawer.data.candidate.expected_ctc} LPA` : '—'}</div>
                      <div><i className="fa-solid fa-hourglass-half" style={{ color: '#64748b', width: '16px' }}></i> <strong>Notice Period:</strong> {candidateDrawer.data.candidate.notice_period || 'Immediate'}</div>
                      <div><i className="fa-regular fa-calendar-check" style={{ color: '#64748b', width: '16px' }}></i> <strong>Added Date:</strong> {candidateDrawer.data.candidate.created_at ? new Date(candidateDrawer.data.candidate.created_at).toLocaleDateString() : 'Recent'}</div>
                    </div>

                    {/* BELONGING REQUEST ID(S) BADGE */}
                    <div style={{ marginTop: '14px', padding: '10px 12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e40af' }}>
                        <i className="fa-solid fa-file-signature" style={{ marginRight: '6px' }}></i>Belonging Request ID(s):
                      </span>
                      {candidateDrawer.data.linkedRequestIds && candidateDrawer.data.linkedRequestIds.length > 0 ? (
                        candidateDrawer.data.linkedRequestIds.map((reqId: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCandidateDrawer({ ...candidateDrawer, open: false });
                              openLifecycle(reqId);
                            }}
                            title="Click to view full Requirement Lifecycle"
                            style={{ padding: '3px 10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '0.7rem' }}></i> {reqId}
                          </button>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>Unmapped / General Candidate Pool</span>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Mapped Demands & Interview History */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-list-check"></i> Mapped Requirements & Interview Rounds ({candidateDrawer.data.interviews?.length || 0})
                      </span>
                    </div>

                    {!candidateDrawer.data.interviews || candidateDrawer.data.interviews.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No interview rounds or mandate mappings recorded for this candidate yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {candidateDrawer.data.interviews.map((iv: any, idx: number) => {
                          const st = getInterviewStatusStyle(iv.status);
                          return (
                            <div key={idx} style={{ padding: '10px 12px', borderLeft: `4px solid ${st.dot}`, backgroundColor: st.bg, borderRadius: '0 8px 8px 0', fontSize: '0.82rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: st.text }}>
                                <span>
                                  <button
                                    onClick={() => {
                                      setCandidateDrawer({ ...candidateDrawer, open: false });
                                      openLifecycle(iv.demand_request_id);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', padding: 0 }}
                                  >
                                    {iv.demand_request_id}
                                  </button> — {iv.level} Round
                                </span>
                                <span>{st.label}</span>
                              </div>
                              <div style={{ marginTop: '4px', color: '#475569', fontSize: '0.78rem' }}>
                                <span><strong>Interviewer:</strong> {iv.interviewer_name}</span> | <span><strong>Skill:</strong> {iv.skill_tested}</span>
                              </div>
                              <div style={{ marginTop: '2px', color: '#64748b', fontSize: '0.75rem' }}>
                                <i className="fa-regular fa-calendar" style={{ marginRight: '4px' }}></i>{iv.scheduled_date} at {iv.scheduled_time} ({iv.mode})
                              </div>
                              {iv.feedback && (
                                <div style={{ marginTop: '6px', fontStyle: 'italic', background: '#fff', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155' }}>
                                  <i className="fa-regular fa-comment" style={{ marginRight: '4px' }}></i>Feedback: {iv.feedback}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 3: Candidate Offers History */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-gift"></i> Offer History ({candidateDrawer.data.offers?.length || 0})
                      </span>
                    </div>

                    {!candidateDrawer.data.offers || candidateDrawer.data.offers.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No offers issued to this candidate yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {candidateDrawer.data.offers.map((off: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px 12px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#166534' }}>
                              <span>Req ID: {off.demands?.request_id || 'Requirement'}</span>
                              <span>Status: {off.status}</span>
                            </div>
                            <div style={{ marginTop: '4px', color: '#15803d', fontSize: '0.78rem' }}>
                              Offered CTC: <strong>₹{off.offered_ctc} LPA</strong> | Offer Date: {off.offer_date}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Step 4: Candidate Onboarding History */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-user-check"></i> Onboarding & BGV Verification ({candidateDrawer.data.onboardings?.length || 0})
                      </span>
                    </div>

                    {!candidateDrawer.data.onboardings || candidateDrawer.data.onboardings.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No onboarding or BGV record logged for this candidate yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {candidateDrawer.data.onboardings.map((ob: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px 12px', border: '1px solid #bae6fd', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#0369a1' }}>
                              <span>Req ID: {ob.demands?.request_id || 'Requirement'}</span>
                              <span>BGV: {ob.bgv_status?.toUpperCase()}</span>
                            </div>
                            <div style={{ marginTop: '4px', color: '#0284c7', fontSize: '0.78rem' }}>
                              Joining Date: <strong>{ob.actual_joining_date || 'TBD'}</strong> | Status: {ob.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setCandidateDrawer({ ...candidateDrawer, open: false })}
                style={{ padding: '8px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Close Candidate Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ LIFECYCLE DRAWER ═══════════════ */}
      {lifecycleDrawer.open && (
        <div
          onClick={() => setLifecycleDrawer({ ...lifecycleDrawer, open: false })}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.55)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(3px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '540px', maxWidth: '95vw', height: '100vh', backgroundColor: '#fff', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflowY: 'auto', animation: 'slideInRight 0.3s ease-out' }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 2 }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Requirement Lifecycle</span>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: '2px 0 0' }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: '#2563eb', marginRight: '8px' }}></i>
                  {lifecycleDrawer.requestId}
                </h2>
              </div>
              <button
                onClick={() => setLifecycleDrawer({ ...lifecycleDrawer, open: false })}
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '1rem', fontWeight: '700', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                X
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
              {lifecycleDrawer.loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
                  <p style={{ fontSize: '0.9rem' }}>Loading lifecycle data...</p>
                </div>
              ) : !lifecycleDrawer.data ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
                  <p style={{ fontSize: '0.9rem' }}>Failed to load lifecycle data for this requirement.</p>
                </div>
              ) : (
                <>
                  {/* ── SECTION 1: DEMAND DETAILS ── */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-file-lines"></i> Demand Details
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: lifecycleDrawer.data.demand?.status === 'Open' ? '#dcfce7' : '#f1f5f9', color: lifecycleDrawer.data.demand?.status === 'Open' ? '#16a34a' : '#64748b' }}>
                        {lifecycleDrawer.data.demand?.status || 'Unknown'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
                      <div><strong>Client:</strong> {lifecycleDrawer.data.demand?.client_name || '---'}</div>
                      <div><strong>AM:</strong> {lifecycleDrawer.data.demand?.am_name || '---'}</div>
                      <div><strong>Skill:</strong> {lifecycleDrawer.data.demand?.skill_description || '---'}</div>
                      <div><strong>Priority:</strong> <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: lifecycleDrawer.data.demand?.priority === 'High' ? '#fef2f2' : '#f1f5f9', color: lifecycleDrawer.data.demand?.priority === 'High' ? '#dc2626' : '#64748b' }}>{lifecycleDrawer.data.demand?.priority || '---'}</span></div>
                      <div><strong>Type:</strong> {lifecycleDrawer.data.demand?.role_category || 'Permanent'}</div>
                      <div><strong>Days Open:</strong> {lifecycleDrawer.data.demand?.days_open ?? '---'}</div>
                      <div><strong>Positions:</strong> {lifecycleDrawer.data.demand?.num_positions || 1}</div>
                      <div><strong>Experience:</strong> {lifecycleDrawer.data.demand?.experience_level || '---'}</div>
                      {lifecycleDrawer.data.demand?.budget_min && (
                        <div><strong>Budget:</strong> {lifecycleDrawer.data.demand?.budget_min} - {lifecycleDrawer.data.demand?.budget_max} LPA</div>
                      )}
                      {lifecycleDrawer.data.demand?.locations && lifecycleDrawer.data.demand.locations.length > 0 && (
                        <div><strong>Locations:</strong> {Array.isArray(lifecycleDrawer.data.demand.locations) ? lifecycleDrawer.data.demand.locations.join(', ') : lifecycleDrawer.data.demand.locations}</div>
                      )}
                    </div>
                    {lifecycleDrawer.data.demand?.notes && (
                      <div style={{ marginTop: '10px', padding: '8px 10px', backgroundColor: '#e0f2fe', borderRadius: '6px', fontSize: '0.8rem', color: '#0369a1' }}>
                        <strong>Notes:</strong> {lifecycleDrawer.data.demand.notes}
                      </div>
                    )}
                  </div>

                  {/* ── SECTION 2: INTERVIEWS TIMELINE ── */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-comments"></i> Interviews
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: '#ede9fe', color: '#6d28d9' }}>
                        {lifecycleDrawer.data.interviews?.length || 0} Round(s)
                      </span>
                    </div>

                    {!lifecycleDrawer.data.interviews || lifecycleDrawer.data.interviews.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No interviews scheduled for this requirement yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lifecycleDrawer.data.interviews.map((iv: any, idx: number) => {
                          const statusColor = iv.status === 'Completed' ? '#16a34a' : iv.status === 'Scheduled' ? '#2563eb' : iv.status?.includes('No-Show') ? '#dc2626' : '#64748b';
                          return (
                            <div key={idx} style={{ padding: '10px 12px', border: '1px solid #e9d5ff', backgroundColor: '#fefbff', borderRadius: '8px', fontSize: '0.82rem', position: 'relative', borderLeft: `4px solid ${statusColor}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#5b21b6' }}>
                                <span>[{iv.level}] {iv.candidate_name || 'Candidate'}</span>
                                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: statusColor + '15', color: statusColor }}>{iv.status}</span>
                              </div>
                              <div style={{ marginTop: '4px', color: '#7c3aed', fontSize: '0.78rem' }}>
                                Date: <strong>{iv.scheduled_date || '---'}</strong> | Time: {iv.scheduled_time || '---'} | Mode: {iv.mode || '---'}
                              </div>
                              <div style={{ marginTop: '2px', color: '#7c3aed', fontSize: '0.78rem' }}>
                                Interviewer: {iv.interviewer_name || '---'} | Skill: {iv.skill_tested || '---'}
                              </div>
                              {iv.feedback && (
                                <div style={{ marginTop: '6px', padding: '6px 8px', backgroundColor: '#ede9fe', borderRadius: '4px', fontSize: '0.78rem', color: '#5b21b6' }}>
                                  <strong>Feedback:</strong> {iv.feedback}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── SECTION 3: OFFERS ── */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-handshake"></i> Offers
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: '#fef3c7', color: '#b45309' }}>
                        {lifecycleDrawer.data.offers?.length || 0} Offer(s)
                      </span>
                    </div>

                    {!lifecycleDrawer.data.offers || lifecycleDrawer.data.offers.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No offers extended for this requirement yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lifecycleDrawer.data.offers.map((off: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px 12px', border: '1px solid #fde68a', backgroundColor: '#fffef5', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#92400e' }}>
                              <span>{off.candidates?.full_name || 'Candidate'}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: off.status === 'Accepted' ? '#dcfce7' : off.status === 'Rejected' ? '#fee2e2' : '#fef3c7', color: off.status === 'Accepted' ? '#16a34a' : off.status === 'Rejected' ? '#dc2626' : '#b45309' }}>{off.status}</span>
                            </div>
                            <div style={{ marginTop: '4px', color: '#b45309', fontSize: '0.78rem' }}>
                              CTC: <strong>{off.offered_ctc ? `${off.offered_ctc} LPA` : '---'}</strong> | Offer Date: <strong>{off.offer_date || '---'}</strong>
                            </div>
                            {off.notes && (
                              <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#92400e' }}>Notes: {off.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── SECTION 4: ONBOARDING ── */}
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-flag-checkered"></i> Onboarding
                      </span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: '#d1fae5', color: '#047857' }}>
                        {lifecycleDrawer.data.onboardings?.length || 0} Record(s)
                      </span>
                    </div>

                    {!lifecycleDrawer.data.onboardings || lifecycleDrawer.data.onboardings.length === 0 ? (
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>No onboarding records for this requirement yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lifecycleDrawer.data.onboardings.map((ob: any, idx: number) => (
                          <div key={idx} style={{ padding: '10px 12px', border: '1px solid #a7f3d0', backgroundColor: '#f0fdf9', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#065f46' }}>
                              <span>{ob.candidates?.full_name || 'Candidate'}</span>
                              <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', backgroundColor: ob.status === 'Joined' ? '#dcfce7' : '#fef3c7', color: ob.status === 'Joined' ? '#16a34a' : '#b45309' }}>{ob.status}</span>
                            </div>
                            <div style={{ marginTop: '4px', color: '#047857', fontSize: '0.78rem' }}>
                              BGV: <strong>{ob.bgv_status?.toUpperCase() || '---'}</strong> | Joining Date: <strong>{ob.actual_joining_date || 'TBD'}</strong>
                            </div>
                            {ob.notes && (
                              <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#065f46' }}>Notes: {ob.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: 0 }}>
              <button
                onClick={() => setLifecycleDrawer({ ...lifecycleDrawer, open: false })}
                style={{ padding: '8px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Close Lifecycle View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
