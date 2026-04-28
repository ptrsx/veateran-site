export type QuoteRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "NEEDS_QUOTE"
  | "QUOTE_SENT"
  | "WAITING_REPLY"
  | "WON"
  | "LOST"
  | "CANCELLED";

export type QuoteRequest = {
  id: string;
  created_at: string;
  updated_at: string;
  status: QuoteRequestStatus;
  name: string;
  phone: string;
  email: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  guest_count: number | null;
  interested_in: string | null;
  notes: string | null;
  internal_notes: string | null;
  price_per_person: number | null;
  quoted_total: number | null;
  final_guest_count: number | null;
  final_total: number | null;
  deposit_amount: number | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  quote_sent_at: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  closed_at: string | null;
  lost_reason: string | null;
};

export type QuoteRequestInsert = {
  status?: QuoteRequestStatus;
  name: string;
  phone: string;
  email: string;
  event_type: string;
  event_date?: string | null;
  location?: string | null;
  guest_count?: number | null;
  interested_in?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  price_per_person?: number | null;
  quoted_total?: number | null;
  final_guest_count?: number | null;
  final_total?: number | null;
  deposit_amount?: number | null;
  source?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  quote_sent_at?: string | null;
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
  closed_at?: string | null;
  lost_reason?: string | null;
};

export type QuoteRequestUpdate = Partial<QuoteRequestInsert>;
