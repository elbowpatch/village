-- ============================================================
-- VILLAGE APP — SQL SEED (no Node.js required)
-- 
-- NOTE: This seeds PROFILES directly (bypasses auth.users FK).
-- The profiles will be visible in the app as post authors,
-- but you won't be able to sign in as them.
--
-- For full auth users + sign-in capability, use:
--   npm run seed   (requires SUPABASE_SERVICE_ROLE_KEY)
--
-- Run this AFTER running supabase-schema.sql
-- ============================================================

-- ── INSERT DEMO PROFILES ─────────────────────────────────────
-- Uses fixed UUIDs so posts can reference them reliably

INSERT INTO profiles (id, username, display_name, bio, avatar_letter, avatar_color, verified, followers_count, following_count, posts_count, created_at)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'kai_nakamura',  'Kai Nakamura',  'Generative artist & ML researcher. Building at the intersection of code and canvas. Tokyo → SF.',          'K', '135deg,#6c47ff,#ff5c8d', true,  84200, 1240, 847,  now() - interval '18 months'),
  ('a0000001-0000-0000-0000-000000000002', 'luna_vasquez',  'Luna Vasquez',  'Remote digital artist 🎨 Coffee addict. Posting sunrises and late-night renders. Barcelona.',             'L', '135deg,#ff8c42,#ff5c8d', false, 23400, 890,  412,  now() - interval '14 months'),
  ('a0000001-0000-0000-0000-000000000003', 'zara_ellis',    'Zara Ellis',    'Product philosopher. Hot takes on UX, ambient computing, and the future of interfaces.',                   'Z', '135deg,#6c47ff,#00c8a0', true,  61000, 2100, 1203, now() - interval '22 months'),
  ('a0000001-0000-0000-0000-000000000004', 'neo_park',      'Neo Park',      'Founder @ Synthwave Labs. Ex-Google Brain. Making AI tools actually useful for creatives.',               'N', '135deg,#00c8a0,#6c47ff', true,  92100, 750,  534,  now() - interval '20 months'),
  ('a0000001-0000-0000-0000-000000000005', 'flux_design',   'Flux',          'Design systems nerd. Figma → code. I write about spacing, tokens, and why 8px matters.',                 'F', '135deg,#ff5c8d,#6c47ff', false, 18900, 1200, 289,  now() - interval '11 months'),
  ('a0000001-0000-0000-0000-000000000006', 'vera_okafor',   'Vera Okafor',   'Music producer + visual artist. Lagos vibes, global reach. Afrofuturism is not a genre, it''s a lifestyle.','V','135deg,#ff9500,#ff5c8d', false, 45600, 1890, 678, now() - interval '16 months'),
  ('a0000001-0000-0000-0000-000000000007', 'pix_studio',    'Pix Studio',    '3D artist & motion designer. Obsessed with light, texture, and render farms at 3am.',                    'P', '135deg,#5856d6,#00c8a0', false, 31200, 760,  234,  now() - interval '13 months'),
  ('a0000001-0000-0000-0000-000000000008', 'sol_bright',    'Sol Bright',    'Photographer & videographer. Chasing golden hour everywhere I go. Currently: Nairobi.',                  'S', '135deg,#ff8c42,#ff9500', false, 27800, 1100, 456,  now() - interval '9 months'),
  ('a0000001-0000-0000-0000-000000000009', 'rachel_chen',   'Rachel Chen',   'Venture partner @ Vertex. Building community around deep tech founders. MIT ''18.',                      'R', '135deg,#007aff,#5856d6', true,  78900, 890,  923,  now() - interval '24 months'),
  ('a0000001-0000-0000-0000-000000000010', 'marcus_osei',   'Marcus Osei',   'Full-stack dev & open source contributor. I ship things. Sometimes they work.',                          'M', '135deg,#34c759,#007aff', false, 12300, 2300, 178,  now() - interval '7 months'),
  ('a0000001-0000-0000-0000-000000000011', 'astra_nova',    'Astra Nova',    'Digital explorer · Art collector · Tech optimist. Building the future one pixel at a time.',             'A', '135deg,#6c47ff,#ff9500', true,  34100, 612,  1240, now() - interval '26 months'),
  ('a0000001-0000-0000-0000-000000000012', 'byte_wave',     'ByteWave',      'Data artist. I turn numbers into visuals that make people feel something. Sometimes confused for a bot.', 'B', '135deg,#007aff,#00c8a0', false, 19800, 1450, 312,  now() - interval '10 months'),
  ('a0000001-0000-0000-0000-000000000013', 'nadia_mbeki',   'Nadia Mbeki',   'Journalist & storyteller. Covering tech, climate, and culture across Africa. Words matter.',             'N', '135deg,#ff2d55,#ff9500', true,  56700, 1230, 734,  now() - interval '19 months'),
  ('a0000001-0000-0000-0000-000000000014', 'electravoid',   'ElectraVoid',   'Generative art, emotional landscapes. Each piece is a one-of-a-kind digital experience.',               'E', '135deg,#1a0533,#6c47ff', false, 24000, 890,  47,   now() - interval '15 months'),
  ('a0000001-0000-0000-0000-000000000015', 'jay_solomon',   'Jay Solomon',   'Startup advisor, angel investor. Prev: 3x founder. Current obsession: AI-native products.',             'J', '135deg,#ff9500,#6c47ff', false, 43200, 1780, 567,  now() - interval '21 months')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  avatar_letter = EXCLUDED.avatar_letter,
  avatar_color = EXCLUDED.avatar_color,
  verified = EXCLUDED.verified,
  followers_count = EXCLUDED.followers_count,
  following_count = EXCLUDED.following_count,
  posts_count = EXCLUDED.posts_count;

