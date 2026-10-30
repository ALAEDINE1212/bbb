import { CakeSlice, CalendarCheck, CalendarClock, CalendarHeart, Camera, ChevronRight, Clapperboard, Gift, Heart, Sparkles } from "lucide-react";
import { BF_BD, BF_YEAR, DATE_MET, DATE_OFF, INES_BD } from "@/config";
import { useData } from "@/data/store";
import { dBetween, daysTo, dUntil, iso, ndIso, nextMiv, nextOcc } from "@/data/dates";
import { nav } from "@/app/nav";
import { Card, SectionTitle } from "@/ui/Card";
import { Ring } from "@/ui/Ring";
import { StatusPill } from "@/ui/Pill";
import { Squircle } from "@/ui/Field";
import { ScreenTitle } from "./common";

function readNextMeeting(): string {
  try { return localStorage.getItem("nextMeetingDate") || ""; } catch { return ""; }
}

export function Home() {
  const d = useData(s => s);
  const today = iso();
  const monthPrefix = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8, 10));

  const miv = nextMiv(DATE_OFF);
  const mivDays = miv ? daysTo(miv) : null;
  const prevMiv = miv ? new Date(miv.getFullYear(), miv.getMonth() - 1, miv.getDate()) : null;
  const mivProgress = miv && prevMiv ? (Date.now() - prevMiv.getTime()) / (miv.getTime() - prevMiv.getTime()) : null;

  const moodsThisMonth = Object.keys(d.moods).filter(k => k.startsWith(monthPrefix)).length;
  const moviesThisMonth = Object.values(d.movies).filter(m => (m.date || "").startsWith(monthPrefix)).length;
  const movieCount = Object.keys(d.movies).length;

  const nextMeeting = readNextMeeting();
  const meetDays = nextMeeting ? dUntil(nextMeeting) : null;
  const ib = nextOcc(INES_BD), bb = nextOcc(BF_BD);
  const latestStory = Object.entries(d.storyEvents).sort((a, b) => (b[1].date || "").localeCompare(a[1].date || ""))[0];

  return (
    <div>
      <ScreenTitle>Today, {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" })}</ScreenTitle>

      <Card className="grid grid-cols-3 divide-x divide-line py-5">
        <RingCell label="Us" caption={mivDays != null ? `${mivDays}d to month` : "—"}>
          <Ring value={d.loaded ? mivProgress : null} color="var(--accent-1)" color2="var(--accent-1b)" size={84} display={mivDays != null ? String(mivDays) : undefined} caption="days" />
        </RingCell>
        <RingCell label="Movies" caption={`${moviesThisMonth} this month`}>
          <Ring value={d.loaded ? Math.min(1, moviesThisMonth / 4) : null} color="var(--accent-2)" color2="var(--accent-2b)" size={84} display={String(moviesThisMonth)} caption="of 4" />
        </RingCell>
        <RingCell label="Mood" caption={`${moodsThisMonth}/${dayOfMonth} days`}>
          <Ring value={d.loaded ? moodsThisMonth / dayOfMonth : null} color="var(--accent-3)" color2="var(--accent-3b)" size={84} />
        </RingCell>
      </Card>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <BigNumber icon={<Sparkles />} color="var(--accent-1)" value={dBetween(DATE_MET)} label="days since we met" sub={ndIso(DATE_MET)} />
        <BigNumber icon={<Heart />} color="var(--accent-1)" value={dBetween(DATE_OFF)} label="days together" sub={`since ${ndIso(DATE_OFF)}`} />
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <StatusPill
          icon={<CalendarClock className="size-[18px]" />} tint="var(--accent-1)"
          title={meetDays == null ? "Next meeting" : meetDays > 0 ? `${meetDays} days` : meetDays === 0 ? "Today! 🎉" : "Passed"}
          subtitle={nextMeeting ? ndIso(nextMeeting) : "Not set yet"}
        />
        <StatusPill icon={<CalendarCheck className="size-[18px]" />} tint="var(--accent-1)" title={mivDays != null ? `${mivDays} days` : "—"} subtitle="Monthiversary" />
        <StatusPill icon={<CakeSlice className="size-[18px]" />} tint="var(--accent-3)" title={`${daysTo(ib)} days`} subtitle="Ines's birthday" />
        <StatusPill icon={<Gift className="size-[18px]" />} tint="var(--accent-3)" title={`${daysTo(bb)} days`} subtitle={`His birthday · ${bb.getFullYear() - BF_YEAR}`} />
      </div>

      <SectionTitle>Collections</SectionTitle>
      <Card className="divide-y divide-line overflow-hidden">
        <CollectionRow icon={<Clapperboard />} color="var(--accent-2)" title="Movies" meta={`${movieCount} watched together`} onClick={() => nav.sub("movies")} />
        <CollectionRow icon={<CalendarHeart />} color="var(--accent-1)" title="Meetings" meta={`${Object.keys(d.meetings).length} times together`} onClick={() => nav.sub("meetings")} />
        <CollectionRow icon={<Camera />} color="var(--accent-2)" title="Photos" meta={`${Object.keys(d.photos).length} in the gallery`} onClick={() => nav.sub("photos")} />
      </Card>

      {latestStory && (
        <>
          <SectionTitle action={<button className="text-[14px] font-semibold text-accent-1" onClick={() => nav.tab("story")}>See all</button>}>Latest moment</SectionTitle>
          <Card className="overflow-hidden">
            {latestStory[1].photoUrl && <img src={latestStory[1].photoUrl} alt="" className="h-44 w-full object-cover" loading="lazy" />}
            <div className="p-4">
              <div className="text-[12px] text-ink-2">{ndIso(latestStory[1].date)}</div>
              <div className="mt-0.5 text-[17px] font-semibold text-ink">{latestStory[1].title}</div>
              <p className="mt-1 line-clamp-3 text-[14px] leading-snug text-ink-2">{latestStory[1].text}</p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function RingCell({ label, caption, children }: { label: string; caption: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      {children}
      <div className="text-center leading-tight">
        <div className="text-[15px] font-medium text-ink">{label}</div>
        <div className="text-[12px] tabular text-ink-3">{caption}</div>
      </div>
    </div>
  );
}

function BigNumber({ icon, color, value, label, sub }: { icon: React.ReactNode; color: string; value: number; label: string; sub: string }) {
  return (
    <Card className="p-4">
      <Squircle color={color} size={30}>{icon}</Squircle>
      <div className="mt-3 font-display text-[34px] font-semibold leading-none tracking-tight tabular text-ink">{value}</div>
      <div className="mt-1 text-[13px] font-medium text-ink">{label}</div>
      <div className="text-[12px] text-ink-3">{sub}</div>
    </Card>
  );
}

function CollectionRow({ icon, color, title, meta, onClick }: { icon: React.ReactNode; color: string; title: string; meta: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-card-2">
      <Squircle color={color}>{icon}</Squircle>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="block text-[12px] text-ink-2">{meta}</span>
      </span>
      <ChevronRight className="size-4 text-ink-3" />
    </button>
  );
}
