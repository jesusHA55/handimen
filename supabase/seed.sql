-- Seed data for local development.
-- Categories are defined in @handimen/core (packages/core/src/listings/categories.ts).

insert into public.cities (slug, name, province, country_code, center)
values (
  'barcelona',
  'Barcelona',
  'Barcelona',
  'ES',
  extensions.st_setsrid(extensions.st_makepoint(2.1734, 41.3851), 4326)::extensions.geography
)
on conflict (slug) do nothing;

-- A public group for the launch neighbourhood: Poblenou.
insert into public.groups (slug, name, description, city_id, visibility, join_policy, owner_id)
select
  'poblenou',
  'Poblenou',
  'Vecinos de Poblenou que comparten herramientas, equipo y habilidades.',
  c.id,
  'public',
  'open',
  -- Placeholder owner; replace with a real profile id in your environment.
  (select id from public.profiles order by created_at limit 1)
from public.cities c
where c.slug = 'barcelona'
  and exists (select 1 from public.profiles)
on conflict (slug) do nothing;