-- ── INSERT 50 POSTS ─────────────────────────────────────────

INSERT INTO posts (author_id, content, likes_count, comments_count, reposts_count, created_at) VALUES

-- Kai Nakamura (3 posts)
('a0000001-0000-0000-0000-000000000001',
'Just dropped my latest generative art collection on Village Marketplace. Each piece took 6 months of training custom models on abstract expressionism datasets. The intersection of AI and creativity is absolutely mind-blowing right now — we''re only scratching the surface of what''s possible.',
847, 92, 156, now() - interval '2 hours'),

('a0000001-0000-0000-0000-000000000001',
'Hot take: the "AI kills creativity" discourse completely misunderstands what creativity actually is. Every artist has always used the tools of their time. The paintbrush was technology. The camera was technology. This is just the next one.

The question isn''t "will AI replace artists?" It''s "what becomes possible when every person has a capable creative collaborator?"',
1203, 218, 445, now() - interval '1 day'),

('a0000001-0000-0000-0000-000000000001',
'Three things I learned training my first diffusion model from scratch:

1. Your dataset quality matters 10x more than your architecture
2. Overfitting is obvious but undertraining is invisible until inference
3. The latent space is genuinely beautiful — visualise it early and often

Happy to do a deep dive thread if anyone''s interested 👇',
634, 87, 203, now() - interval '3 days'),

-- Luna Vasquez (3 posts)
('a0000001-0000-0000-0000-000000000002',
'My morning routine as a remote digital artist:

Wake up → coffee → check Village → see amazing art → feel inspired → make art → post on Village → repeat

This community genuinely pushes me to be better every single day. Thank you all. 🌅',
412, 67, 38, now() - interval '5 hours'),

('a0000001-0000-0000-0000-000000000002',
'Been painting digitally for 8 years and I still get that same feeling when a piece finally "clicks." The colours align, the composition breathes, and you just know. It never gets old.

Currently working on a 40-piece series exploring solitude in urban spaces. Preview dropping next week.',
289, 43, 22, now() - interval '4 days'),

('a0000001-0000-0000-0000-000000000002',
'Unpopular opinion: your first 1000 pieces of work will mostly be bad. And that''s not just okay — it''s the point. The path is the path.

I''ve been cleaning out my old hard drives and wow, early-2016 me was... trying very hard 😅 Growth is real.',
891, 134, 178, now() - interval '8 days'),

-- Zara Ellis (3 posts)
('a0000001-0000-0000-0000-000000000003',
'Hot take: The best interface is no interface.

The future of computing is ambient, contextual, and invisible. We''re moving toward a world where technology disappears into the background of daily life — and every friction point we''re building today is just scaffolding we''ll eventually tear down.',
1203, 284, 445, now() - interval '34 minutes'),

