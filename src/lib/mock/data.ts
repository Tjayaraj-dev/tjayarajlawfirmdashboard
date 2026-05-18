// Hand-curated mock data powering the overview dashboard.
// Designed to mirror a small Malaysian advocates' firm.
// Swap with Supabase queries when the schema lands.

export type PracticeArea =
  | 'Civil Litigation'
  | 'Conveyancing'
  | 'Family Law'
  | 'Corporate'
  | 'Criminal Defence'
  | 'Probate'

export type MatterStatus = 'Active' | 'On Hold' | 'Pending Filing' | 'Closed'

export type Hearing = {
  date: string // YYYY-MM-DD
  time: string // HH:MM
  kind: 'Mention' | 'Hearing' | 'Case Management' | 'Trial' | 'Order'
  court: string
}

export type Matter = {
  id: string
  fileRef: string
  title: string
  clientName: string
  practiceArea: PracticeArea
  status: MatterStatus
  openedAt: string // ISO date
  assignedTo: 'admin' | 'staff'
  nextHearing?: Hearing
}

export type Client = {
  id: string
  name: string
  kind: 'individual' | 'corporate'
  contact: string
  matters: number
}

export type ActivityKind =
  | 'doc_uploaded'
  | 'matter_opened'
  | 'client_added'
  | 'hearing_rescheduled'
  | 'note_added'
  | 'matter_closed'

export type ActivityEntry = {
  id: string
  kind: ActivityKind
  actor: string
  matterRef?: string
  detail: string
  at: string // ISO timestamp
}

export type Kpi = {
  label: string
  value: number
  trend: number // signed delta vs prior period
  trendLabel: string // e.g. "vs last week"
  sparkline: number[] // 14-30 data points
}

// ──────────────────────────────────────────────────────────────────
// Matters
// ──────────────────────────────────────────────────────────────────

