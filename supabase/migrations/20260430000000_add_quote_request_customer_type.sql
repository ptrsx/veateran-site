alter table public.quote_requests
  add column if not exists customer_type text,
  add column if not exists business_name text null,
  add column if not exists business_vat text null,
  add column if not exists business_tax_office text null,
  add column if not exists business_address text null,
  add column if not exists contact_name text null,
  add column if not exists contact_phone text null,
  add column if not exists contact_email text null,
  add column if not exists invoice_required boolean;

alter table public.quote_requests
  alter column customer_type set default 'individual',
  alter column invoice_required set default false;

update public.quote_requests
set customer_type = 'individual'
where customer_type is null
  or customer_type not in ('individual', 'business');

update public.quote_requests
set invoice_required = false
where invoice_required is null;

alter table public.quote_requests
  alter column customer_type set not null,
  alter column invoice_required set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.quote_requests'::regclass
      and conname = 'quote_requests_customer_type_check'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_customer_type_check
      check (customer_type in ('individual', 'business'))
      not valid;
  end if;
end;
$$;

alter table public.quote_requests
  validate constraint quote_requests_customer_type_check;

create index if not exists quote_requests_customer_type_idx on public.quote_requests (customer_type);
create index if not exists quote_requests_business_name_idx on public.quote_requests (business_name);
create index if not exists quote_requests_business_vat_idx on public.quote_requests (business_vat);