('a0000001-0000-0000-0000-000000000003',
'Spent 3 hours trying to explain "good UX" to a non-designer today. Eventually I said: "It''s when you don''t notice it." The confused look on their face told me everything about why this is so hard to teach.

Great design should be invisible. That''s also why it''s undervalued.',
567, 98, 112, now() - interval '2 days'),

('a0000001-0000-0000-0000-000000000003',
'Everyone''s talking about AI features. Nobody''s talking about AI debt — the hidden costs of making decisions that seemed correct 6 months ago and are now actively wrong.

The companies that survive the next wave won''t be the ones who moved fastest. They''ll be the ones who left enough room to be wrong.',
934, 176, 234, now() - interval '6 days'),

-- Neo Park (3 posts)
('a0000001-0000-0000-0000-000000000004',
'We just crossed $1M ARR at Synthwave Labs. 14 months in. No VC. Profitable from month 6.

The unsexy truth: we just kept shipping, kept listening to users, and refused to optimise for metrics that didn''t matter. That''s it. That''s the playbook.',
2341, 318, 891, now() - interval '1 hour'),

('a0000001-0000-0000-0000-000000000004',
'BREAKING from the AI frontier: GPT-7 benchmarks leaked and the reasoning scores are not human-level. They''re above it — on every tested domain. We''re entering genuinely uncharted territory and I don''t think most people have processed what that actually means for their work.',
3102, 891, 1456, now() - interval '3 hours'),

('a0000001-0000-0000-0000-000000000004',
'The best founders I know share one trait: they''re more curious than they are afraid.

Not fearless — curious. Fear is information. But letting curiosity drive faster than fear holds back? That''s the whole game.',
1456, 203, 389, now() - interval '5 days'),

-- Flux (2 posts)
('a0000001-0000-0000-0000-000000000005',
'Reminder that "clean design" and "minimal design" are not the same thing.

Clean = intentional, purposeful, nothing wasted
Minimal = less stuff on screen

You can have a dense, information-rich UI that is beautifully clean. And you can have a sparse UI that is absolute chaos. Restraint is a choice, not a style.',
876, 122, 234, now() - interval '7 hours'),

('a0000001-0000-0000-0000-000000000005',
'We shipped dark mode at 11pm on a Friday and woke up to 400 messages saying it was the best update we''d ever made.

Sometimes the feature people say they want ("better search," "more filters") is just displacement for the thing they actually want ("I want to use this comfortably at night").

Listen beneath the feature request.',
1567, 234, 445, now() - interval '9 days'),

-- Vera Okafor (3 posts)
('a0000001-0000-0000-0000-000000000006',
'Finished the final mix on my new EP at 4am and just lay on the studio floor staring at the ceiling for 20 minutes.

Not out of exhaustion — out of that strange quiet that comes when you finish something that took everything you had. It''s out in 3 weeks. I can''t wait to share it.',
723, 156, 134, now() - interval '6 hours'),

('a0000001-0000-0000-0000-000000000006',
'Afrofuturism isn''t a genre. It''s a framework for imagining futures where we don''t just survive — we thrive, we lead, we build.

Every time I make music, I''m making an argument about what tomorrow could look like. That''s the whole point.',
1567, 234, 456, now() - interval '4 days'),

('a0000001-0000-0000-0000-000000000006',
'The Nairobi music scene is doing something that I think most of the world doesn''t know about yet: fusing traditional acoustic instruments with modular synthesis in ways that genuinely don''t sound like anything else.

Keep an eye on what''s coming out of East Africa in the next 18 months. You''ll thank me later.',
1456, 234, 345, now() - interval '11 days'),

-- Pix Studio (3 posts)
('a0000001-0000-0000-0000-000000000007',
'After 72 hours of render time, the piece is done. 847 frames. 4K. Volumetric lighting that took me 3 weeks to figure out.

Sometimes I wonder if anyone will notice the details I agonise over. Then I remember: I''ll notice. And that''s enough.',
534, 89, 112, now() - interval '12 hours'),

