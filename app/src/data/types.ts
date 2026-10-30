// Shapes as they exist in the Realtime Database today (checked against the 2026-10-30 backup).
// Records keep any unknown keys untouched; these types only name what the app reads.

export interface StoryEvent { date: string; title: string; text: string; photoUrl?: string | null; photoCaption?: string }
export interface Meeting { date: string; where: string; how: string }
export interface Mood { color: string; text: string }
export interface Movie {
  title: string; date: string; place: string; note: string; ratingA: number; ratingI: number;
  poster?: string; overview?: string; year?: string; tmdbRating?: string; type?: string; tmdbId?: number;
}
export interface Place { name: string; date: string; lat: number; lng: number; note: string; photoUrl: string; photoCaption: string }
export interface Photo { url: string; caption: string; path: string }

export type Coll<T> = Record<string, T>;

export interface Snapshot {
  loaded: boolean;
  storyEvents: Coll<StoryEvent>;
  meetings: Coll<Meeting>;
  moods: Coll<Mood>;
  movies: Coll<Movie>;
  places: Coll<Place>;
  photos: Coll<Photo>;
}

export type Entries<T> = [string, T][];
