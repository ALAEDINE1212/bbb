# Graph Report - bbb  (2026-10-30)

## Corpus Check
- 42 files · ~50,915 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .css 2, (none) 1)

## Summary
- 422 nodes · 1029 edges · 19 communities (15 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1a409839`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Our Little Universe (couple app)
- manifest.json
- haptic
- package.json
- store.ts
- Sheets.tsx
- App.tsx
- Home.tsx
- PWA Icon 512x512
- CLAUDE.md
- README.md
- updMStats() mood statistics (keyword regex)
- compilerOptions
- parity.test.ts
- legacy.ts
- types.ts
- Backend
- feedback.ts
- writes.ts

## God Nodes (most connected - your core abstractions)
1. `haptic()` - 36 edges
2. `cn()` - 33 edges
3. `react` - 24 edges
4. `useData()` - 22 edges
5. `Our Little Universe (couple app)` - 21 edges
6. `Home()` - 19 edges
7. `PlaceSheet()` - 17 edges
8. `lucide-react` - 16 edges
9. `Movies()` - 16 edges
10. `MovieSheet()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Apple Touch Icon 180x180` --semantically_similar_to--> `PWA Icon 192x192`  [INFERRED] [semantically similar]
  icon-180.png → icon-192.png
- `Apple Touch Icon 180x180` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-180.png → icon-512.png
- `PWA Icon 192x192` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-192.png → icon-512.png
- `Favicon 32x32` --semantically_similar_to--> `PWA Icon 512x512`  [INFERRED] [semantically similar]
  icon-32.png → icon-512.png
- `App()` --calls--> `useData()`  [EXTRACTED]
  app/src/App.tsx → app/src/data/store.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Sections synced via Firebase Realtime DB** — index_r_movies, index_r_meetings, index_r_places, index_render_story_timeline, index_build_cal, index_r_photos, index_firebase_rtdb [EXTRACTED 1.00]
- **Dock navigation flow** — index_dock_nav, index_nav, index_page_meta, index_nav_override, index_dock_aria_sync [EXTRACTED 1.00]
- **Weather widget data flow** — index_weather_widget, index_wx_forecast_api, index_wx_geocoding_api, index_wx_cities_storage, index_wx_distance, index_wx_time_diff [EXTRACTED 1.00]
- **WebRTC call signaling via Firebase** — index_create_room, index_join_room, index_build_pc, index_ice_cfg, index_chat, index_firebase_rtdb [EXTRACTED 1.00]
- **Lucide icon pipeline** — index_lucide_icons, index_icon_refresher, index_mic_cam_masks, index_hearts [INFERRED 0.85]
- **PWA and push notification stack** — manifest, sw, index_sw_registration, index_pwa_install_prompt, index_request_notification_permission, index_firebase_messaging [INFERRED 0.85]

## Communities (19 total, 4 thin omitted)

### Community 0 - "Our Little Universe (couple app)"
Cohesion: 0.05
Nodes (68): buildCal() mood calendar, buildPC() RTCPeerConnection setup, CARTO Dark Matter basemap (CARTO_KEY), In-call chat (sendChat, subscribeChat), checkMoodReminder(), createRoom() host offer, Dark map tiles (CARTO Dark Matter or darkened OSM), Dock aria-current sync observer (+60 more)

### Community 1 - "manifest.json"
Cohesion: 0.06
Nodes (41): dash() stats cards, Date constants (DATE_MET, DATE_OFF, birthdays), Date utilities (dBetween, dUntil, nextOcc, nextMiv), Home dashboard screen, localStorage (nextMeetingDate, moodReminderDismissed, PWA dismiss), Next-meeting date popup, PWA install prompt and iOS fallback, requestNotificationPermission() FCM token (+33 more)

### Community 2 - "haptic"
Cohesion: 0.12
Nodes (48): runSave(), nav, dk(), ndIso(), deletePlace, deleteStory, useData(), cn() (+40 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (41): dependencies, clsx@^2.1.1, firebase@^11.10.0, framer-motion@^12.0.0, leaflet@^1.9.4, lucide-react@^0.545.0, react@^19.1.0, react-dom@^19.1.0 (+33 more)

### Community 4 - "store.ts"
Cohesion: 0.11
Nodes (19): compressImage(), app, db, emit(), firebase, getSnapshot(), guard(), guarded() (+11 more)

### Community 5 - "Sheets.tsx"
Cohesion: 0.22
Nodes (29): toast(), iso(), addMeeting, addMovie, addPhoto, addPlace, editMovie, editPlace (+21 more)

### Community 6 - "App.tsx"
Cohesion: 0.09
Nodes (27): App(), applyTheme(), useToasts(), listeners, NavState, SheetKind, state, SubScreen (+19 more)

### Community 7 - "Home.tsx"
Cohesion: 0.13
Nodes (26): BF_BD, BF_YEAR, DATE_MET, DATE_OFF, firebaseConfig, INES_BD, MOOD_SWATCHES, STORAGE_BUCKET (+18 more)

### Community 8 - "PWA Icon 512x512"
Cohesion: 0.60
Nodes (5): Apple Touch Icon 180x180, PWA Icon 192x192, Favicon 32x32, PWA Icon 512x512, Glossy pink heart on dark purple starry background (app logo motif)

### Community 12 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+6 more)

### Community 13 - "parity.test.ts"
Cohesion: 0.15
Nodes (10): createWrites(), frozenDate(), backup, newSide(), NOW, oldSide(), rawEdge, same() (+2 more)

### Community 14 - "legacy.ts"
Cohesion: 0.21
Nodes (9): block(), createLegacy(), extract(), fakeCompress(), inert(), LEGACY_PATH, legacySource, LegacyState (+1 more)

### Community 15 - "types.ts"
Cohesion: 0.20
Nodes (9): Coll, Entries, Meeting, Mood, Movie, Photo, Place, Snapshot (+1 more)

### Community 17 - "feedback.ts"
Cohesion: 0.40
Nodes (4): listeners, toasts, InvalidInput, Toast

### Community 18 - "writes.ts"
Cohesion: 0.40
Nodes (4): mapTmdb(), TmdbPick, TmdbRaw, Writes

## Knowledge Gaps
- **20 isolated node(s):** `buildCal() mood calendar`, `Dock aria-current sync observer`, `Fullscreen and draggable PiP layout`, `hearts() floating hearts effect`, `Intro overlay` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 139 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `haptic` to `package.json`, `store.ts`, `Sheets.tsx`, `App.tsx`, `feedback.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `useData()` (e.g. with `getSnapshot()` and `subscribe()`) actually correct?**
  _`useData()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `buildCal() mood calendar`, `Dock aria-current sync observer`, `Fullscreen and draggable PiP layout` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Our Little Universe (couple app)` be split into smaller, more focused modules?**
  _Cohesion score 0.051577152600170505 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `App.tsx` to `haptic`, `package.json`, `Sheets.tsx`, `Home.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `manifest.json` be split into smaller, more focused modules?**
  _Cohesion score 0.058693244739756366 - nodes in this community are weakly interconnected._
- **Why does `Backend` connect `Backend` to `writes.ts`, `store.ts`, `parity.test.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._