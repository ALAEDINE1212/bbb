/** Saving is OFF unless the build sets VITE_WRITE_ENABLED=1. Default builds are a read-only shadow. */
export const WRITE_ENABLED = import.meta.env?.VITE_WRITE_ENABLED === "1";

// Copied from the legacy index.html ("DATES CONFIG").
export const DATE_MET = "2025-08-16";
export const DATE_OFF = "2025-10-25";
export const INES_BD = "07-05";
export const BF_BD = "04-12";
export const BF_YEAR = 2006;
export const TRIP = "";

export const firebaseConfig = {
  apiKey: "AIzaSyAlPxlXJH6e2Yf2MRBOWK6Q9zotEHyk780",
  authDomain: "my-baby-35bb9.firebaseapp.com",
  databaseURL: "https://my-baby-35bb9-default-rtdb.firebaseio.com",
  projectId: "my-baby-35bb9",
  storageBucket: "my-baby-35bb9.firebasestorage.app",
  messagingSenderId: "1022726711006",
  appId: "1:1022726711006:web:22fb3e65b46e7fecdb444f"
};

export const STORAGE_BUCKET = "gs://my-baby-35bb9.firebasestorage.app";

export const TMDB_KEY = "46979da9955cfe0fc747297d57f30ab5";
export const TMDB_IMG = "https://image.tmdb.org/t/p/w185";
export const TMDB_IMG_LG = "https://image.tmdb.org/t/p/w342";

/** Mood swatches, same hex values and order as the legacy picker (values are stored as-is). */
export const MOOD_SWATCHES = [
  { color: "#f4a5b5", label: "Happy", emoji: "🌸" },
  { color: "#f9d56e", label: "Joyful", emoji: "☀️" },
  { color: "#e8607a", label: "Love", emoji: "❤️" },
  { color: "#7ec8a0", label: "Calm", emoji: "🌿" },
  { color: "#6bbfd4", label: "Chill", emoji: "🌊" },
  { color: "#7ab4e0", label: "Sad", emoji: "💙" },
  { color: "#c49fd8", label: "Dreamy", emoji: "💜" },
  { color: "#d4956a", label: "Cozy", emoji: "🍂" },
  { color: "#8090a8", label: "Stressed", emoji: "🌧️" },
  { color: "#6b6070", label: "Low", emoji: "🖤" }
] as const;