export const matters: Matter[] = [
  {
    id: 'mtr-001',
    fileRef: 'TJC/CIV/2024/142',
    title: 'Tan Wei Ming v. Lim Holdings Sdn Bhd',
    clientName: 'Tan Wei Ming',
    practiceArea: 'Civil Litigation',
    status: 'Active',
    openedAt: '2024-11-08',
    assignedTo: 'admin',
    nextHearing: {
      date: '2026-05-18',
      time: '09:00',
      kind: 'Mention',
      court: "Sungai Petani Magistrate's Court",
    },
  },
  {
    id: 'mtr-002',
    fileRef: 'TJC/COR/2025/008',
    title: 'Ahmad bin Hassan v. ABC Trading Sdn Bhd',
    clientName: 'Ahmad bin Hassan',
    practiceArea: 'Corporate',
    status: 'Active',
    openedAt: '2025-02-14',
    assignedTo: 'admin',
    nextHearing: {
      date: '2026-05-17',
      time: '14:00',
      kind: 'Case Management',
      court: 'Kuala Lumpur Sessions Court',
    },
  },
  {
    id: 'mtr-003',
    fileRef: 'TJC/PRB/2025/004',
    title: 'Estate of the late Subramaniam a/l Velu',
    clientName: 'Kamala a/p Subramaniam',
    practiceArea: 'Probate',
    status: 'Active',
    openedAt: '2025-03-02',
    assignedTo: 'staff',
  },
  {
    id: 'mtr-004',
    fileRef: 'TJC/CIV/2025/067',
    title: 'Krishnan & Anor v. Public Bank Berhad',
    clientName: 'Krishnan a/l Raju',
    practiceArea: 'Civil Litigation',
    status: 'Active',
    openedAt: '2025-04-21',
    assignedTo: 'admin',
    nextHearing: {
      date: '2026-05-16',
      time: '15:30',
      kind: 'Hearing',
      court: 'High Court of Malaya (Alor Setar)',
    },
  },
  {
    id: 'mtr-005',
    fileRef: 'TJC/FAM/2025/021',
    title: 'Rahman v. Rahman',
    clientName: 'Nor Aisyah binti Rahman',
    practiceArea: 'Family Law',
    status: 'Active',
    openedAt: '2025-04-30',
    assignedTo: 'staff',
    nextHearing: {
      date: '2026-05-20',
      time: '10:00',
      kind: 'Hearing',
      court: 'Family Court, Kedah',
    },
  },
  {
    id: 'mtr-006',
    fileRef: 'TJC/CON/2025/088',
    title: 'Sungai Petani Properties Sdn Bhd — Lot 4471',
    clientName: 'Sungai Petani Properties Sdn Bhd',
    practiceArea: 'Conveyancing',
    status: 'Pending Filing',
    openedAt: '2025-05-02',
    assignedTo: 'staff',
  },
  {
    id: 'mtr-007',
    fileRef: 'TJC/CRI/2025/012',
    title: 'Pendakwa Raya v. Ng Boon Heng',
    clientName: 'Ng Boon Heng',
    practiceArea: 'Criminal Defence',
    status: 'Active',
    openedAt: '2025-05-04',
    assignedTo: 'admin',
    nextHearing: {
      date: '2026-05-22',
      time: '09:00',
      kind: 'Mention',
      court: "Sungai Petani Magistrate's Court",
    },
  },
  {
    id: 'mtr-008',
    fileRef: 'TJC/COR/2025/015',
    title: 'Ng & Sons Trading Sdn Bhd — Incorporation',
    clientName: 'Ng Hock Seng',
    practiceArea: 'Corporate',
    status: 'Active',
    openedAt: '2025-05-06',
    assignedTo: 'staff',
  },
  {
    id: 'mtr-009',
    fileRef: 'TJC/CIV/2025/098',
    title: 'Cheah Mei Ling v. Lee Hwa Construction',
    clientName: 'Cheah Mei Ling',
    practiceArea: 'Civil Litigation',
    status: 'Active',
    openedAt: '2025-05-09',
    assignedTo: 'admin',
    nextHearing: {
      date: '2026-05-19',
      time: '11:30',
      kind: 'Hearing',
      court: 'High Court of Malaya (Alor Setar)',
    },
  },
  {
    id: 'mtr-010',
    fileRef: 'TJC/FAM/2025/024',
    title: 'Khoo Family Property Settlement',
    clientName: 'Khoo Lai Peng',
    practiceArea: 'Family Law',
    status: 'On Hold',
    openedAt: '2025-05-11',
    assignedTo: 'staff',
  },
  {
    id: 'mtr-011',
    fileRef: 'TJC/CON/2025/092',
    title: 'Lim Vehicle Workshop — Tenancy Renewal',
    clientName: 'Lim Yew Choon',
    practiceArea: 'Conveyancing',
    status: 'Active',
    openedAt: '2025-05-12',
    assignedTo: 'staff',
  },
  {
    id: 'mtr-012',
    fileRef: 'TJC/CIV/2025/104',
    title: 'Wee Holdings Sdn Bhd v. Bumi Sentosa Construction',
    clientName: 'Wee Holdings Sdn Bhd',
    practiceArea: 'Civil Litigation',
    status: 'Active',
    openedAt: '2025-05-14',
    assignedTo: 'admin',
    nextHearing: {
      date: '2026-05-25',
      time: '14:30',
      kind: 'Case Management',
      court: 'Kuala Lumpur Sessions Court',
    },
  },
]

// ──────────────────────────────────────────────────────────────────
// Clients
// ──────────────────────────────────────────────────────────────────

export const clients: Client[] = [
  {
    id: 'cli-001',
    name: 'Tan Wei Ming',
    kind: 'individual',
    contact: '+60 12-3456 7890',
    matters: 1,
  },
  {
    id: 'cli-002',
    name: 'Ahmad bin Hassan',
    kind: 'individual',
    contact: '+60 19-2233 4455',
    matters: 1,
  },
  {
    id: 'cli-003',
    name: 'Sungai Petani Properties Sdn Bhd',
    kind: 'corporate',
    contact: '+60 4-421 8800',
    matters: 1,
  },
  {
    id: 'cli-004',
    name: 'Wee Holdings Sdn Bhd',
    kind: 'corporate',
    contact: '+60 4-735 1212',
    matters: 1,
  },
  {
    id: 'cli-005',
    name: 'Nor Aisyah binti Rahman',
    kind: 'individual',
    contact: '+60 13-9876 5432',
    matters: 1,
  },
  {
    id: 'cli-006',
    name: 'Krishnan a/l Raju',
    kind: 'individual',
    contact: '+60 17-5566 7788',
    matters: 1,
  },
  {
    id: 'cli-007',
    name: 'Ng & Sons Trading Sdn Bhd',
    kind: 'corporate',
    contact: '+60 4-432 9933',
    matters: 1,
  },
  {
    id: 'cli-008',
    name: 'Cheah Mei Ling',
    kind: 'individual',
    contact: '+60 12-4488 9911',
    matters: 1,
  },
]