('a0000001-0000-0000-0000-000000000007',
'The difference between okay 3D and incredible 3D is almost always: subsurface scattering, ambient occlusion, and the courage to add imperfection.

Real objects aren''t perfect. Real light doesn''t cooperate. The moment you stop fighting that and start working with it, everything changes.',
678, 112, 145, now() - interval '3 days'),

('a0000001-0000-0000-0000-000000000007',
'Real talk: the 3D art community on Village is quietly becoming the best corner of the internet.

No algorithm chasing. No engagement bait. Just people who care deeply about craft sharing work and feedback with each other. This is what every platform promised to be.',
678, 123, 134, now() - interval '7 days'),

-- Sol Bright (3 posts)
('a0000001-0000-0000-0000-000000000008',
'Golden hour in Nairobi hits different when the whole city is glowing and everyone slows down for just a moment.

I''ve photographed sunsets on 4 continents and nothing has come close to a Nairobi evening sky. Something about the altitude and the dust and the light. Impossible to describe, have to be there.',
1123, 167, 234, now() - interval '2 hours'),

('a0000001-0000-0000-0000-000000000008',
'Film or digital? Yes.

I shoot both. I love both. Film for the ritual, the patience, the grain. Digital for the speed, the control, the instant feedback.

The "film vs digital" debate is the most boring conversation in photography. Shoot with whatever helps you see better.',
445, 203, 89, now() - interval '5 days'),

('a0000001-0000-0000-0000-000000000008',
'Just got back from 2 weeks documenting street artists across East Africa for a gallery project. The scale and quality of public art in cities like Kampala and Mombasa is genuinely world-class and almost completely unknown outside the continent.

That changes soon. Stay tuned. 📷',
867, 134, 178, now() - interval '12 days'),

-- Rachel Chen (3 posts)
('a0000001-0000-0000-0000-000000000009',
'Met 40 founders this month. The ones I wanted to back all shared something: they could articulate exactly what they were wrong about 6 months ago — and why they were wrong — with zero defensiveness.

Self-awareness at speed is the most underrated founder skill.',
1890, 267, 567, now() - interval '45 minutes'),

('a0000001-0000-0000-0000-000000000009',
'Quantum computing hitting 1M qubit coherence for 10 seconds is not a footnote. It''s a chapter break.

We are moving from "quantum is theoretically interesting" to "quantum breaks assumptions in production systems." The infrastructure implications alone will occupy a generation of engineers.',
2105, 445, 678, now() - interval '2 days'),

('a0000001-0000-0000-0000-000000000009',
'Things that do not scale:
- Heroics
- Tribal knowledge
- Founder decision-making on everything
- "We''ll fix the culture later"

Things that do scale:
- Systems
- Documentation
- Clear principles
- Hiring people who hire better than you

The switch between lists is the hardest transition in any company''s life.',
3421, 512, 1102, now() - interval '8 days'),

-- Marcus Osei (3 posts)
('a0000001-0000-0000-0000-000000000010',
'Shipped a thing I''ve been quietly building for 4 months. It''s a zero-config way to add end-to-end typesafety to any API response in under 5 minutes. No code generation. No schemas to write.

Link in bio. It''s free. Always will be. Stars appreciated but not required 🙏',
456, 123, 89, now() - interval '4 hours'),

('a0000001-0000-0000-0000-000000000010',
'Hot take: the senior dev who writes less code is usually more valuable than the one who writes more.

The best code is the code you don''t write. The best feature is the one you delete. The best refactor is the one that makes the system simpler, not more clever.',
1234, 189, 345, now() - interval '3 days'),

('a0000001-0000-0000-0000-000000000010',
'There is no "right" way to start learning to code. There is only starting.

Take the tutorial. Build the thing. Break the thing. Fix it. Look at how someone else fixed it. Ask why theirs is different. Repeat for 10 years.

Anyone telling you there''s a better path is selling something.',
2109, 345, 567, now() - interval '10 days'),

-- Astra Nova (3 posts)
('a0000001-0000-0000-0000-000000000011',
'The digital art market just did something I didn''t expect: a single generative piece sold for $28M at auction.

Not because of hype. Because of provenance, because of community, because of story. The art world is slowly figuring out that value has always been social. Blockchain just made that legible.',
1567, 234, 389, now() - interval '1 hour'),

