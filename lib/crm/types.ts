export type QuoteRequestStatus =
  | "NEW"
  | "CONTACTED"
  | "NEEDS_QUOTE"
  | "QUOTE_SENT"
  | "WAITING_REPLY"
  | "WON"
  | "LOST"
  | "CANCELLED";

export type QuoteRequestSource =
  | "website"
  | "phone"
  | "email"
  | "instagram"
  | "facebook"
  | "referral"
  | "other";

export type QuoteRequestCustomerType = "individual" | "business";

export type QuoteRequestSelectedMenuItem = {
  id: string;
  label: string;
  category: "food" | "drinks";
  audience: "adult" | "child";
};

export type QuoteRequest = {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: QuoteRequestStatus;
  customer_type: QuoteRequestCustomerType;
  name: string;
  phone: string | null;
  email: string | null;
  business_name: string | null;
  business_vat: string | null;
  business_tax_office: string | null;
  business_address: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  invoice_required: boolean;
  selected_menu_items: QuoteRequestSelectedMenuItem[];
  adult_guest_count: number | null;
  child_guest_count: number | null;
  selected_adult_menu_items: QuoteRequestSelectedMenuItem[];
  selected_child_menu_items: QuoteRequestSelectedMenuItem[];
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
  source: QuoteRequestSource;
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
  deleted_at?: string | null;
  status?: QuoteRequestStatus;
  customer_type?: QuoteRequestCustomerType;
  name: string;
  phone?: string | null;
  email?: string | null;
  business_name?: string | null;
  business_vat?: string | null;
  business_tax_office?: string | null;
  business_address?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  invoice_required?: boolean;
  selected_menu_items?: QuoteRequestSelectedMenuItem[];
  adult_guest_count?: number | null;
  child_guest_count?: number | null;
  selected_adult_menu_items?: QuoteRequestSelectedMenuItem[];
  selected_child_menu_items?: QuoteRequestSelectedMenuItem[];
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
  source?: QuoteRequestSource;
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
