# Graph Report - bbb  (2026-09-24)

## Corpus Check
- 5 files · ~28,499 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 93 nodes · 120 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 87% EXTRACTED · 12% INFERRED · 1% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0458c244`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- manifest.json
- sw.js
- Our Little Universe (couple app)
- hearts() floating hearts effect
- dash() stats cards
- Firebase Realtime Database
- PWA Icon 512x512
- Leaflet + OpenStreetMap tiles
- CLAUDE.md
- README.md

## God Nodes (most connected - your core abstractions)
1. `Firebase Realtime Database` - 15 edges
2. `Our Little Universe (couple app)` - 12 edges
3. `dash() stats cards` - 6 edges
4. `rMovies() movie list renderer` - 6 edges
5. `hearts() floating hearts effect` - 5 edges
6. `saveStory()` - 5 edges
7. `buildPC() RTCPeerConnection setup` - 5 edges
8. `createRoom() host offer` - 5 edges
9. `joinRoom() guest answer` - 5 edges
10. `Next-meeting date popup` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Apple Touch Icon 180x180` --semantically_similar_to--> `PWA Icon 192x192`  [INFERRED] [semantically similar]
  icon-180.png → icon-192.png
- `Apple Touch Icon 180x180` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-180.png → icon-512.png
- `PWA Icon 192x192` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-192.png → icon-512.png
- `Favicon 32x32` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-32.png → icon-512.png
- `Favicon 32x32` --references--> `Glossy pink heart on dark purple starry background (app logo motif)`  [INFERRED]
  icon-32.png → icon-512.png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Sections synced via Firebase Realtime DB** — index_r_movies, index_r_meetings, index_r_places, index_render_story_timeline, index_build_cal, index_r_photos, index_firebase_rtdb [EXTRACTED 1.00]
- **WebRTC call signaling via Firebase** — index_create_room, index_join_room, index_build_pc, index_ice_cfg, index_chat, index_firebase_rtdb [EXTRACTED 1.00]
- **PWA and push notification stack** — manifest, sw, index_sw_registration, index_pwa_install_prompt, index_request_notification_permission, index_firebase_messaging [INFERRED 0.85]

## Communities (10 total, 2 thin omitted)

### Community 0 - "manifest.json"
Cohesion: 0.11
Nodes (17): background_color, categories, description, dir, display, display_override, icons, id (+9 more)

### Community 1 - "sw.js"
Cohesion: 0.18
Nodes (12): checkMoodReminder(), Firebase Cloud Messaging (push), localStorage (nextMeetingDate, moodReminderDismissed, PWA dismiss), Meetings screen, nav wrapper adding mood hooks, Next-meeting date popup, PWA install prompt and iOS fallback, rMeetings() (+4 more)

### Community 2 - "Our Little Universe (couple app)"
Cohesion: 0.14
Nodes (14): buildCal() mood calendar, Firebase Analytics, Fullscreen and draggable PiP layout, Google Fonts (Fraunces, DM Sans, Caveat), Home dashboard screen, Intro overlay, Mood colour diary screen, openStoryDetail() read-only modal (+6 more)

### Community 3 - "hearts() floating hearts effect"
Cohesion: 0.21
Nodes (12): Firebase Storage (photos), hearts() floating hearts effect, heic2any library (esm.sh), Photo lightbox (openLightbox), Mood submit (set moods/date), Photo upload handler, Photos gallery screen, Place submit handler (upload photo + push) (+4 more)

### Community 4 - "dash() stats cards"
Cohesion: 0.22
Nodes (11): dash() stats cards, Date constants (DATE_MET, DATE_OFF, birthdays), Date utilities (dBetween, dUntil, nextOcc, nextMiv), Movies log screen, openMvEdit() edit movie modal, rMovies() movie list renderer, Dual rating sliders (wireSlider, ratingColor), renderSuggestions()/selectMovie() (+3 more)

### Community 5 - "Firebase Realtime Database"
Cohesion: 0.39
Nodes (9): buildPC() RTCPeerConnection setup, In-call chat (sendChat, subscribeChat), createRoom() host offer, Firebase Realtime Database, getMedia() camera and mic, hangup() cleanup, ICE config (STUN and TURN servers), joinRoom() guest answer (+1 more)

### Community 6 - "PWA Icon 512x512"
Cohesion: 0.60
Nodes (5): Apple Touch Icon 180x180, PWA Icon 192x192, Favicon 32x32, PWA Icon 512x512, Glossy pink heart on dark purple starry background (app logo motif)

### Community 7 - "Leaflet + OpenStreetMap tiles"
Cohesion: 0.33
Nodes (6): Leaflet + OpenStreetMap tiles, Google Maps URL coordinate parser, nav() section navigation, Places map screen, rPlaces() markers and list, Sidebar and bottom nav (responsive)

## Ambiguous Edges - Review These
- `Next-meeting date popup` → `rMeetings()`  [AMBIGUOUS]
  index.html · relation: semantically_similar_to

## Knowledge Gaps
- **37 isolated node(s):** `name`, `short_name`, `description`, `id`, `start_url` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 40 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Next-meeting date popup` and `rMeetings()`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `Firebase Realtime Database` connect `Firebase Realtime Database` to `sw.js`, `Our Little Universe (couple app)`, `hearts() floating hearts effect`, `dash() stats cards`, `Leaflet + OpenStreetMap tiles`?**
  _High betweenness centrality (0.322) - this node is a cross-community bridge._
- **Why does `Our Little Universe (couple app)` connect `Our Little Universe (couple app)` to `manifest.json`, `sw.js`, `hearts() floating hearts effect`, `dash() stats cards`, `Leaflet + OpenStreetMap tiles`?**
  _High betweenness centrality (0.318) - this node is a cross-community bridge._
- **Why does `PWA install prompt and iOS fallback` connect `sw.js` to `manifest.json`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `manifest.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Our Little Universe (couple app)` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._