('a0000001-0000-0000-0000-000000000011',
'Collected my 100th digital artwork today. Wrote a long thread about what I''ve learned but then deleted it.

Actually the whole thing can be summarised: buy what moves you. Don''t buy what you think will go up. The second approach has made every collector I know miserable.',
789, 145, 167, now() - interval '4 days'),

('a0000001-0000-0000-0000-000000000011',
'Village is something I didn''t know I needed until I had it.

A platform where the art crowd and the tech crowd and the music crowd and the culture crowd all exist in the same space, talking to each other. Cross-pollination is where the interesting things happen.',
445, 78, 89, now() - interval '9 days'),

-- ByteWave (3 posts)
('a0000001-0000-0000-0000-000000000012',
'Visualised 10 years of climate data last night and I can''t stop staring at it.

The patterns are beautiful and terrifying simultaneously. There is something about seeing change rendered spatially — as colour, as movement, as shape — that hits differently than a chart with a trend line.',
923, 134, 189, now() - interval '3 hours'),

('a0000001-0000-0000-0000-000000000012',
'Data visualisation principle I keep coming back to: the first job of a chart is to not lie.

The second job is to tell a true story clearly.

The third job — which most people skip — is to make the reader feel something about the true story they just understood.',
1102, 178, 256, now() - interval '6 days'),

('a0000001-0000-0000-0000-000000000012',
'I ran every post I''ve made in the last 2 years through a sentiment analyser as an experiment.

Turns out when I''m most uncertain about my work, I post most confidently. When I''m most confident, I stay quiet.

I don''t know what to do with that but it felt important to share.',
1234, 198, 289, now() - interval '13 days'),

-- Nadia Mbeki (3 posts)
('a0000001-0000-0000-0000-000000000013',
'The tech story coming out of Africa right now is not "Africa is catching up." It''s "Africa is solving problems at a speed and scale the rest of the world is only beginning to understand."

M-Pesa launched before most Western fintechs existed. The narrative needs to change.',
2341, 456, 891, now() - interval '30 minutes'),

('a0000001-0000-0000-0000-000000000013',
'Spent a week embedded with a team building medical diagnostic AI for low-resource clinical settings in rural Kenya. No reliable electricity. Intermittent connectivity. Devices from 2015.

The constraints didn''t stop them. The constraints made the solution better. I am writing about this for a year.',
1876, 312, 567, now() - interval '5 days'),

('a0000001-0000-0000-0000-000000000013',
'"Covering Africa" as if it''s one place with one story is one of journalism''s laziest habits.

54 countries. 2000+ languages. 1.4 billion people. The diversity of economic conditions, political systems, cultural practices, and technological development is staggering.

I am always a journalist from Africa. I am never a journalist covering "Africa."',
3102, 567, 1102, now() - interval '14 days'),

-- ElectraVoid (3 posts)
('a0000001-0000-0000-0000-000000000014',
'New series: "Liminal Architectures." 12 pieces. Each one is a structure that exists between states — not quite building, not quite landscape, not quite memory.

I''ve been working on the training data for this for 8 months. The model has learned to dream in thresholds. It''s exactly what I hoped for and nothing like what I expected.',
734, 112, 156, now() - interval '8 hours'),

('a0000001-0000-0000-0000-000000000014',
'Someone asked how I decide when a piece is "done."

I never decide. The piece tells me. When I stop changing things because I want to improve it and start changing things because I''m afraid to stop — that''s when I know it''s done.

Fear of completion is the real enemy, not perfectionism.',
1023, 167, 234, now() - interval '4 days'),

('a0000001-0000-0000-0000-000000000014',
'The thing nobody tells you about generative art:

The algorithm is a collaborator, not a tool. You bring the intention. It brings the surprise. The best work happens when you''re genuinely willing to be changed by what it makes.

If you only accept outputs that match your vision exactly, you''re using it wrong.',
891, 145, 189, now() - interval '10 days'),

