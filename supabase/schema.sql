-- ====================================================================
-- Costaff ATS Master Database Schema
-- Aligned with Costaff_Master Tracker_V.1.xlsx (9 Sheets)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Master Dropdowns Table (From Do_NOT_Delete Sheet)
CREATE TABLE IF NOT EXISTS dropdown_masters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    value VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Profiles (Roles: super_admin, am, ta, hr, finance)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'am', 'ta', 'hr', 'finance')),
    phone VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clients Master
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Client Contacts (SPOCs)
CREATE TABLE IF NOT EXISTS client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    designation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Demands (Client_Staffing Log - 32 Columns)
CREATE TABLE IF NOT EXISTS demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id VARCHAR(50) NOT NULL,
    external_requisition_id VARCHAR(100),
    buzzworks_id VARCHAR(100),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    poc_id UUID REFERENCES client_contacts(id) ON DELETE SET NULL,
    role_category VARCHAR(50),
    account_name VARCHAR(255),
    skill_description TEXT NOT NULL,
    technology_stack TEXT[],
    experience_level VARCHAR(100),
    locations TEXT[],
    budget_min NUMERIC(12, 2),
    budget_max NUMERIC(12, 2),
    num_positions INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Open',
    priority VARCHAR(20) DEFAULT 'Medium',
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated Days Open & Red Flag View
CREATE OR REPLACE VIEW v_demands_with_aging AS
SELECT 
    d.*,
    c.name AS client_name,
    p.full_name AS am_name,
    GREATEST(0, EXTRACT(DAY FROM (COALESCE(d.closed_at, NOW()) - d.opened_at))::INT) AS days_open,
    (EXTRACT(DAY FROM (COALESCE(d.closed_at, NOW()) - d.opened_at)) > 30 AND d.status = 'Open') AS is_red_flag
FROM demands d
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN profiles p ON d.created_by = p.id;

-- 6. TA Demand Allocations (TA_Allocation Log)
CREATE TABLE IF NOT EXISTS demand_ta_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id UUID REFERENCES demands(id) ON DELETE CASCADE,
    ta_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    allocated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Candidates (TA_Daily Call Log - 33 Columns)
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    alternate_phone VARCHAR(50),
    email VARCHAR(255),
    qualification VARCHAR(255),
    available_from DATE,
    skills TEXT[],
    current_company VARCHAR(255),
    current_location VARCHAR(255),
    preferred_locations TEXT[],
    current_ctc NUMERIC(10, 2),
    expected_ctc NUMERIC(10, 2),
    source VARCHAR(100) DEFAULT 'naukri',
    availability VARCHAR(100),
    holding_other_offer VARCHAR(100),
    profile_archived BOOLEAN DEFAULT false,
    added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Submissions / Candidate Pipeline (27 Excel Stages)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id UUID REFERENCES demands(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    submitted_by_ta UUID REFERENCES profiles(id) ON DELETE SET NULL,
    managed_by_am UUID REFERENCES profiles(id) ON DELETE SET NULL,
    stage VARCHAR(100) DEFAULT 'submitted_for_am_review',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Interviews (Interview Sheet - 28 Columns)
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    demand_id UUID REFERENCES demands(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    scheduled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    interviewer_name VARCHAR(255),
    level VARCHAR(50),
    skill_tested VARCHAR(255),
    mode VARCHAR(50) DEFAULT 'Video',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    status VARCHAR(100) DEFAULT 'Scheduled',
    link_status VARCHAR(100),
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Offers
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    demand_id UUID REFERENCES demands(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    offered_ctc NUMERIC(10, 2),
    offer_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Onboardings (Onboarding Sheet - 16 Columns)
CREATE TABLE IF NOT EXISTS onboardings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    demand_id UUID REFERENCES demands(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    bgv_status VARCHAR(50) DEFAULT 'in_progress',
    actual_joining_date DATE,
    status VARCHAR(100) DEFAULT 'yet_to_join',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DISABLE RLS FOR DATA INGESTION
ALTER TABLE dropdown_masters DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE demands DISABLE ROW LEVEL SECURITY;
ALTER TABLE demand_ta_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE onboardings DISABLE ROW LEVEL SECURITY;
