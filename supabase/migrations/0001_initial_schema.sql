-- =============================================================================
-- Marigold Content Studio — initial Supabase schema
-- -----------------------------------------------------------------------------
-- Single-tenant. RLS is ENABLED on every table.
--
-- Security model:
--   * The studio owner (you) signs in via Supabase Auth and is registered in
--     public.app_admins. Studio data is readable/writable only by admins.
--   * Public flows (form submissions, drafts, vendor portal sign-up/login)
--     run server-side through Next.js API routes using the SERVICE ROLE key,
--     which bypasses RLS by design. The `anon` role gets ZERO direct table
--     access — never expose the service role key in client code.
--   * Reference tables (pillars/series/templates/knowledge) are readable by
--     any authenticated user so the studio UI can list them.
--
-- Idempotent: re-runnable. Uses IF NOT EXISTS / DROP-then-CREATE where needed.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Helper: updated_at trigger function
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 2. Reference / seed tables (pillars, series, templates, brand knowledge)
--    Schema only. App keeps loading from bundled JSON until you populate these.
-- =============================================================================

create table if not exists public.content_pillars (
  slug          text primary key,
  name          text not null,
  description   text,
  color         text,
  default_share numeric(4,3) default 0,
  sort_order    integer default 0,
  is_active     boolean default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.content_series (
  slug                 text primary key,
  name                 text not null,
  pillar_slug          text references public.content_pillars(slug) on update cascade,
  purpose              text,
  description          text,
  supported_formats    text[] default '{}',
  grid_color_profile   text check (grid_color_profile in ('pink','wine','cream','colorful')),
  ai_generation_prompt text,
  is_active            boolean default true,
  sort_order           integer default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.template_definitions (
  slug              text primary key,
  name              text not null,
  series_slug       text references public.content_series(slug) on update cascade,
  pillar_slug       text references public.content_pillars(slug) on update cascade,
  format            text not null check (format in ('story','post','reel')),
  dimensions        jsonb,
  component_name    text,
  editable_fields   jsonb default '[]'::jsonb,
  variant_config    jsonb,
  is_active         boolean default true,
  sort_order        integer default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists template_definitions_series_idx on public.template_definitions(series_slug);
create index if not exists template_definitions_pillar_idx on public.template_definitions(pillar_slug);

create table if not exists public.brand_knowledge (
  id          text primary key,
  category    text check (category in ('product_features','audience','tone','stats','competitors')),
  title       text not null,
  content     text,
  is_active   boolean default true,
  sort_order  integer default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- =============================================================================
-- 3. Brand / strategy overrides (single-row "settings" tables)
-- =============================================================================

create table if not exists public.brand_config_overrides (
  id          text primary key default 'default',
  brand_voice jsonb default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.content_strategy (
  id              text primary key default 'default',
  posting_cadence jsonb default '[]'::jsonb,
  pillar_mix      jsonb default '[]'::jsonb,
  series_active   jsonb default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

create table if not exists public.template_active_overrides (
  template_slug text primary key,
  is_active     boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- 4. Calendar items (the heart of the app)
-- =============================================================================

create table if not exists public.calendar_items (
  id                    uuid primary key default gen_random_uuid(),
  scheduled_date        date not null,
  scheduled_time        time,
  week_number           integer,
  series_slug           text not null,
  pillar_slug           text not null check (pillar_slug in ('engage','educate','inspire','connect','convert')),
  template_slug         text not null,
  format                text not null check (format in ('story','post','reel')),
  status                text not null default 'suggested' check (status in ('suggested','approved','editing','exported','posted')),
  content_data          jsonb not null default '{}'::jsonb,
  caption               text,
  hashtags              text[] default '{}',
  grid_position         jsonb,
  ai_rationale          text,
  generation_prompt     text,
  sort_order            integer default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists calendar_items_date_idx        on public.calendar_items(scheduled_date);
create index if not exists calendar_items_status_idx      on public.calendar_items(status);
create index if not exists calendar_items_series_idx      on public.calendar_items(series_slug);
create index if not exists calendar_items_pillar_idx      on public.calendar_items(pillar_slug);
create index if not exists calendar_items_week_idx        on public.calendar_items(week_number);

drop trigger if exists calendar_items_updated_at on public.calendar_items;
create trigger calendar_items_updated_at
  before update on public.calendar_items
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 5. Asset records (exported PNGs / library)
-- =============================================================================

create table if not exists public.asset_records (
  id                uuid primary key default gen_random_uuid(),
  calendar_item_id  uuid references public.calendar_items(id) on delete set null,
  -- We also accept synthetic IDs ("gallery_xyz", "customize_xyz") from the
  -- gallery + customize-sample flows; store them as text in a parallel column
  -- when no real calendar item exists.
  source_ref        text,
  template_slug     text not null,
  series_slug       text,
  file_type         text not null check (file_type in ('png','jpg','mp4')),
  file_path         text,        -- Supabase Storage path; null = legacy data URL
  file_url          text,        -- legacy data/blob URL (session-scoped, optional)
  thumbnail_path    text,        -- Storage path
  thumbnail         text,        -- legacy base64 thumbnail
  filename          text not null,
  dimensions        jsonb,
  file_size_bytes   bigint,
  render_config     jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists asset_records_calendar_item_idx on public.asset_records(calendar_item_id);
create index if not exists asset_records_template_idx      on public.asset_records(template_slug);
create index if not exists asset_records_created_idx       on public.asset_records(created_at desc);

-- =============================================================================
-- 6. Vendor submissions (manual intake) + request templates
-- =============================================================================

create table if not exists public.vendor_submissions (
  id                          uuid primary key default gen_random_uuid(),
  vendor_name                 text not null,
  category                    text not null check (category in (
                                'photographer','decorator','planner','venue','caterer',
                                'makeup','videographer','florist','mehndi','dj','other')),
  submission_type             text not null check (submission_type in (
                                'photos','quote','tips','bio','wedding_recap','venue_package')),
  text_content                text default '',
  image_urls                  text[] default '{}',
  notes                       text default '',
  status                      text not null default 'new' check (status in ('new','planned','used')),
  linked_calendar_item_id     uuid references public.calendar_items(id) on delete set null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists vendor_submissions_status_idx   on public.vendor_submissions(status);
create index if not exists vendor_submissions_category_idx on public.vendor_submissions(category);

drop trigger if exists vendor_submissions_updated_at on public.vendor_submissions;
create trigger vendor_submissions_updated_at
  before update on public.vendor_submissions
  for each row execute function public.set_updated_at();

create table if not exists public.submission_request_templates (
  id          text primary key,
  name        text not null,
  description text,
  body        text not null,
  is_default  boolean default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists submission_request_templates_updated_at on public.submission_request_templates;
create trigger submission_request_templates_updated_at
  before update on public.submission_request_templates
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 7. Form configs + form submissions (public forms system)
-- =============================================================================

create table if not exists public.form_configs (
  id                 text primary key,
  template_type      text not null check (template_type in (
                       'vendor','vendor-portfolio','vendor-tips','vendor-blog-post','venue',
                       'bride-confession','bride-connect','bride-diary','wedding-recap','general')),
  title              text not null,
  description        text default '',
  fields             jsonb not null default '[]'::jsonb,
  thank_you_message  text default '',
  is_active          boolean default true,
  submission_count   integer default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists form_configs_updated_at on public.form_configs;
create trigger form_configs_updated_at
  before update on public.form_configs
  for each row execute function public.set_updated_at();

create table if not exists public.form_submissions (
  id              uuid primary key default gen_random_uuid(),
  form_id         text references public.form_configs(id) on delete set null,
  form_title      text not null,
  template_type   text not null,
  data            jsonb not null default '{}'::jsonb,
  status          text not null default 'new' check (status in ('new','reviewed','saved-to-library','used','rejected')),
  notes           text default '',
  submitted_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists form_submissions_form_idx     on public.form_submissions(form_id);
create index if not exists form_submissions_status_idx   on public.form_submissions(status);
create index if not exists form_submissions_submitted_idx on public.form_submissions(submitted_at desc);

drop trigger if exists form_submissions_updated_at on public.form_submissions;
create trigger form_submissions_updated_at
  before update on public.form_submissions
  for each row execute function public.set_updated_at();

create table if not exists public.submission_files (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid references public.form_submissions(id) on delete cascade,
  field_id        text not null,
  file_name       text not null,
  mime_type       text not null,
  file_size       bigint,
  storage_path    text not null,        -- Supabase Storage object key
  thumbnail_path  text,                 -- Supabase Storage object key
  created_at      timestamptz not null default now()
);

create index if not exists submission_files_submission_idx on public.submission_files(submission_id);

create table if not exists public.form_submissions_meta (
  id            text primary key default 'default',
  last_seen_at  timestamptz
);

-- Vendor + venue form drafts (resumable session state)
create table if not exists public.form_drafts (
  token       text primary key,
  kind        text not null check (kind in ('vendor','venue','blog','generic')),
  values      jsonb not null default '{}'::jsonb,
  step_index  integer default 0,
  saved_at    timestamptz not null default now()
);

create index if not exists form_drafts_kind_idx on public.form_drafts(kind);

-- =============================================================================
-- 8. Media library (replaces IndexedDB)
-- =============================================================================

create table if not exists public.media_items (
  id                 uuid primary key default gen_random_uuid(),
  type               text not null check (type in ('image','video','text')),
  file_name          text not null,
  mime_type          text not null,
  file_path          text,        -- Supabase Storage object key
  thumbnail_path     text,        -- Supabase Storage object key
  width              integer,
  height             integer,
  duration_seconds   numeric,
  file_size          bigint,
  text_content       text,        -- for type='text'
  tags               text[] default '{}',
  collection         text default 'Vendor Photos',
  source             text not null default 'upload' check (source in ('upload','vendor-submission','generated')),
  vendor_name        text,
  vendor_category    text,
  notes              text default '',
  used_in            uuid[] default '{}',           -- array of calendar_item ids
  submission_id      uuid references public.form_submissions(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists media_items_type_idx       on public.media_items(type);
create index if not exists media_items_collection_idx on public.media_items(collection);
create index if not exists media_items_source_idx     on public.media_items(source);
create index if not exists media_items_created_idx    on public.media_items(created_at desc);
create index if not exists media_items_tags_idx       on public.media_items using gin (tags);

drop trigger if exists media_items_updated_at on public.media_items;
create trigger media_items_updated_at
  before update on public.media_items
  for each row execute function public.set_updated_at();

create table if not exists public.media_collections (
  name        text primary key,
  sort_order  integer default 0,
  created_at  timestamptz not null default now()
);

-- Pre-populate the default collections so the UI has something on a fresh DB.
insert into public.media_collections (name, sort_order) values
  ('Vendor Photos',       1),
  ('Venue Photos',        2),
  ('Product Shots',       3),
  ('Bride Photos',        4),
  ('Textures & Patterns', 5),
  ('Logos & Brand',       6),
  ('Video Clips',         7),
  ('Text & Quotes',       8)
on conflict (name) do nothing;

-- =============================================================================
-- 9. Outreach log (form-link tracking)
-- =============================================================================

create table if not exists public.outreach_log (
  id                     uuid primary key default gen_random_uuid(),
  form_id                text references public.form_configs(id) on delete set null,
  template_type          text not null,
  recipient              text not null,
  channel                text not null check (channel in ('email','copy-link','whatsapp','dm','qr')),
  url                    text not null,
  sent_at                timestamptz not null default now(),
  matched_submission_id  uuid references public.form_submissions(id) on delete set null,
  note                   text
);

create index if not exists outreach_log_form_idx     on public.outreach_log(form_id);
create index if not exists outreach_log_sent_idx     on public.outreach_log(sent_at desc);
create index if not exists outreach_log_template_idx on public.outreach_log(template_type);

-- =============================================================================
-- 10. Vendor accounts + sessions (vendor dashboard auth)
-- =============================================================================

create table if not exists public.vendor_accounts (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  password_hash   text not null,            -- SHA-256 salted (app-side); upgrade to Supabase Auth later
  submission_id   uuid references public.form_submissions(id) on delete set null,
  business_name   text,
  category        text,
  created_at      timestamptz not null default now(),
  last_login      timestamptz
);

create table if not exists public.vendor_sessions (
  account_id   uuid primary key references public.vendor_accounts(id) on delete cascade,
  email        text not null,
  signed_in_at timestamptz not null default now()
);

-- =============================================================================
-- 11. Generation rate-limit / session counters
--     (replaces in-memory Map in /api/blog/generate)
-- =============================================================================

create table if not exists public.generation_sessions (
  token         text primary key,
  count         integer not null default 0,
  first_at      timestamptz not null default now(),
  last_at       timestamptz not null default now()
);

create index if not exists generation_sessions_first_at_idx on public.generation_sessions(first_at);

-- =============================================================================
-- 12. Storage buckets (one-shot setup)
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('assets',       'assets',       false),
  ('media',        'media',        false),
  ('submissions',  'submissions',  false),
  ('thumbnails',   'thumbnails',   true)   -- thumbnails public so img tags work without signed URLs
on conflict (id) do nothing;

-- =============================================================================
-- 13. Admin registry + RLS helper
-- -----------------------------------------------------------------------------
-- Studio owners go in app_admins. After running this script, sign up via
-- Supabase Auth, then run:
--
--   insert into public.app_admins (user_id, email)
--   values ('<your-auth-uid>', '<your-email>');
--
-- Replace <your-auth-uid> with the id from auth.users for your account.
-- =============================================================================

create table if not exists public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so it can read app_admins regardless of caller's RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins where user_id = auth.uid()
  );
$$;

-- Service role always passes; admins pass; everyone else fails.
create or replace function public.has_studio_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((auth.jwt() ->> 'role') = 'service_role', false)
    or public.is_admin();
$$;

-- =============================================================================
-- 14. Enable RLS on every table
-- =============================================================================

alter table public.app_admins                      enable row level security;
alter table public.content_pillars                 enable row level security;
alter table public.content_series                  enable row level security;
alter table public.template_definitions            enable row level security;
alter table public.brand_knowledge                 enable row level security;
alter table public.brand_config_overrides          enable row level security;
alter table public.content_strategy                enable row level security;
alter table public.template_active_overrides       enable row level security;
alter table public.calendar_items                  enable row level security;
alter table public.asset_records                   enable row level security;
alter table public.vendor_submissions              enable row level security;
alter table public.submission_request_templates    enable row level security;
alter table public.form_configs                    enable row level security;
alter table public.form_submissions                enable row level security;
alter table public.submission_files                enable row level security;
alter table public.form_submissions_meta           enable row level security;
alter table public.form_drafts                     enable row level security;
alter table public.media_items                     enable row level security;
alter table public.media_collections               enable row level security;
alter table public.outreach_log                    enable row level security;
alter table public.vendor_accounts                 enable row level security;
alter table public.vendor_sessions                 enable row level security;
alter table public.generation_sessions             enable row level security;

-- =============================================================================
-- 15. RLS Policies
-- -----------------------------------------------------------------------------
-- Each table follows one of three patterns:
--   (A) Studio-only: admins can do anything; nobody else can do anything.
--   (B) Reference / readable: any authenticated user can SELECT; admins write.
--   (C) Server-managed: NO direct policies — only the service role key reaches
--       these tables (the API routes). Both anon and authenticated are blocked.
-- =============================================================================

-- ---- (A) Studio-only tables -------------------------------------------------

-- Admin registry: only admins can see / manage admins.
drop policy if exists app_admins_studio on public.app_admins;
create policy app_admins_studio on public.app_admins
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists brand_config_overrides_studio on public.brand_config_overrides;
create policy brand_config_overrides_studio on public.brand_config_overrides
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists content_strategy_studio on public.content_strategy;
create policy content_strategy_studio on public.content_strategy
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists template_active_overrides_studio on public.template_active_overrides;
create policy template_active_overrides_studio on public.template_active_overrides
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists calendar_items_studio on public.calendar_items;
create policy calendar_items_studio on public.calendar_items
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists asset_records_studio on public.asset_records;
create policy asset_records_studio on public.asset_records
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists vendor_submissions_studio on public.vendor_submissions;
create policy vendor_submissions_studio on public.vendor_submissions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists submission_request_templates_studio on public.submission_request_templates;
create policy submission_request_templates_studio on public.submission_request_templates
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists form_configs_studio on public.form_configs;
create policy form_configs_studio on public.form_configs
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists form_submissions_studio on public.form_submissions;
create policy form_submissions_studio on public.form_submissions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists submission_files_studio on public.submission_files;
create policy submission_files_studio on public.submission_files
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists form_submissions_meta_studio on public.form_submissions_meta;
create policy form_submissions_meta_studio on public.form_submissions_meta
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists media_items_studio on public.media_items;
create policy media_items_studio on public.media_items
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists outreach_log_studio on public.outreach_log;
create policy outreach_log_studio on public.outreach_log
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- (B) Reference tables — any authenticated user can read; admins write ---

drop policy if exists content_pillars_read on public.content_pillars;
create policy content_pillars_read on public.content_pillars
  for select to authenticated using (true);
drop policy if exists content_pillars_write on public.content_pillars;
create policy content_pillars_write on public.content_pillars
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists content_series_read on public.content_series;
create policy content_series_read on public.content_series
  for select to authenticated using (true);
drop policy if exists content_series_write on public.content_series;
create policy content_series_write on public.content_series
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists template_definitions_read on public.template_definitions;
create policy template_definitions_read on public.template_definitions
  for select to authenticated using (true);
drop policy if exists template_definitions_write on public.template_definitions;
create policy template_definitions_write on public.template_definitions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists brand_knowledge_read on public.brand_knowledge;
create policy brand_knowledge_read on public.brand_knowledge
  for select to authenticated using (true);
drop policy if exists brand_knowledge_write on public.brand_knowledge;
create policy brand_knowledge_write on public.brand_knowledge
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists media_collections_read on public.media_collections;
create policy media_collections_read on public.media_collections
  for select to authenticated using (true);
drop policy if exists media_collections_write on public.media_collections;
create policy media_collections_write on public.media_collections
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---- (C) Server-managed tables — no policies, only service role reaches ----
-- form_drafts, vendor_accounts, vendor_sessions, generation_sessions are
-- written by API routes using the SERVICE ROLE key. We deliberately leave
-- them with RLS enabled and NO policies, which means anon + authenticated
-- get a hard deny. Service role bypasses RLS, so the API routes work.

-- =============================================================================
-- 16. Storage bucket policies
-- -----------------------------------------------------------------------------
-- All four buckets exist; here we restrict who can read/write objects.
--   * thumbnails is public (rendered in <img> tags) — no policy needed for read
--   * assets, media, submissions: only service role + admins can list/read.
-- The studio uploads via the API (server) using the service role key; signed
-- URLs are minted server-side for any short-lived client downloads.
-- =============================================================================

-- Admins can manage all objects in private buckets.
drop policy if exists "admin manages assets" on storage.objects;
create policy "admin manages assets" on storage.objects
  for all to authenticated
  using (bucket_id in ('assets','media','submissions') and public.is_admin())
  with check (bucket_id in ('assets','media','submissions') and public.is_admin());

-- Public read on thumbnails bucket — anyone can fetch a thumbnail URL.
drop policy if exists "public read thumbnails" on storage.objects;
create policy "public read thumbnails" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'thumbnails');

-- Admins can write thumbnails.
drop policy if exists "admin writes thumbnails" on storage.objects;
create policy "admin writes thumbnails" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'thumbnails' and public.is_admin());

drop policy if exists "admin updates thumbnails" on storage.objects;
create policy "admin updates thumbnails" on storage.objects
  for update to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin())
  with check (bucket_id = 'thumbnails' and public.is_admin());

drop policy if exists "admin deletes thumbnails" on storage.objects;
create policy "admin deletes thumbnails" on storage.objects
  for delete to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin());

-- =============================================================================
-- 17. Revoke broad grants from anon to be extra safe
-- -----------------------------------------------------------------------------
-- Supabase grants USAGE on schema public to anon by default; combined with
-- our RLS that's already a deny-by-default, but we also revoke direct table
-- privileges so leaks via misconfigured policies are impossible.
-- =============================================================================

revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

-- Authenticated keeps default grants; RLS does the gating.

-- =============================================================================
-- Done.
-- -----------------------------------------------------------------------------
-- Post-install steps (after running this in the SQL Editor):
--   1. Go to Auth → Users → Add user (or sign up via your app once auth is
--      wired). Copy the UUID.
--   2. Run in SQL Editor:
--        insert into public.app_admins (user_id, email)
--        values ('<paste-uuid>', '<your-email>');
--   3. In your Next.js app, configure two Supabase clients:
--        - Browser client uses the ANON key (only authenticated admin reads).
--        - Server client (in API routes) uses the SERVICE ROLE key for any
--          public-write flows (form submissions, drafts, vendor portal).
--      NEVER ship the service role key to the browser.
-- =============================================================================