-- Jay Solomon (4 posts)
('a0000001-0000-0000-0000-000000000015',
'The founders who build in public early — sharing failures, sharing thinking, sharing process — almost always build better products than those who don''t.

It''s not about marketing. It''s about accountability, feedback loops, and the strange clarity that comes from explaining your decisions to people who didn''t make them with you.',
1345, 234, 345, now() - interval '2 hours'),

('a0000001-0000-0000-0000-000000000015',
'Watching the AI infra market right now is like watching the cloud market in 2008. The picks-and-shovels play is obvious in retrospect and yet most people are still buying the mining companies.

GPU compute, inference optimisation, evaluation tooling. That''s where I''m spending time.',
2109, 389, 678, now() - interval '3 days'),

('a0000001-0000-0000-0000-000000000015',
'Three questions I ask every founder in the first 10 minutes:

1. What would have to be true for this to be a $10B company?
2. What do your first 100 customers have in common that you didn''t predict?
3. What''s the thing you''re most worried about that you haven''t told your investors?

Question 3 is the whole meeting.',
3456, 678, 1234, now() - interval '7 days'),

('a0000001-0000-0000-0000-000000000015',
'Spent the morning with a 19-year-old founder who built something with 80K users and no funding and has no interest in VC.

She said: "I just want to keep making something people love. Why would I trade that for a growth target I don''t believe in?"

I didn''t have an answer. I''m still thinking about it.',
4123, 891, 1456, now() - interval '15 days');

-- ── FOLLOWS (organic follow graph) ───────────────────────────

INSERT INTO follows (follower_id, following_id, created_at)
SELECT f.follower_id, f.following_id, now() - (random() * interval '200 days')
FROM (VALUES
  ('a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000004'),
  ('a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000009'),
  ('a0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000014'),
  ('a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001'),
  ('a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000006'),
  ('a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000007'),
  ('a0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000011'),
  ('a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004'),
  ('a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000009'),
  ('a0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000015'),
  ('a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001'),
  ('a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000009'),
  ('a0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000015'),
  ('a0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000001'),
  ('a0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000003'),
  ('a0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000007'),
  ('a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002'),
  ('a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000008'),
  ('a0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000013'),
  ('a0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000001'),
  ('a0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000014'),
  ('a0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000006'),
  ('a0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000013'),
  ('a0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004'),
  ('a0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000015'),
  ('a0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000001'),
  ('a0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000003'),
  ('a0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000004'),
  ('a0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000001'),
  ('a0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000014'),
  ('a0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000001'),
  ('a0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000013'),
  ('a0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000006'),
  ('a0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000008'),
  ('a0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000001'),
  ('a0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000007'),
  ('a0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000004'),
  ('a0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000009')
) AS f(follower_id, following_id)
ON CONFLICT DO NOTHING;

-- ── ARTWORKS ─────────────────────────────────────────────────

