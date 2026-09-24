# Graph Report - bbb  (2026-09-24)

## Corpus Check
- 5 files · ~28,663 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 122 nodes · 190 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9941a396`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Our Little Universe (couple app)
- manifest.json
- Dashboard weather widget (two cities)
- WebRTC Together module
- Icon refresher (refreshIcons + MutationObserver)
- dash() stats cards
- Floating glass dock nav
- Places map screen
- PWA Icon 512x512
- CLAUDE.md
- README.md
- updMStats() mood statistics (keyword regex)

## God Nodes (most connected - your core abstractions)
1. `Our Little Universe (couple app)` - 21 edges
2. `Firebase Realtime Database` - 14 edges
3. `WebRTC Together module` - 13 edges
4. `Floating glass dock nav` - 12 edges
5. `Dashboard weather widget (two cities)` - 11 edges
6. `Icon refresher (refreshIcons + MutationObserver)` - 10 edges
7. `render(), locHtml(), midHtml() weather markup` - 7 edges
8. `Movies log screen` - 6 edges
9. `dash() stats cards` - 6 edges
10. `Firebase app init and config` - 5 edges

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
- **Dock navigation flow** — index_dock_nav, index_nav, index_page_meta, index_nav_override, index_dock_aria_sync [EXTRACTED 1.00]
- **Weather widget data flow** — index_weather_widget, index_wx_forecast_api, index_wx_geocoding_api, index_wx_cities_storage, index_wx_distance, index_wx_time_diff [EXTRACTED 1.00]
- **WebRTC call signaling via Firebase** — index_create_room, index_join_room, index_build_pc, index_ice_cfg, index_chat, index_firebase_rtdb [EXTRACTED 1.00]
- **Lucide icon pipeline** — index_lucide_icons, index_icon_refresher, index_mic_cam_masks, index_hearts [INFERRED 0.85]
- **PWA and push notification stack** — manifest, sw, index_sw_registration, index_pwa_install_prompt, index_request_notification_permission, index_firebase_messaging [INFERRED 0.85]

## Communities (12 total, 3 thin omitted)

### Community 0 - "Our Little Universe (couple app)"
Cohesion: 0.11
Nodes (27): buildCal() mood calendar, In-call chat (sendChat, subscribeChat), Firebase Analytics, Firebase app init and config, Firebase Cloud Messaging (push), Firebase Realtime Database, Firebase Storage (photos), Google Fonts (Fraunces, DM Sans, Caveat) (+19 more)

### Community 1 - "manifest.json"
Cohesion: 0.11
Nodes (17): background_color, categories, description, dir, display, display_override, icons, id (+9 more)

### Community 2 - "Dashboard weather widget (two cities)"
Cohesion: 0.23
Nodes (14): Home dashboard screen, Dashboard weather widget (two cities), wxCities localStorage key, City search with debounced geocoding autocomplete, info() WMO weather code to Lucide icon, km() haversine distance between cities, fetchOne() forecast request, Open-Meteo forecast API (+6 more)

### Community 3 - "WebRTC Together module"
Cohesion: 0.26
Nodes (13): buildPC() RTCPeerConnection setup, createRoom() host offer, Fullscreen and draggable PiP layout, getMedia() camera and mic, hangup() cleanup, ICE config (STUN and TURN servers), joinRoom() guest answer, Mic/cam buttons drawn with CSS masks (+5 more)

### Community 4 - "Icon refresher (refreshIcons + MutationObserver)"
Cohesion: 0.24
Nodes (12): hearts() floating hearts effect, Icon refresher (refreshIcons + MutationObserver), Lucide icons (unpkg CDN), Movies log screen, openMvEdit() edit movie modal, rMovies() movie list renderer, Dual rating sliders (wireSlider, ratingColor), renderSuggestions()/selectMovie() (+4 more)

### Community 5 - "dash() stats cards"
Cohesion: 0.20
Nodes (10): dash() stats cards, Date constants (DATE_MET, DATE_OFF, birthdays), Date utilities (dBetween, dUntil, nextOcc, nextMiv), localStorage (nextMeetingDate, moodReminderDismissed, PWA dismiss), Next-meeting date popup, PWA install prompt and iOS fallback, requestNotificationPermission() FCM token, Service worker registration (+2 more)

### Community 6 - "Floating glass dock nav"
Cohesion: 0.25
Nodes (9): checkMoodReminder(), Dock aria-current sync observer, Dock styles (.dock, .dock-i, badge), Floating glass dock nav, Apple-Pro liquid glass design system, nav() section navigation, nav wrapper adding mood hooks, PM page titles map (+1 more)

### Community 7 - "Places map screen"
Cohesion: 0.33
Nodes (7): CARTO Dark Matter basemap (CARTO_KEY), Dark map tiles (CARTO Dark Matter or darkened OSM), Leaflet + OpenStreetMap tiles, Google Maps URL coordinate parser, osm-dark CSS filter, Places map screen, rPlaces() markers and list

### Community 8 - "PWA Icon 512x512"
Cohesion: 0.60
Nodes (5): Apple Touch Icon 180x180, PWA Icon 192x192, Favicon 32x32, PWA Icon 512x512, Glossy pink heart on dark purple starry background (app logo motif)

## Knowledge Gaps
- **41 isolated node(s):** `name`, `short_name`, `description`, `id`, `start_url` (+36 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 44 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Our Little Universe (couple app)` connect `Our Little Universe (couple app)` to `Dashboard weather widget (two cities)`, `WebRTC Together module`, `Icon refresher (refreshIcons + MutationObserver)`, `Floating glass dock nav`, `Places map screen`?**
  _High betweenness centrality (0.265) - this node is a cross-community bridge._
- **Why does `Icon refresher (refreshIcons + MutationObserver)` connect `Icon refresher (refreshIcons + MutationObserver)` to `Our Little Universe (couple app)`, `Dashboard weather widget (two cities)`, `dash() stats cards`, `Places map screen`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Why does `PWA install prompt and iOS fallback` connect `dash() stats cards` to `manifest.json`?**
  _High betweenness centrality (0.233) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Dashboard weather widget (two cities)` (e.g. with `Home dashboard screen` and `Apple-Pro liquid glass design system`) actually correct?**
  _`Dashboard weather widget (two cities)` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Our Little Universe (couple app)` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `manifest.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._