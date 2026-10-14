-- Handimen seed data for local + hosted development.
--
-- Categories live in @handimen/core (packages/core/src/listings/categories.ts).
-- Demo members are inserted straight into auth.users (the `handle_new_user`
-- trigger then creates their profile rows), so the neighbourhood is populated
-- before anyone signs in.
--
-- IDs are deterministic so this file is reproducible.

-- ---------------------------------------------------------------------------
-- City
-- ---------------------------------------------------------------------------
insert into public.cities (slug, name, province, country_code, center)
values (
  'barcelona', 'Barcelona', 'Barcelona', 'ES',
  extensions.st_setsrid(extensions.st_makepoint(2.1734, 41.3851), 4326)::extensions.geography
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Demo members (auth.users -> trigger -> profiles)
-- ---------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('11111111-1111-4111-8111-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marta@handimen.test',  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Marta"}'::jsonb,  now() - interval '90 days', now()),
  ('11111111-1111-4111-8111-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jordi@handimen.test',  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Jordi"}'::jsonb,  now() - interval '120 days', now()),
  ('11111111-1111-4111-8111-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ainhoa@handimen.test', now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Ainhoa"}'::jsonb, now() - interval '60 days', now()),
  ('11111111-1111-4111-8111-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sam@handimen.test',    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Sam"}'::jsonb,    now() - interval '45 days', now()),
  ('11111111-1111-4111-8111-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nuria@handimen.test',  now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"display_name":"Núria"}'::jsonb,  now() - interval '150 days', now())
on conflict (id) do nothing;

update public.profiles set neighbourhood = 'Poblenou',       phone_verified = true, vouches = 6, completed_handoffs = 41 where id = '11111111-1111-4111-8111-000000000001';
update public.profiles set neighbourhood = 'El Clot',        phone_verified = true, id_verified = true, vouches = 9, completed_handoffs = 63 where id = '11111111-1111-4111-8111-000000000002';
update public.profiles set neighbourhood = 'Poblenou',       phone_verified = true, vouches = 3, completed_handoffs = 14 where id = '11111111-1111-4111-8111-000000000003';
update public.profiles set neighbourhood = 'Vila Olímpica',  phone_verified = true, vouches = 4, completed_handoffs = 25 where id = '11111111-1111-4111-8111-000000000004';
update public.profiles set neighbourhood = 'Poblenou',       phone_verified = true, id_verified = true, vouches = 7, completed_handoffs = 50 where id = '11111111-1111-4111-8111-000000000005';

-- ---------------------------------------------------------------------------
-- Neighbourhood group
-- ---------------------------------------------------------------------------
insert into public.groups (id, slug, name, description, city_id, visibility, join_policy, owner_id)
select
  '22222222-2222-4222-8222-000000000001', 'poblenou', 'Poblenou',
  'Vecinos de Poblenou que comparten herramientas, equipo y habilidades.',
  c.id, 'public', 'open', '11111111-1111-4111-8111-000000000001'
from public.cities c where c.slug = 'barcelona'
on conflict (id) do nothing;

insert into public.group_members (group_id, user_id, role, status)
values ('22222222-2222-4222-8222-000000000001', '11111111-1111-4111-8111-000000000001', 'owner', 'active')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
insert into public.listings (id, owner_id, type, terms, category, title, description, photos, price_cents, deposit_cents, price_unit, pickup_location, status, created_at)
values
  ('33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-000000000001', 'tool', 'free', 'power_tools', 'Taladro percutor Bosch', 'Taladro con maletín y juego de brocas. Ideal para colgar estanterías o montar muebles. Te lo dejo gratis, solo cuídalo.', ARRAY['🪛'], null, null, null, extensions.st_setsrid(extensions.st_makepoint(2.2012, 41.3996), 4326)::extensions.geography, 'active', now() - interval '1 day'),
  ('33333333-3333-4333-8333-000000000002', '11111111-1111-4111-8111-000000000003', 'equipment', 'free', 'home_cleaning', 'Escalera de tijera 3 peldaños', 'Escalera plegable de aluminio. Perfecta para pintar o cambiar bombillas.', ARRAY['🪜'], null, null, null, extensions.st_setsrid(extensions.st_makepoint(2.1968, 41.4012), 4326)::extensions.geography, 'active', now() - interval '2 days'),
  ('33333333-3333-4333-8333-000000000003', '11111111-1111-4111-8111-000000000004', 'equipment', 'rent', 'automotive', 'Bicicleta de carga (cargo bike)', 'Bici de carga eléctrica con caja delantera. Perfecta para mudanzas pequeñas o llevar la compra. Incluye candado y casco.', ARRAY['🚲'], 1800, 5000, 'day', extensions.st_setsrid(extensions.st_makepoint(2.2045, 41.3972), 4326)::extensions.geography, 'active', now() - interval '6 hours'),
  ('33333333-3333-4333-8333-000000000004', '11111111-1111-4111-8111-000000000002', 'equipment', 'rent', 'party_events', 'Proyector Full HD + pantalla', 'Proyector 1080p con pantalla portátil de 100". Ideal para cine de verano en la azotea o presentaciones.', ARRAY['📽️'], 2500, 8000, 'day', extensions.st_setsrid(extensions.st_makepoint(2.1902, 41.4038), 4326)::extensions.geography, 'active', now() - interval '3 days'),
  ('33333333-3333-4333-8333-000000000005', '11111111-1111-4111-8111-000000000005', 'equipment', 'rent', 'kitchen', 'Kit de paella para 20 personas', 'Paellera de 70 cm, quemador de gas y utensilios. Todo lo necesario para una calçotada o paella de barrio.', ARRAY['🥘'], 1500, 4000, 'day', extensions.st_setsrid(extensions.st_makepoint(2.1938, 41.3991), 4326)::extensions.geography, 'active', now() - interval '4 days'),
  ('33333333-3333-4333-8333-000000000006', '11111111-1111-4111-8111-000000000001', 'skill', 'free', 'help_time', 'Montaje de muebles IKEA', 'Te ayudo a montar tus muebles. Yo pongo las herramientas, tú pones la paciencia y unas cañas.', ARRAY['🔨'], null, null, null, extensions.st_setsrid(extensions.st_makepoint(2.1995, 41.3988), 4326)::extensions.geography, 'active', now() - interval '5 days'),
  ('33333333-3333-4333-8333-000000000007', '11111111-1111-4111-8111-000000000003', 'skill', 'rent', 'skills', 'Clases de conversación en inglés', 'Profesora nativa de inglés. Clases de una hora para practicar conversación a cualquier nivel.', ARRAY['🗣️'], 2000, null, 'hour', extensions.st_setsrid(extensions.st_makepoint(2.2025, 41.4008), 4326)::extensions.geography, 'active', now() - interval '6 days'),
  ('33333333-3333-4333-8333-000000000008', '11111111-1111-4111-8111-000000000002', 'tool', 'rent', 'power_tools', 'Sierra circular inalámbrica', 'Sierra circular 18V con dos baterías y guía. Para cortes de madera precisos.', ARRAY['🪚'], 1200, 6000, 'day', extensions.st_setsrid(extensions.st_makepoint(2.1962, 41.4045), 4326)::extensions.geography, 'active', now() - interval '7 days'),
  ('33333333-3333-4333-8333-000000000009', '11111111-1111-4111-8111-000000000004', 'equipment', 'free', 'sports_camping', 'Tienda de campaña 4 personas', 'Tienda Quechua 4 plazas, la monté dos veces. Perfecta para escapadas de finde.', ARRAY['⛺'], null, null, null, extensions.st_setsrid(extensions.st_makepoint(2.2078, 41.3968), 4326)::extensions.geography, 'active', now() - interval '8 days'),
  ('33333333-3333-4333-8333-00000000000a', '11111111-1111-4111-8111-000000000005', 'service', 'rent', 'home_cleaning', 'Limpieza a fondo de casa', 'Servicio de limpieza profunda. Traigo mis propios productos ecológicos.', ARRAY['🧽'], 1500, null, 'hour', extensions.st_setsrid(extensions.st_makepoint(2.2005, 41.4021), 4326)::extensions.geography, 'active', now() - interval '9 days'),
  ('33333333-3333-4333-8333-00000000000b', '11111111-1111-4111-8111-000000000002', 'equipment', 'free', 'party_events', 'Barbacoa portátil de carbón', 'Barbacoa plegable de carbón para 6 personas. Suelta y recogida de la misma zona.', ARRAY['🍖'], null, null, null, extensions.st_setsrid(extensions.st_makepoint(2.1958, 41.3955), 4326)::extensions.geography, 'active', now() - interval '10 days'),
  ('33333333-3333-4333-8333-00000000000c', '11111111-1111-4111-8111-000000000001', 'service', 'rent', 'help_time', 'Ayuda con mudanzas', 'Te echo una mano con la mudanza. Fuerte y con furgoneta propia previo aviso.', ARRAY['📦'], 3000, null, 'hour', extensions.st_setsrid(extensions.st_makepoint(2.1888, 41.3982), 4326)::extensions.geography, 'active', now() - interval '11 days'),
  ('33333333-3333-4333-8333-00000000000d', '11111111-1111-4111-8111-000000000003', 'tool', 'free', 'electronics', 'Máquina de coser', 'Máquina de coser Singer con instrucciones. Para arreglos y proyectos de costura.', ARRAY['🧵'], null, null, null, extensions.st_setsrid(extensions.st_makepoint(2.2042, 41.4029), 4326)::extensions.geography, 'active', now() - interval '12 days'),
  ('33333333-3333-4333-8333-00000000000e', '11111111-1111-4111-8111-000000000004', 'equipment', 'free', 'garden_outdoors', 'Carretilla de jardín', 'Carretilla metálica para tierra, escombros u hojas. Recogida en el portal.', ARRAY['🛒'], null, null, null, extensions.st_setsrid(extensions.st_makepoint(2.2095, 41.4004), 4326)::extensions.geography, 'active', now() - interval '13 days')
on conflict (id) do nothing;

update public.listings set city_id = (select id from public.cities where slug = 'barcelona') where city_id is null;

-- ---------------------------------------------------------------------------
-- Feed posts
-- ---------------------------------------------------------------------------
insert into public.posts (id, author_id, body, listing_id, visibility, created_at)
values
  ('44444444-4444-4444-8444-000000000001', '11111111-1111-4111-8111-000000000001', '¿Alguien tiene un nivel láser? Necesito colgar unos cuadros y no me fío de mi pulso. 🙃', null, 'city', now() - interval '3 hours'),
  ('44444444-4444-4444-8444-000000000002', '11111111-1111-4111-8111-000000000004', 'Acabo de subir mi bici de carga al barrio. ¡Que no os dé miedo pedírmela para la compra del sábado!', '33333333-3333-4333-8333-000000000003', 'city', now() - interval '7 hours'),
  ('44444444-4444-4444-8444-000000000003', '11111111-1111-4111-8111-000000000005', 'Gracias a Jordi por dejarme el proyector para el cine de verano en la azotea. Repetimos seguro. 🍿', '33333333-3333-4333-8333-000000000004', 'city', now() - interval '26 hours'),
  ('44444444-4444-4444-8444-000000000004', '11111111-1111-4111-8111-000000000003', 'Busco escalera para pintar el pasillo este finde. Devuelvo con un brownie casero de propina. 🍫', null, 'city', now() - interval '40 hours')
on conflict (id) do nothing;

update public.posts set city_id = (select id from public.cities where slug = 'barcelona') where city_id is null;

-- ---------------------------------------------------------------------------
-- Completed borrows (returned) — one per review below
-- ---------------------------------------------------------------------------
insert into public.requests (id, listing_id, requester_id, owner_id, status, message, start_date, end_date, agreed_price_cents, agreed_deposit_cents, picked_up_at, returned_at, created_at)
values
  ('55555555-5555-4555-8555-000000000001', '33333333-3333-4333-8333-000000000001', '11111111-1111-4111-8111-000000000002', '11111111-1111-4111-8111-000000000001', 'returned', '¿Me lo dejas el sábado?', now() - interval '30 days', now() - interval '29 days', null, null, now() - interval '30 days', now() - interval '29 days', now() - interval '31 days'),
  ('55555555-5555-4555-8555-000000000002', '33333333-3333-4333-8333-000000000006', '11111111-1111-4111-8111-000000000005', '11111111-1111-4111-8111-000000000001', 'returned', 'Nos vemos el jueves', now() - interval '25 days', now() - interval '24 days', null, null, now() - interval '25 days', now() - interval '24 days', now() - interval '26 days'),
  ('55555555-5555-4555-8555-000000000003', '33333333-3333-4333-8333-000000000004', '11111111-1111-4111-8111-000000000004', '11111111-1111-4111-8111-000000000002', 'returned', 'Para el cine de verano', now() - interval '22 days', now() - interval '21 days', 2500, 8000, now() - interval '22 days', now() - interval '21 days', now() - interval '23 days'),
  ('55555555-5555-4555-8555-000000000004', '33333333-3333-4333-8333-000000000008', '11111111-1111-4111-8111-000000000003', '11111111-1111-4111-8111-000000000002', 'returned', 'Necesito cortar unos listones', now() - interval '20 days', now() - interval '19 days', 1200, 6000, now() - interval '20 days', now() - interval '19 days', now() - interval '21 days'),
  ('55555555-5555-4555-8555-000000000005', '33333333-3333-4333-8333-000000000002', '11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000003', 'returned', 'Para pintar el pasillo', now() - interval '15 days', now() - interval '14 days', null, null, now() - interval '15 days', now() - interval '14 days', now() - interval '16 days'),
  ('55555555-5555-4555-8555-000000000006', '33333333-3333-4333-8333-000000000003', '11111111-1111-4111-8111-000000000005', '11111111-1111-4111-8111-000000000004', 'returned', 'Mini mudanza al piso nuevo', now() - interval '12 days', now() - interval '11 days', 1800, 5000, now() - interval '12 days', now() - interval '11 days', now() - interval '13 days'),
  ('55555555-5555-4555-8555-000000000007', '33333333-3333-4333-8333-000000000005', '11111111-1111-4111-8111-000000000002', '11111111-1111-4111-8111-000000000005', 'returned', 'Paella para 20', now() - interval '9 days', now() - interval '8 days', 1500, 4000, now() - interval '9 days', now() - interval '8 days', now() - interval '10 days'),
  ('55555555-5555-4555-8555-000000000008', '33333333-3333-4333-8333-00000000000a', '11111111-1111-4111-8111-000000000003', '11111111-1111-4111-8111-000000000005', 'returned', 'Limpieza de fin de alquiler', now() - interval '7 days', now() - interval '6 days', 1500, null, now() - interval '7 days', now() - interval '6 days', now() - interval '8 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Two-way reviews (the trigger keeps profile rating/review_count in sync)
-- ---------------------------------------------------------------------------
insert into public.reviews (id, request_id, reviewer_id, reviewee_id, rating, comment, created_at)
values
  ('77777777-7777-4777-8777-000000000001', '55555555-5555-4555-8555-000000000001', '11111111-1111-4111-8111-000000000002', '11111111-1111-4111-8111-000000000001', 5, 'Marta me dejó el taladro al instante y todo perfecto. ¡Repetiré!', now() - interval '28 days'),
  ('77777777-7777-4777-8777-000000000002', '55555555-5555-4555-8555-000000000002', '11111111-1111-4111-8111-000000000005', '11111111-1111-4111-8111-000000000001', 5, 'Súper amable y flexible con los horarios de recogida.', now() - interval '23 days'),
  ('77777777-7777-4777-8777-000000000003', '55555555-5555-4555-8555-000000000003', '11111111-1111-4111-8111-000000000004', '11111111-1111-4111-8111-000000000002', 5, 'El proyector funcionaba genial y Jordi explica todo lo necesario.', now() - interval '20 days'),
  ('77777777-7777-4777-8777-000000000004', '55555555-5555-4555-8555-000000000004', '11111111-1111-4111-8111-000000000003', '11111111-1111-4111-8111-000000000002', 4, 'Todo bien, aunque la sierra venía sin una hoja de repuesto.', now() - interval '18 days'),
  ('77777777-7777-4777-8777-000000000005', '55555555-5555-4555-8555-000000000005', '11111111-1111-4111-8111-000000000001', '11111111-1111-4111-8111-000000000003', 5, 'Las clases de inglés son dinámicas y muy útiles. Muy recomendable.', now() - interval '13 days'),
  ('77777777-7777-4777-8777-000000000006', '55555555-5555-4555-8555-000000000006', '11111111-1111-4111-8111-000000000005', '11111111-1111-4111-8111-000000000004', 5, 'La bici de carga salvó mi mudanza. Sam es un crack.', now() - interval '10 days'),
  ('77777777-7777-4777-8777-000000000007', '55555555-5555-4555-8555-000000000007', '11111111-1111-4111-8111-000000000002', '11111111-1111-4111-8111-000000000005', 5, 'El kit de paella estaba impecable y trae de todo.', now() - interval '7 days'),
  ('77777777-7777-4777-8777-000000000008', '55555555-5555-4555-8555-000000000008', '11111111-1111-4111-8111-000000000003', '11111111-1111-4111-8111-000000000005', 5, 'Dejó la casa reluciente. Puntual y muy profesional.', now() - interval '5 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Reactions — every other neighbour likes each post
-- ---------------------------------------------------------------------------
insert into public.reactions (post_id, user_id, kind)
select p.id, u.id, 'like'
from public.posts p
cross join (values
  ('11111111-1111-4111-8111-000000000001'::uuid),
  ('11111111-1111-4111-8111-000000000002'::uuid),
  ('11111111-1111-4111-8111-000000000003'::uuid),
  ('11111111-1111-4111-8111-000000000004'::uuid),
  ('11111111-1111-4111-8111-000000000005'::uuid)
) as u(id)
where u.id <> p.author_id
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Comments on the seeded posts
-- ---------------------------------------------------------------------------
insert into public.comments (id, post_id, author_id, body, created_at)
values
  ('88888888-8888-4888-8888-000000000001', '44444444-4444-4444-8444-000000000001', '11111111-1111-4111-8111-000000000002', 'Yo tengo uno, te lo dejo cuando quieras.', now() - interval '2 hours'),
  ('88888888-8888-4888-8888-000000000002', '44444444-4444-4444-8444-000000000001', '11111111-1111-4111-8111-000000000003', 'Y yo un trípode, por si te sirve.', now() - interval '90 minutes'),
  ('88888888-8888-4888-8888-000000000003', '44444444-4444-4444-8444-000000000002', '11111111-1111-4111-8111-000000000005', '¡Qué buena idea para la compra del sábado!', now() - interval '6 hours'),
  ('88888888-8888-4888-8888-000000000004', '44444444-4444-4444-8444-000000000002', '11111111-1111-4111-8111-000000000002', 'Te la pido el finde si sigue libre.', now() - interval '5 hours'),
  ('88888888-8888-4888-8888-000000000005', '44444444-4444-4444-8444-000000000003', '11111111-1111-4111-8111-000000000001', '¡Qué envidia de cine en la azotea!', now() - interval '20 hours'),
  ('88888888-8888-4888-8888-000000000006', '44444444-4444-4444-8444-000000000003', '11111111-1111-4111-8111-000000000004', 'Repetimos el mes que viene, ¿no?', now() - interval '18 hours'),
  ('88888888-8888-4888-8888-000000000007', '44444444-4444-4444-8444-000000000004', '11111111-1111-4111-8111-000000000005', 'Yo tengo una de cuatro peldaños, te la presto.', now() - interval '30 hours'),
  ('88888888-8888-4888-8888-000000000008', '44444444-4444-4444-8444-000000000004', '11111111-1111-4111-8111-000000000001', 'Y yo otra, escríbeme y te la acerco.', now() - interval '28 hours')
on conflict (id) do nothing;