// ──────────────────────────────────────────────────────────────────
// Activity feed
// ──────────────────────────────────────────────────────────────────

export const activity: ActivityEntry[] = [
  {
    id: 'act-001',
    kind: 'doc_uploaded',
    actor: 'Priya Kumar',
    matterRef: 'TJC/CIV/2024/142',
    detail: 'Statement of Claim · v2',
    at: minutesAgo(12),
  },
  {
    id: 'act-002',
    kind: 'matter_opened',
    actor: 'T. Jayaraj',
    matterRef: 'TJC/CIV/2025/104',
    detail: 'Wee Holdings v. Bumi Sentosa',
    at: hoursAgo(1),
  },
  {
    id: 'act-003',
    kind: 'hearing_rescheduled',
    actor: 'Priya Kumar',
    matterRef: 'TJC/FAM/2025/021',
    detail: 'Rahman v. Rahman · moved to 20 May',
    at: hoursAgo(3),
  },
  {
    id: 'act-004',
    kind: 'note_added',
    actor: 'T. Jayaraj',
    matterRef: 'TJC/CIV/2025/067',
    detail: 'Banking statements retrieved from client',
    at: hoursAgo(5),
  },
  {
    id: 'act-005',
    kind: 'doc_uploaded',
    actor: 'Priya Kumar',
    matterRef: 'TJC/CON/2025/088',
    detail: 'SPA · signed by both parties',
    at: hoursAgo(8),
  },
  {
    id: 'act-006',
    kind: 'client_added',
    actor: 'T. Jayaraj',
    detail: 'Wee Holdings Sdn Bhd',
    at: daysAgo(1),
  },
  {
    id: 'act-007',
    kind: 'doc_uploaded',
    actor: 'Priya Kumar',
    matterRef: 'TJC/FAM/2025/021',
    detail: 'Affidavit in Reply',
    at: daysAgo(1),
  },
  {
    id: 'act-008',
    kind: 'matter_closed',
    actor: 'T. Jayaraj',
    matterRef: 'TJC/CON/2024/231',
    detail: 'Tan Property · transfer registered',
    at: daysAgo(2),
  },
]

// ──────────────────────────────────────────────────────────────────
// KPIs
// ──────────────────────────────────────────────────────────────────

export const kpis: Record<
  'activeMatters' | 'hearingsThisWeek' | 'pendingDocuments' | 'newClientsLast30d',
  Kpi
> = {
  activeMatters: {
    label: 'Active Matters',
    value: 42,
    trend: 3,
    trendLabel: 'vs last week',
    sparkline: [36, 37, 38, 38, 39, 39, 40, 41, 40, 41, 42, 42, 41, 42],
  },
  hearingsThisWeek: {
    label: 'Hearings This Week',
    value: 7,
    trend: 2,
    trendLabel: 'vs last week',
    sparkline: [3, 4, 5, 4, 5, 6, 5, 4, 5, 6, 7, 7, 6, 7],
  },
  pendingDocuments: {
    label: 'Pending Documents',
    value: 12,
    trend: -2,
    trendLabel: 'urgent: 3',
    sparkline: [16, 15, 14, 15, 14, 13, 14, 13, 12, 13, 12, 11, 12, 12],
  },
  newClientsLast30d: {
    label: 'New Clients · 30d',
    value: 5,
    trend: 1,
    trendLabel: 'vs prior 30d',
    sparkline: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5],
  },
}

// ──────────────────────────────────────────────────────────────────
// Helpers (private)
// ──────────────────────────────────────────────────────────────────

function minutesAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 1000).toISOString()
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString()
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}
