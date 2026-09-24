# Graph Report - bbb  (2026-09-24)

## Corpus Check
- Corpus is ~22,174 words - fits in a single context window. You may not need a graph.

## Summary
- 90 nodes · 119 edges · 8 communities
- Extraction: 86% EXTRACTED · 13% INFERRED · 2% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.86)
- Token cost: 159,376 input · 0 output

## Community Hubs (Navigation)
- PWA Manifest
- Navigation, Meetings & Push
- App Shell, Story & Mood
- Photos & HEIC Handling
- Home Dashboard & Movies
- WebRTC Call Engine
- App Icons
- Places Map

## God Nodes (most connected - your core abstractions)
1. `Firebase Realtime Database` - 15 edges
2. `Our Little Universe (couple app)` - 13 edges
3. `dash() stats cards` - 6 edges
4. `rMovies() movie list renderer` - 6 edges
5. `hearts() floating hearts effect` - 5 edges
6. `saveStory()` - 5 edges
7. `createRoom() host offer` - 5 edges
8. `joinRoom() guest answer` - 5 edges
9. `buildPC() RTCPeerConnection setup` - 5 edges
10. `Next-meeting date popup` - 4 edges

## Surprising Connections (you probably didn't know these)
- `bbb README (title only)` --references--> `Our Little Universe (couple app)`  [AMBIGUOUS]
  README.md → index.html
- `Apple Touch Icon 180x180` --semantically_similar_to--> `PWA Icon 192x192`  [INFERRED] [semantically similar]
  icon-180.png → icon-192.png
- `Apple Touch Icon 180x180` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-180.png → icon-512.png
- `PWA Icon 192x192` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-192.png → icon-512.png
- `Favicon 32x32` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-32.png → icon-512.png

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Sections synced via Firebase Realtime DB** — index_r_movies, index_r_meetings, index_r_places, index_render_story_timeline, index_build_cal, index_r_photos, index_firebase_rtdb [EXTRACTED 1.00]
- **WebRTC call signaling via Firebase** — index_create_room, index_join_room, index_build_pc, index_ice_cfg, index_chat, index_firebase_rtdb [EXTRACTED 1.00]
- **PWA and push notification stack** — manifest, sw, index_sw_registration, index_pwa_install_prompt, index_request_notification_permission, index_firebase_messaging [INFERRED 0.85]

## Communities (8 total, 0 thin omitted)

### Community 0 - "PWA Manifest"
Cohesion: 0.11
Nodes (17): background_color, categories, description, dir, display, display_override, icons, id (+9 more)

### Community 1 - "Navigation, Meetings & Push"
Cohesion: 0.15
Nodes (14): checkMoodReminder(), Firebase Cloud Messaging (push), localStorage (nextMeetingDate, moodReminderDismissed, PWA dismiss), Meetings screen, nav() section navigation, nav wrapper adding mood hooks, Next-meeting date popup, PWA install prompt and iOS fallback (+6 more)

### Community 2 - "App Shell, Story & Mood"
Cohesion: 0.14
Nodes (14): buildCal() mood calendar, Firebase Analytics, Fullscreen and draggable PiP layout, Google Fonts (Fraunces, DM Sans, Caveat), Intro overlay, Mood colour diary screen, openStoryDetail() read-only modal, Our Little Universe (couple app) (+6 more)

### Community 3 - "Photos & HEIC Handling"
Cohesion: 0.21
Nodes (12): Firebase Storage (photos), hearts() floating hearts effect, heic2any library (esm.sh), Photo lightbox (openLightbox), Mood submit (set moods/date), Photo upload handler, Photos gallery screen, Place submit handler (upload photo + push) (+4 more)

### Community 4 - "Home Dashboard & Movies"
Cohesion: 0.20
Nodes (12): dash() stats cards, Date constants (DATE_MET, DATE_OFF, birthdays), Date utilities (dBetween, dUntil, nextOcc, nextMiv), Home dashboard screen, Movies log screen, openMvEdit() edit movie modal, rMovies() movie list renderer, Dual rating sliders (wireSlider, ratingColor) (+4 more)

### Community 5 - "WebRTC Call Engine"
Cohesion: 0.39
Nodes (9): buildPC() RTCPeerConnection setup, In-call chat (sendChat, subscribeChat), createRoom() host offer, Firebase Realtime Database, getMedia() camera and mic, hangup() cleanup, ICE config (STUN and TURN servers), joinRoom() guest answer (+1 more)

### Community 6 - "App Icons"
Cohesion: 0.60
Nodes (5): Apple Touch Icon 180x180, PWA Icon 192x192, Favicon 32x32, PWA Icon 512x512, Glossy pink heart on dark purple starry background (app logo motif)

### Community 7 - "Places Map"
Cohesion: 0.50
Nodes (4): Leaflet + OpenStreetMap tiles, Google Maps URL coordinate parser, Places map screen, rPlaces() markers and list

## Ambiguous Edges - Review These
- `Our Little Universe (couple app)` → `bbb README (title only)`  [AMBIGUOUS]
  README.md · relation: references
- `Next-meeting date popup` → `rMeetings()`  [AMBIGUOUS]
  index.html · relation: semantically_similar_to

## Knowledge Gaps
- **36 isolated node(s):** `name`, `short_name`, `description`, `id`, `start_url` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 37 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Our Little Universe (couple app)` and `bbb README (title only)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Next-meeting date popup` and `rMeetings()`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `Our Little Universe (couple app)` connect `App Shell, Story & Mood` to `PWA Manifest`, `Navigation, Meetings & Push`, `Photos & HEIC Handling`, `Home Dashboard & Movies`, `Places Map`?**
  _High betweenness centrality (0.361) - this node is a cross-community bridge._
- **Why does `Firebase Realtime Database` connect `WebRTC Call Engine` to `Navigation, Meetings & Push`, `App Shell, Story & Mood`, `Photos & HEIC Handling`, `Home Dashboard & Movies`, `Places Map`?**
  _High betweenness centrality (0.348) - this node is a cross-community bridge._
- **Why does `PWA install prompt and iOS fallback` connect `Navigation, Meetings & Push` to `PWA Manifest`?**
  _High betweenness centrality (0.147) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PWA Manifest` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._