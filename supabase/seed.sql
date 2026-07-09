-- Seed catalogs. Idempotent: safe to re-run.

insert into houses (slug, name, city, country, flag, is_active) values
  ('bangalore', 'Cracked Bangalore', 'Bangalore', 'India',    '🇮🇳', false),
  ('vietnam',   'Cracked Da Nang',   'Da Nang',   'Vietnam',  '🇻🇳', true),
  ('dubai',     'Cracked Dubai',     'Dubai',     'UAE',      '🇦🇪', false),
  ('bali',      'Cracked Bali',      'Bali',      'Indonesia','🇮🇩', false)
on conflict (slug) do nothing;

insert into stamp_types (slug, name, house_id, kind)
select h.slug, h.name, h.id, 'house'
from houses h
on conflict (slug) do nothing;

insert into achievement_types (slug, name, description) values
  ('hosted-workshop',  'Hosted Workshop',        'Ran a session for the house.'),
  ('demo-day-winner',  'Demo Day Winner',        'Won a Cracked demo day.'),
  ('mentor',           'Mentor',                 'Mentored other Fellows.'),
  ('open-source',      'Open Source Contributor','Shipped meaningful open source.'),
  ('speaker',          'Speaker',                'Spoke at a Cracked event.'),
  ('builder-grant',    'Builder Grant',          'Received a Cracked builder grant.')
on conflict (slug) do nothing;

insert into sponsors (slug, name) values
  ('boardy', 'Boardy'),
  ('team1',  'Team1'),
  ('aws',    'AWS'),
  ('linear', 'Linear')
on conflict (slug) do nothing;

insert into perks (sponsor_id, name, description)
select s.id, p.name, p.description
from (values
  ('boardy', 'Boardy Pro',     'Pro access to Boardy.'),
  ('team1',  'Team1 Credits',  'Content credits from Team1.'),
  ('aws',    'AWS Credits',    'Cloud credits from AWS.'),
  ('linear', 'Linear',         'Linear for your team.')
) as p(sponsor_slug, name, description)
join sponsors s on s.slug = p.sponsor_slug
on conflict do nothing;