INSERT INTO artworks (artist_id, title, description, emoji, gradient, price_usd, category, likes_count, created_at)
VALUES
  ('a0000001-0000-0000-0000-000000000014', 'Nebula Dreams #001',    'Original generative piece. Certificate of authenticity provided.',                                'nebula',  '135deg,#1a0533,#2d1060', 420.00,  'Generative',  1200, now() - interval '20 days'),
  ('a0000001-0000-0000-0000-000000000014', 'Liminal Structure #1',  'From the Liminal Architectures series. 8 months of training data.',                               'rocket',  '135deg,#0d1a33,#1a2d66', 560.00,  'Generative',  734,  now() - interval '3 days'),
  ('a0000001-0000-0000-0000-000000000014', 'Threshold Series #3',   'Exploring states of becoming. Part of a 12-piece collection.',                                    'star',    '135deg,#330022,#660044', 320.00,  'Generative',  967,  now() - interval '15 days'),
  ('a0000001-0000-0000-0000-000000000007', 'Chrome Bloom',          '3D render. Procedural geometry + custom HDRI. 72hrs render time.',                                'crystal', '135deg,#003333,#006655', 180.00,  '3D',           843,  now() - interval '8 days'),
  ('a0000001-0000-0000-0000-000000000007', 'Void Architecture I',   'Brutalist 3D structure. Volumetric lighting. 4K. Edition of 1.',                                  'city',    '135deg,#0d0d1a,#1a1a33', 550.00,  '3D',           1456, now() - interval '25 days'),
  ('a0000001-0000-0000-0000-000000000012', 'Ocean Data',            'Climate data rendered as a fluid simulation. 10 years of ocean temperature change.',              'wave',    '135deg,#001a33,#003366', 750.00,  'Generative',  2100, now() - interval '12 days'),
  ('a0000001-0000-0000-0000-000000000012', 'Climate Lattice',       'A 3D lattice representing carbon concentration data, 1970-2024.',                                 'globe',   '135deg,#001a20,#003333', 640.00,  'Generative',  890,  now() - interval '6 days'),
  ('a0000001-0000-0000-0000-000000000001', 'Latent Space No. 7',    'Direct visualisation of a fine-tuned diffusion model''s latent space. 1 of 1.',                   'palette', '135deg,#2d0a4a,#1a0533', 890.00,  'Generative',  1890, now() - interval '30 days'),
  ('a0000001-0000-0000-0000-000000000002', 'Urban Solitude IV',     'From the Urban Solitude series. Digital painting, 8hrs. Explores isolation in crowded spaces.',   'city',    '135deg,#1a1a2e,#2d2d44', 280.00,  'Digital',      478,  now() - interval '18 days'),
  ('a0000001-0000-0000-0000-000000000002', 'Digital Flora',         'Organic forms, synthetic colour. Digital painting celebrating natural patterns.',                  'flower',  '135deg,#330011,#660022', 150.00,  'Digital',      634,  now() - interval '40 days'),
  ('a0000001-0000-0000-0000-000000000011', 'Stardust Protocol',     'Mixed media digital. Collected for the Village inaugural gallery.',                                'star',    '135deg,#1a0533,#3d1a6e', 320.00,  'Digital',      967,  now() - interval '22 days'),
  ('a0000001-0000-0000-0000-000000000008', 'Golden Hour Nairobi',   'Limited edition print. Shot on medium format. Nairobi at dusk. Edition 1/10.',                    'sunrise', '135deg,#331900,#663300', 400.00,  'Photography',  1234, now() - interval '5 days')
ON CONFLICT DO NOTHING;

-- ── QUICK COMMENTS (sample) ────────────────────────────────────

-- Get a few post IDs and add comments to them
DO $$
DECLARE
  post_ids uuid[];
  p_id uuid;
  commenters uuid[] := ARRAY[
    'a0000001-0000-0000-0000-000000000002'::uuid,
    'a0000001-0000-0000-0000-000000000003'::uuid,
    'a0000001-0000-0000-0000-000000000004'::uuid,
    'a0000001-0000-0000-0000-000000000009'::uuid,
    'a0000001-0000-0000-0000-000000000015'::uuid
  ];
  sample_comments text[] := ARRAY[
    'This is exactly where things are heading 🔥',
    'Needed to hear this today',
    'Saved this — reading again tomorrow',
    'Real. We talk about this at the company constantly',
    'The craft shows in every detail',
    'Completely agree with every word',
    'More of this please 👏',
    'This hit different today',
    'Been thinking about exactly this for months',
    'Sharing with my whole team'
  ];
BEGIN
  -- Get first 10 posts
  SELECT ARRAY(SELECT id FROM posts ORDER BY created_at DESC LIMIT 10) INTO post_ids;

  FOREACH p_id IN ARRAY post_ids LOOP
    -- Add 2–3 comments per post
    FOR i IN 1..3 LOOP
      INSERT INTO comments (post_id, author_id, content, created_at)
      VALUES (
        p_id,
        commenters[(floor(random() * array_length(commenters, 1)) + 1)::int],
        sample_comments[(floor(random() * array_length(sample_comments, 1)) + 1)::int],
        now() - (random() * interval '12 hours')
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── DONE ─────────────────────────────────────────────────────
SELECT 
  (SELECT count(*) FROM profiles WHERE id LIKE 'a0000001%') as profiles_seeded,
  (SELECT count(*) FROM posts) as total_posts,
  (SELECT count(*) FROM artworks) as total_artworks,
  (SELECT count(*) FROM follows WHERE follower_id LIKE 'a0000001%') as follow_relationships;
