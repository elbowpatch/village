/**
 * VILLAGE — SEED SCRIPT
 * Creates 15 organic-looking users + 50 posts + likes + comments
 *
 * Usage:
 *   1. Copy .env.local.example → .env.local and fill in your keys
 *   2. Run:  node scripts/seed.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env.local
let SUPABASE_URL, SERVICE_KEY
try {
  const env = readFileSync(resolve(__dir, '../.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k?.trim() === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = v.join('=').trim()
    if (k?.trim() === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_KEY = v.join('=').trim()
  }
} catch {
  SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
}

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Copy .env.local.example → .env.local and fill in your Supabase keys.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const USERS = [
  { username: 'kai_nakamura',   display_name: 'Kai Nakamura',     bio: 'Generative artist & ML researcher. Building at the intersection of code and canvas. Tokyo → SF.',      color: '135deg,#6c47ff,#ff5c8d', verified: true  },
  { username: 'luna_vasquez',   display_name: 'Luna Vasquez',     bio: 'Remote digital artist 🎨 Coffee addict. Posting sunrises and late-night renders. Barcelona.',           color: '135deg,#ff8c42,#ff5c8d', verified: false },
  { username: 'zara_ellis',     display_name: 'Zara Ellis',       bio: 'Product philosopher. Hot takes on UX, ambient computing, and the future of interfaces.',                 color: '135deg,#6c47ff,#00c8a0', verified: true  },
  { username: 'neo_park',       display_name: 'Neo Park',         bio: 'Founder @ Synthwave Labs. Ex-Google Brain. Making AI tools actually useful for creatives.',             color: '135deg,#00c8a0,#6c47ff', verified: true  },
  { username: 'flux_design',    display_name: 'Flux',             bio: 'Design systems nerd. Figma → code. I write about spacing, tokens, and why 8px matters.',               color: '135deg,#ff5c8d,#6c47ff', verified: false },
  { username: 'vera_okafor',    display_name: 'Vera Okafor',      bio: 'Music producer + visual artist. Lagos vibes, global reach. Afrofuturism is not a genre, it\'s a lifestyle.', color: '135deg,#ff9500,#ff5c8d', verified: false },
  { username: 'pix_studio',     display_name: 'Pix Studio',       bio: '3D artist & motion designer. Obsessed with light, texture, and render farms at 3am.',                   color: '135deg,#5856d6,#00c8a0', verified: false },
  { username: 'sol_bright',     display_name: 'Sol Bright',       bio: 'Photographer & videographer. Chasing golden hour everywhere I go. Currently: Nairobi.',                 color: '135deg,#ff8c42,#ff9500', verified: false },
  { username: 'rachel_chen',    display_name: 'Rachel Chen',      bio: 'Venture partner @ Vertex. Building community around deep tech founders. MIT \'18.',                     color: '135deg,#007aff,#5856d6', verified: true  },
  { username: 'marcus_osei',    display_name: 'Marcus Osei',      bio: 'Full-stack dev & open source contributor. I ship things. Sometimes they work.',                         color: '135deg,#34c759,#007aff', verified: false },
  { username: 'astra_nova',     display_name: 'Astra Nova',       bio: 'Digital explorer · Art collector · Tech optimist. Building the future one pixel at a time. ✓',         color: '135deg,#6c47ff,#ff9500', verified: true  },
  { username: 'byte_wave',      display_name: 'ByteWave',         bio: 'Data artist. I turn numbers into visuals that make people feel something. Sometimes confused for a bot.', color: '135deg,#007aff,#00c8a0', verified: false },
  { username: 'nadia_mbeki',    display_name: 'Nadia Mbeki',      bio: 'Journalist & storyteller. Covering tech, climate, and culture across Africa. Words matter.',            color: '135deg,#ff2d55,#ff9500', verified: true  },
  { username: 'electravoid',    display_name: 'ElectraVoid',      bio: 'Generative art, emotional landscapes. Each piece is a one-of-a-kind digital experience. Gallery @ EV.', color: '135deg,#1a0533,#6c47ff', verified: false },
  { username: 'jay_solomon',    display_name: 'Jay Solomon',      bio: 'Startup advisor, angel investor. Prev: 3x founder. Current obsession: AI-native products.',             color: '135deg,#ff9500,#6c47ff', verified: false },
]

const POST_TEMPLATES = [
  // Kai Nakamura — generative art / ML
  { user: 'kai_nakamura', content: `Just dropped my latest generative art collection on Village Marketplace. Each piece took 6 months of training custom models on abstract expressionism datasets. The intersection of AI and creativity is absolutely mind-blowing right now — we're only scratching the surface of what's possible.`, likes: 847, comments: 92 },
  { user: 'kai_nakamura', content: `Hot take: the "AI kills creativity" discourse completely misunderstands what creativity actually is. Every artist has always used the tools of their time. The paintbrush was technology. The camera was technology. This is just the next one.\n\nThe question isn't "will AI replace artists?" It's "what becomes possible when every person has a capable creative collaborator?"`, likes: 1203, comments: 218 },
  { user: 'kai_nakamura', content: `Three things I learned training my first diffusion model from scratch:\n\n1. Your dataset quality matters 10x more than your architecture\n2. Overfitting is obvious but undertraining is invisible until inference\n3. The latent space is genuinely beautiful — visualize it early and often\n\nHappy to do a deep dive thread if anyone's interested 👇`, likes: 634, comments: 87 },

  // Luna Vasquez — digital art / lifestyle
  { user: 'luna_vasquez', content: `My morning routine as a remote digital artist:\n\nWake up → coffee → check Village → see amazing art → feel inspired → make art → post on Village → repeat\n\nThis community genuinely pushes me to be better every single day. Thank you all. 🌅`, likes: 412, comments: 67 },
  { user: 'luna_vasquez', content: `Been painting digitally for 8 years and I still get that same feeling when a piece finally "clicks." The colours align, the composition breathes, and you just know. It never gets old.\n\nCurrently working on a 40-piece series exploring solitude in urban spaces. Preview dropping next week.`, likes: 289, comments: 43 },
  { user: 'luna_vasquez', content: `Unpopular opinion: your first 1000 pieces of work will mostly be bad. And that's not just okay — it's the point. The path is the path.\n\nI've been cleaning out my old hard drives and wow, early-2016 me was... trying very hard 😅 Growth is real.`, likes: 891, comments: 134 },

  // Zara Ellis — product philosophy / tech
  { user: 'zara_ellis', content: `Hot take: The best interface is no interface.\n\nThe future of computing is ambient, contextual, and invisible. We're moving toward a world where technology disappears into the background of daily life — and every friction point we're building today is just scaffolding we'll eventually tear down.`, likes: 1203, comments: 284 },
  { user: 'zara_ellis', content: `Spent 3 hours trying to explain "good UX" to a non-designer today. Eventually I said: "It's when you don't notice it." The confused look on their face told me everything about why this is so hard to teach.\n\nGreat design should be invisible. That's also why it's undervalued.`, likes: 567, comments: 98 },
  { user: 'zara_ellis', content: `Everyone's talking about AI features. Nobody's talking about AI debt — the hidden costs of making decisions that seemed correct 6 months ago and are now actively wrong.\n\nThe companies that survive the next wave won't be the ones who moved fastest. They'll be the ones who left enough room to be wrong.`, likes: 934, comments: 176 },

  // Neo Park — startup / AI tools
  { user: 'neo_park', content: `We just crossed $1M ARR at Synthwave Labs. 14 months in. No VC. Profitable from month 6.\n\nThe unsexy truth: we just kept shipping, kept listening to users, and refused to optimize for metrics that didn't matter. That's it. That's the playbook.`, likes: 2341, comments: 318 },
  { user: 'neo_park', content: `BREAKING from the AI frontier: GPT-7 benchmarks leaked and the reasoning scores are not human-level. They're above it — on every tested domain. We're entering genuinely uncharted territory and I don't think most people have processed what that actually means for their work.`, likes: 3102, comments: 891 },
  { user: 'neo_park', content: `The best founders I know share one trait: they're more curious than they are afraid.\n\nNot fearless — curious. Fear is information. But letting curiosity drive faster than fear holds back? That's the whole game.`, likes: 1456, comments: 203 },

  // Flux — design systems
  { user: 'flux_design', content: `Reminder that "clean design" and "minimal design" are not the same thing.\n\nClean = intentional, purposeful, nothing wasted\nMinimal = less stuff on screen\n\nYou can have a dense, information-rich UI that is beautifully clean. And you can have a sparse UI that is absolute chaos. Restraint is a choice, not a style.`, likes: 876, comments: 122 },
  { user: 'flux_design', content: `Design tokens are the best thing to happen to design systems in a decade and they're still massively underused outside big tech.\n\nIf your team is still hardcoding #1A1A2E and rgba(0,0,0,0.12) in components: please, I'm begging you, tokenize your primitives. Your future self will cry tears of joy.`, likes: 445, comments: 67 },

  // Vera Okafor — music / culture
  { user: 'vera_okafor', content: `Finished the final mix on my new EP at 4am and just lay on the studio floor staring at the ceiling for 20 minutes.\n\nNot out of exhaustion — out of that strange quiet that comes when you finish something that took everything you had. It's out in 3 weeks. I can't wait to share it.`, likes: 723, comments: 156 },
  { user: 'vera_okafor', content: `Afrofuturism isn't a genre. It's a framework for imagining futures where we don't just survive — we thrive, we lead, we build.\n\nEvery time I make music, I'm making an argument about what tomorrow could look like. That's the whole point.`, likes: 1567, comments: 234 },
  { user: 'vera_okafor', content: `Been sampling field recordings from Lagos markets, Nairobi streets, Accra festivals. The sonic texture of African cities is unmatched. Dense, layered, alive.\n\nWestern producers chase that "organic" sound for years. We grew up in it.`, likes: 891, comments: 178 },

  // Pix Studio — 3D / motion
  { user: 'pix_studio', content: `After 72 hours of render time, the piece is done. 847 frames. 4K. Volumetric lighting that took me 3 weeks to figure out.\n\nSometimes I wonder if anyone will notice the details I agonize over. Then I remember: I'll notice. And that's enough.`, likes: 534, comments: 89 },
  { user: 'pix_studio', content: `The difference between okay 3D and incredible 3D is almost always: subsurface scattering, ambient occlusion, and the courage to add imperfection.\n\nReal objects aren't perfect. Real light doesn't cooperate. The moment you stop fighting that and start working with it, everything changes.`, likes: 678, comments: 112 },

  // Sol Bright — photography
  { user: 'sol_bright', content: `Golden hour in Nairobi hits different when the whole city is glowing and everyone slows down for just a moment.\n\nI've photographed sunsets on 4 continents and nothing has come close to a Nairobi evening sky. Something about the altitude and the dust and the light. Impossible to describe, have to be there.`, likes: 1123, comments: 167 },
  { user: 'sol_bright', content: `Film or digital? Yes.\n\nI shoot both. I love both. Film for the ritual, the patience, the grain. Digital for the speed, the control, the instant feedback.\n\nThe "film vs digital" debate is the most boring conversation in photography. Shoot with whatever helps you see better.`, likes: 445, comments: 203 },
  { user: 'sol_bright', content: `Just got back from 2 weeks documenting street artists across East Africa for a gallery project. The scale and quality of public art in cities like Kampala and Mombasa is genuinely world-class and almost completely unknown outside the continent.\n\nThat changes soon. Stay tuned. 📷`, likes: 867, comments: 134 },

  // Rachel Chen — VC / deep tech
  { user: 'rachel_chen', content: `Met 40 founders this month. The ones I wanted to back all shared something: they could articulate exactly what they were wrong about 6 months ago — and why they were wrong — with zero defensiveness.\n\nSelf-awareness at speed is the most underrated founder skill.`, likes: 1890, comments: 267 },
  { user: 'rachel_chen', content: `Quantum computing hitting 1M qubit coherence for 10 seconds is not a footnote. It's a chapter break.\n\nWe are moving from "quantum is theoretically interesting" to "quantum breaks assumptions in production systems." The infrastructure implications alone will occupy a generation of engineers.`, likes: 2105, comments: 445 },
  { user: 'rachel_chen', content: `Things that do not scale:\n- Heroics\n- Tribal knowledge\n- Founder decision-making on everything\n- "We'll fix the culture later"\n\nThings that do scale:\n- Systems\n- Documentation\n- Clear principles\n- Hiring people who hire better than you\n\nThe switch between lists is the hardest transition in any company's life.`, likes: 3421, comments: 512 },

  // Marcus Osei — dev / open source
  { user: 'marcus_osei', content: `Shipped a thing I've been quietly building for 4 months. It's a zero-config way to add end-to-end typesafety to any API response in under 5 minutes. No code generation. No schemas to write.\n\nLink in bio. It's free. Always will be. Stars appreciated but not required 🙏`, likes: 456, comments: 123 },
  { user: 'marcus_osei', content: `Hot take: the senior dev who writes less code is usually more valuable than the one who writes more.\n\nThe best code is the code you don't write. The best feature is the one you delete. The best refactor is the one that makes the system simpler, not more clever.`, likes: 1234, comments: 189 },
  { user: 'marcus_osei', content: `Debugging a race condition at 2am is genuinely humbling.\n\nLike yes, I've been writing code for 10 years. Yes I understand concurrency. And yet here I am, adding console.logs in the dark, hoping the universe will take pity on me.\n\n(Fixed it. It was a stale closure. It's always a stale closure.)`, likes: 892, comments: 267 },

  // Astra Nova — general / art
  { user: 'astra_nova', content: `The digital art market just did something I didn't expect: a single generative piece sold for $28M at auction.\n\nNot because of hype. Because of provenance, because of community, because of story. The art world is slowly figuring out that value has always been social. Blockchain just made that legible.`, likes: 1567, comments: 234 },
  { user: 'astra_nova', content: `Collected my 100th digital artwork today. Wrote a long thread about what I've learned but then deleted it.\n\nActually the whole thing can be summarised: buy what moves you. Don't buy what you think will go up. The second approach has made every collector I know miserable.`, likes: 789, comments: 145 },
  { user: 'astra_nova', content: `Village is something I didn't know I needed until I had it.\n\nA platform where the art crowd and the tech crowd and the music crowd and the culture crowd all exist in the same space, talking to each other. Cross-pollination is where the interesting things happen.`, likes: 445, comments: 78 },

  // ByteWave — data art / ML
  { user: 'byte_wave', content: `Visualised 10 years of climate data last night and I can't stop staring at it.\n\nThe patterns are beautiful and terrifying simultaneously. There is something about seeing change rendered spatially — as colour, as movement, as shape — that hits differently than a chart with a trend line.`, likes: 923, comments: 134 },
  { user: 'byte_wave', content: `Data visualisation principle I keep coming back to: the first job of a chart is to not lie.\n\nThe second job is to tell a true story clearly.\n\nThe third job — which most people skip — is to make the reader feel something about the true story they just understood.`, likes: 1102, comments: 178 },

  // Nadia Mbeki — journalism / Africa
  { user: 'nadia_mbeki', content: `The tech story coming out of Africa right now is not "Africa is catching up." It's "Africa is solving problems at a speed and scale the rest of the world is only beginning to understand."\n\nM-Pesa launched before most Western fintechs existed. Safaricom 5G coverage maps embarrass carriers in Europe. The narrative needs to change.`, likes: 2341, comments: 456 },
  { user: 'nadia_mbeki', content: `Spent a week embedded with a team building medical diagnostic AI for low-resource clinical settings in rural Kenya. No reliable electricity. Intermittent connectivity. Devices from 2015.\n\nThe constraints didn't stop them. The constraints made the solution better. I am writing about this for a year.`, likes: 1876, comments: 312 },
  { user: 'nadia_mbeki', content: `To every young journalist asking how to cover tech without a CS degree:\n\nLearn to ask what a system makes easier and what it makes harder. Learn to follow the incentives. Learn to ask who isn't in the room.\n\nYou don't need to understand the code. You need to understand the consequences.`, likes: 1234, comments: 198 },

  // ElectraVoid — generative art
  { user: 'electravoid', content: `New series: "Liminal Architectures." 12 pieces. Each one is a structure that exists between states — not quite building, not quite landscape, not quite memory.\n\nI've been working on the training data for this for 8 months. The model has learned to dream in thresholds. It's exactly what I hoped for and nothing like what I expected.`, likes: 734, comments: 112 },
  { user: 'electravoid', content: `Someone asked how I decide when a piece is "done."\n\nI never decide. The piece tells me. When I stop changing things because I want to improve it and start changing things because I'm afraid to stop — that's when I know it's done.\n\nFear of completion is the real enemy, not perfectionism.`, likes: 1023, comments: 167 },
  { user: 'electravoid', content: `The thing nobody tells you about generative art:\n\nThe algorithm is a collaborator, not a tool. You bring the intention. It brings the surprise. The best work happens when you're genuinely willing to be changed by what it makes.\n\nIf you only accept outputs that match your vision exactly, you're using it wrong.`, likes: 891, comments: 145 },

  // Jay Solomon — startup / investing
  { user: 'jay_solomon', content: `The founders who build in public early — sharing failures, sharing thinking, sharing process — almost always build better products than those who don't.\n\nIt's not about marketing. It's about accountability, feedback loops, and the strange clarity that comes from explaining your decisions to people who didn't make them with you.`, likes: 1345, comments: 234 },
  { user: 'jay_solomon', content: `Watching the AI infra market right now is like watching the cloud market in 2008. The picks-and-shovels play is obvious in retrospect and yet most people are still buying the mining companies.\n\nGPU compute, inference optimisation, evaluation tooling. That's where I'm spending time.`, likes: 2109, comments: 389 },
  { user: 'jay_solomon', content: `Three questions I ask every founder in the first 10 minutes:\n\n1. What would have to be true for this to be a $10B company?\n2. What do your first 100 customers have in common that you didn't predict?\n3. What's the thing you're most worried about that you haven't told your investors?\n\nQuestion 3 is the whole meeting.`, likes: 3456, comments: 678 },

  // Cross-topic / mixed posts
  { user: 'flux_design', content: `We shipped dark mode at 11pm on a Friday and woke up to 400 messages saying it was the best update we'd ever made.\n\nSometimes the feature people say they want ("better search," "more filters") is just displacement for the thing they actually want ("I want to use this comfortably at night").\n\nListen beneath the feature request.`, likes: 1567, comments: 234 },
  { user: 'pix_studio', content: `Real talk: the 3D art community on Village is quietly becoming the best corner of the internet.\n\nNo algorithm chasing. No engagement bait. Just people who care deeply about craft sharing work and feedback with each other. This is what every platform promised to be.`, likes: 678, comments: 123 },
  { user: 'sol_bright', content: `Reminder that the best camera is the one you have with you.\n\nI shot this whole series on my phone because I left my gear at the hotel. Came back, looked at the frames, and honestly some of them are my favourite work this year.\n\nConstraints are a gift. Fight that instinct.`, likes: 534, comments: 89 },
  { user: 'byte_wave', content: `I ran every post I've made in the last 2 years through a sentiment analyser as an experiment.\n\nTurns out when I'm most uncertain about my work, I post most confidently. When I'm most confident, I stay quiet.\n\nI don't know what to do with that but it felt important to share.`, likes: 1234, comments: 198 },
  { user: 'marcus_osei', content: `There is no "right" way to start learning to code. There is only starting.\n\nTake the tutorial. Build the thing. Break the thing. Fix it. Look at how someone else fixed it. Ask why theirs is different. Repeat for 10 years.\n\nAnyone telling you there's a better path is selling something.`, likes: 2109, comments: 345 },
  { user: 'vera_okafor', content: `The Nairobi music scene is doing something that I think most of the world doesn't know about yet: fusing traditional acoustic instruments with modular synthesis in ways that genuinely don't sound like anything else.\n\nKeep an eye on what's coming out of East Africa in the next 18 months. You'll thank me later.`, likes: 1456, comments: 234 },
  { user: 'nadia_mbeki', content: `"Covering Africa" as if it's one place with one story is one of journalism's laziest habits.\n\n54 countries. 2000+ languages. 1.4 billion people. The diversity of economic conditions, political systems, cultural practices, and technological development across the continent is staggering.\n\nI am always a journalist from Africa. I am never a journalist covering "Africa."`, likes: 3102, comments: 567 },
  { user: 'rachel_chen', content: `The most underrated insight in venture: the relationship between founder and first 10 employees is more predictive of success than the product.\n\nYou can pivot the product. You can pivot the market. You can't pivot the team dynamic once it's calcified. Hire people who make decisions well together.`, likes: 2456, comments: 398 },
  { user: 'jay_solomon', content: `Spent the morning with a 19-year-old founder who built something with 80K users and no funding and has no interest in VC.\n\nShe said: "I just want to keep making something people love. Why would I trade that for a growth target I don't believe in?"\n\nI didn't have an answer. I'm still thinking about it.`, likes: 4123, comments: 891 },
]

const COMMENTS_BY_USER = {
  kai_nakamura: ["This is exactly where things are heading 🔥", "Love the technical depth here", "Been thinking about this for months — finally someone said it"],
  luna_vasquez: ["This resonates so much", "The process is everything 🎨", "That feeling when a piece clicks... yes."],
  zara_ellis: ["Counterpoint: friction can also be intentional", "This is the design discourse we needed", "Saved this. Reading again tomorrow."],
  neo_park: ["Real. We talk about this at the company constantly", "The numbers speak for themselves", "Bookmarking this whole thread"],
  flux_design: ["The tokenize your primitives point 👆", "Dark mode well done is an act of kindness", "Every design team should read this"],
  vera_okafor: ["That EP is going to hit different 🎵", "East Africa is doing something special right now", "The field recordings idea is brilliant"],
  pix_studio: ["The craft shows. Every frame.", "That render time was worth it", "Subsurface scattering changed my whole approach"],
  sol_bright: ["That golden hour light though... 📸", "Film and digital forever", "That East Africa art series — please tag me when it's out"],
  rachel_chen: ["The infrastructure implications are massive", "Self-awareness at speed — stealing this phrase", "This is the talent strategy memo I needed"],
  marcus_osei: ["Stale closure gets me every time 💀", "The best code is no code. Tattooing this on my arm.", "Just starred the repo. This is clever."],
  astra_nova: ["The 28M sale changed how my non-crypto friends talk about digital art", "Buy what moves you. Simple. True.", "Village really is something different"],
  byte_wave: ["The climate data visualisation sounds stunning", "That sentiment analysis is haunting actually", "More visualisation posts please"],
  nadia_mbeki: ["The M-Pesa point never gets old", "Constraints make better solutions — this is everywhere in African tech", "That framing on 'covering Africa' should be required reading"],
  electravoid: ["The algorithm as collaborator framing is perfect", "Fear of completion > perfectionism. Yes.", "Liminal Architectures is such a great concept"],
  jay_solomon: ["That 19-year-old founder though 🙌", "Question 3 is the whole meeting. Accurate.", "GPU compute + inference optimisation — agree completely"],
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomTimeAgo(maxDaysAgo = 30) {
  const ms = randomBetween(1000 * 60 * 5, 1000 * 60 * 60 * 24 * maxDaysAgo)
  return new Date(Date.now() - ms).toISOString()
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickRandomN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌿 Village Seed Script')
  console.log('='.repeat(50))

  // ── Step 1: Create auth users ──────────────────────────
  console.log('\n📧 Creating auth users...')
  const createdUsers = []

  for (const u of USERS) {
    const email = `${u.username}@village.demo`
    const password = 'village_demo_2024!'

    // Check if user already exists by trying to list
    const { data: existing } = await supabase.auth.admin.listUsers()
    const alreadyExists = existing?.users?.find(eu => eu.email === email)

    if (alreadyExists) {
      console.log(`  ⏭️  ${u.username} already exists`)
      createdUsers.push({ ...u, id: alreadyExists.id })
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: u.username,
        display_name: u.display_name,
      }
    })

    if (error) {
      console.log(`  ❌  ${u.username}: ${error.message}`)
    } else {
      console.log(`  ✅  ${u.username} (${data.user.id.slice(0, 8)}…)`)
      createdUsers.push({ ...u, id: data.user.id })
    }

    await sleep(100) // rate limit protection
  }

  // ── Step 2: Update profiles ────────────────────────────
  console.log('\n👤 Updating profiles...')

  for (const u of createdUsers) {
    if (!u.id) continue

    const { error } = await supabase.from('profiles').upsert({
      id: u.id,
      username: u.username,
      display_name: u.display_name,
      bio: u.bio,
      avatar_letter: u.display_name.charAt(0).toUpperCase(),
      avatar_color: u.color,
      verified: u.verified,
      followers_count: randomBetween(200, 85000),
      following_count: randomBetween(50, 2000),
      posts_count: randomBetween(10, 1200),
      created_at: randomTimeAgo(365),
    }, { onConflict: 'id' })

    if (error) console.log(`  ❌  Profile ${u.username}: ${error.message}`)
    else console.log(`  ✅  Profile: ${u.display_name}${u.verified ? ' ✓' : ''}`)
  }

  // Build username → id lookup
  const userMap = {}
  for (const u of createdUsers) {
    if (u.id) userMap[u.username] = u.id
  }

  // ── Step 3: Create posts ───────────────────────────────
  console.log('\n📝 Creating posts...')
  const createdPostIds = []

  for (const p of POST_TEMPLATES) {
    const authorId = userMap[p.user]
    if (!authorId) { console.log(`  ⏭️  Skipping post (user ${p.user} not found)`); continue }

    const { data, error } = await supabase.from('posts').insert({
      author_id: authorId,
      content: p.content,
      likes_count: p.likes + randomBetween(-20, 50), // slight randomisation
      comments_count: Math.floor(p.comments * (0.8 + Math.random() * 0.4)),
      reposts_count: Math.floor(p.likes * 0.12 + randomBetween(0, 30)),
      created_at: randomTimeAgo(21),
    }).select('id').single()

    if (error) {
      console.log(`  ❌  Post by ${p.user}: ${error.message}`)
    } else {
      createdPostIds.push({ id: data.id, authorId })
      process.stdout.write('.')
    }
  }
  console.log(`\n  ✅  ${createdPostIds.length} posts created`)

  // ── Step 4: Add post likes ─────────────────────────────
  console.log('\n❤️  Adding likes...')
  const allUserIds = Object.values(userMap)
  let likeCount = 0

  for (const post of createdPostIds) {
    // Each post gets liked by a random subset of users (not the author)
    const likers = pickRandomN(
      allUserIds.filter(id => id !== post.authorId),
      randomBetween(2, 10)
    )

    for (const userId of likers) {
      const { error } = await supabase.from('post_likes').insert({
        post_id: post.id,
        user_id: userId,
        created_at: randomTimeAgo(20),
      }).select()

      if (!error) likeCount++
    }
  }
  console.log(`  ✅  ${likeCount} likes added`)

  // ── Step 5: Add comments ───────────────────────────────
  console.log('\n💬 Adding comments...')
  let commentCount = 0

  for (const post of createdPostIds) {
    const numComments = randomBetween(1, 5)
    const commenters = pickRandomN(
      allUserIds.filter(id => id !== post.authorId),
      numComments
    )

    for (const commenterId of commenters) {
      const commenterUsername = Object.keys(userMap).find(k => userMap[k] === commenterId)
      if (!commenterUsername) continue

      const pool = COMMENTS_BY_USER[commenterUsername] || [
        "This is great 👏", "Needed to hear this", "Saving this post",
        "Completely agree", "More of this please", "This hit different today",
        "🔥🔥🔥", "Shared this with my whole team"
      ]

      const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        author_id: commenterId,
        content: pickRandom(pool),
        created_at: randomTimeAgo(18),
      })

      if (!error) commentCount++
    }
  }
  console.log(`  ✅  ${commentCount} comments added`)

  // ── Step 6: Add follows ────────────────────────────────
  console.log('\n👥 Adding follows...')
  let followCount = 0

  for (const followerId of allUserIds) {
    // Each user follows 3–8 random others
    const toFollow = pickRandomN(
      allUserIds.filter(id => id !== followerId),
      randomBetween(3, 8)
    )

    for (const followingId of toFollow) {
      const { error } = await supabase.from('follows').insert({
        follower_id: followerId,
        following_id: followingId,
        created_at: randomTimeAgo(60),
      }).select()

      if (!error) followCount++
    }
  }
  console.log(`  ✅  ${followCount} follow relationships added`)

  // ── Step 7: Seed artworks ──────────────────────────────
  console.log('\n🎨 Adding artworks...')
  const artworks = [
    { username: 'electravoid', title: 'Nebula Dreams #001',   emoji: 'nebula',  gradient: '135deg,#1a0533,#2d1060', price: 420,  cat: 'Generative', likes: 1200 },
    { username: 'electravoid', title: 'Threshold Series #3',  emoji: 'star',    gradient: '135deg,#330022,#660044', price: 320,  cat: 'Generative', likes: 967  },
    { username: 'pix_studio',  title: 'Chrome Bloom',         emoji: 'crystal', gradient: '135deg,#003333,#006655', price: 180,  cat: '3D',          likes: 843  },
    { username: 'pix_studio',  title: 'Void Architecture I',  emoji: 'city',    gradient: '135deg,#0d0d1a,#1a1a33', price: 550,  cat: '3D',          likes: 1456 },
    { username: 'byte_wave',   title: 'Ocean Data',           emoji: 'wave',    gradient: '135deg,#001a33,#003366', price: 750,  cat: 'Generative', likes: 2100 },
    { username: 'byte_wave',   title: 'Climate Lattice',      emoji: 'globe',   gradient: '135deg,#001a20,#003333', price: 640,  cat: 'Generative', likes: 890  },
    { username: 'kai_nakamura', title: 'Latent Space No. 7',  emoji: 'palette', gradient: '135deg,#2d0a4a,#1a0533', price: 890,  cat: 'Generative', likes: 1890 },
    { username: 'luna_vasquez', title: 'Digital Flora',       emoji: 'flower',  gradient: '135deg,#330011,#660022', price: 150,  cat: 'Digital',    likes: 634  },
    { username: 'luna_vasquez', title: 'Urban Solitude IV',   emoji: 'city',    gradient: '135deg,#1a1a2e,#2d2d44', price: 280,  cat: 'Digital',    likes: 478  },
    { username: 'astra_nova',  title: 'Stardust Protocol',    emoji: 'star',    gradient: '135deg,#1a0533,#3d1a6e', price: 320,  cat: 'Digital',    likes: 967  },
    { username: 'sol_bright',  title: 'Golden Hour Nairobi',  emoji: 'sunrise', gradient: '135deg,#331900,#663300', price: 400,  cat: 'Photography', likes: 1234 },
    { username: 'electravoid', title: 'Liminal Structure #1', emoji: 'rocket',  gradient: '135deg,#0d1a33,#1a2d66', price: 560,  cat: 'Generative', likes: 734  },
  ]

  let artCount = 0
  for (const a of artworks) {
    const artistId = userMap[a.username]
    if (!artistId) continue

    const { error } = await supabase.from('artworks').insert({
      artist_id: artistId,
      title: a.title,
      emoji: a.emoji,
      gradient: a.gradient,
      price_usd: a.price,
      category: a.cat,
      likes_count: a.likes + randomBetween(-50, 100),
      description: `Original digital work. ${a.cat} piece. Certificate of authenticity provided.`,
      created_at: randomTimeAgo(45),
    })

    if (!error) artCount++
  }
  console.log(`  ✅  ${artCount} artworks added`)

  // ── Done ───────────────────────────────────────────────
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Seed complete!\n')
  console.log('Users created (all use password: village_demo_2024!):')
  for (const u of USERS) {
    console.log(`  ${u.verified ? '✓' : ' '} ${u.username}@village.demo`)
  }
  console.log('\nYou can sign in with any of these accounts to test the app.')
  console.log('='.repeat(50))
}

main().catch(err => {
  console.error('\n💥 Seed failed:', err.message)
  process.exit(1)
})
