import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Info,
  MapPin,
  Music2,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { Link } from "wouter";
import { useListConcerts, useListEvents } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ScheduleItem = {
  kind: "concert" | "event";
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
  venue?: string;
  category?: string;
  status?: string;
  imageUrl?: string | null;
  dateKey: string;
  dateObject: Date | null;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function parseScheduleDate(value: string) {
  const raw = String(value || "").trim();
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function dateKey(value: string | Date) {
  const date = value instanceof Date ? value : parseScheduleDate(value);
  if (!date || Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function escapeIcs(value: string) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDateTime(date: string, time: string) {
  const parsed = parseScheduleDate(date);
  if (!parsed) return "";
  const timeMatch = String(time || "").match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  let hours = timeMatch ? Number(timeMatch[1]) : 19;
  const minutes = timeMatch?.[2] ? Number(timeMatch[2]) : 0;
  const meridiem = timeMatch?.[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${parsed.getFullYear()}${String(parsed.getMonth() + 1).padStart(2, "0")}${String(parsed.getDate()).padStart(2, "0")}T${String(hours).padStart(2, "0")}${String(minutes).padStart(2, "0")}00`;
}

function makeIcs(items: ScheduleItem[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const events = items
    .filter((item) => item.dateKey)
    .map((item) => {
      const start = icsDateTime(item.date, item.time);
      const endDate = new Date((item.dateObject || new Date()).getTime() + 90 * 60 * 1000);
      const end = icsDateTime(dateKey(endDate), item.time);
      const location = item.venue ? `\nLOCATION:${escapeIcs(item.venue)}` : "";
      const typeLabel = item.kind === "concert" ? "Concert" : item.category || "Orchestra event";
      return [
        "BEGIN:VEVENT",
        `UID:nchs-orchestra-${item.kind}-${item.id}@nchsorchestra.org`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${start}`,
        `DTEND:${end || start}`,
        `SUMMARY:${escapeIcs(`${typeLabel}: ${item.title}`)}`,
        `DESCRIPTION:${escapeIcs(item.description || "NCHS Orchestra schedule")}${location}`,
        "END:VEVENT",
      ].join("\r\n");
    });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NCHS Orchestra//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function downloadIcs(items: ScheduleItem[], filename: string) {
  if (!items.length) return;
  const blob = new Blob([makeIcs(items)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDate(item: ScheduleItem) {
  return item.dateObject ? longDateFormatter.format(item.dateObject) : item.date;
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-2 p-5" data-testid="loading-calendar">
      {Array.from({ length: 35 }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-lg" />
      ))}
    </div>
  );
}

function ItemCalendarButton({ item, compact = false }: { item: ScheduleItem; compact?: boolean }) {
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      onClick={() => downloadIcs([item], `nchs-${item.kind}-${item.id}.ics`)}
      className={compact ? "h-8 gap-1.5 border-primary/20 px-2.5 text-xs text-primary hover:bg-primary/5" : "gap-2 border-primary/20 text-primary hover:bg-primary/5"}
      data-testid={`button-add-calendar-${item.kind}-${item.id}`}
      aria-label={`Add ${item.title} to calendar`}
    >
      <Plus className="h-3.5 w-3.5" />
      {compact ? "Add" : "Add to calendar"}
    </Button>
  );
}

function EventTypeMark({ kind }: { kind: ScheduleItem["kind"] }) {
  if (kind === "concert") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary)/.12)] text-primary">
        <Music2 className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--accent)/.22)] text-[hsl(var(--primary))]">
      <CalendarDays className="h-4 w-4" />
    </span>
  );
}

export default function Concerts() {
  const [filter, setFilter] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [downloaded, setDownloaded] = useState(false);
  const concertsQuery = useListConcerts();
  const eventsQuery = useListEvents();

  useEffect(() => {
    const handleSearch = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setFilter(String(customEvent.detail || "").toLowerCase());
    };
    window.addEventListener("search-query", handleSearch);
    return () => window.removeEventListener("search-query", handleSearch);
  }, []);

  const concerts = Array.isArray(concertsQuery.data) ? concertsQuery.data : [];
  const events = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];
  const isLoading = concertsQuery.isLoading || eventsQuery.isLoading;
  const isError = concertsQuery.isError || eventsQuery.isError;

  const allItems = useMemo<ScheduleItem[]>(() => {
    const concertItems: ScheduleItem[] = concerts.map((concert: any) => ({
      kind: "concert",
      id: concert.id,
      title: concert.title,
      date: concert.date,
      time: concert.time,
      venue: concert.venue,
      description: concert.description,
      status: concert.status,
      imageUrl: concert.imageUrl,
      dateKey: dateKey(concert.date),
      dateObject: parseScheduleDate(concert.date),
    }));
    const eventItems: ScheduleItem[] = events.map((event: any) => ({
      kind: "event",
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      category: event.category,
      description: event.description,
      imageUrl: event.imageUrl,
      dateKey: dateKey(event.date),
      dateObject: parseScheduleDate(event.date),
    }));
    return [...concertItems, ...eventItems].sort((a, b) => {
      if (!a.dateObject && !b.dateObject) return 0;
      if (!a.dateObject) return 1;
      if (!b.dateObject) return -1;
      return a.dateObject.getTime() - b.dateObject.getTime();
    });
  }, [concerts, events]);

  const filteredItems = useMemo(
    () =>
      allItems.filter((item) => {
        const haystack = [item.title, item.description, item.venue, item.category, item.kind]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(filter);
      }),
    [allItems, filter],
  );

  const upcomingConcert = useMemo(() => {
    const today = startOfToday().getTime();
    return allItems.find((item) => item.kind === "concert" && (item.dateObject?.getTime() || 0) >= today)
      || allItems.find((item) => item.kind === "concert");
  }, [allItems]);

  useEffect(() => {
    if (!allItems.length || selectedKey) return;
    const today = startOfToday().getTime();
    const future = allItems.filter((item) => item.dateObject && item.dateObject.getTime() >= today);
    const focusItem = future[0] || [...allItems].reverse().find((item) => item.dateObject);
    if (focusItem?.dateKey) {
      setSelectedKey(focusItem.dateKey);
      if (focusItem.dateObject) setMonthCursor(new Date(focusItem.dateObject.getFullYear(), focusItem.dateObject.getMonth(), 1));
    }
  }, [allItems, selectedKey]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    filteredItems.forEach((item) => {
      if (!item.dateKey) return;
      map.set(item.dateKey, [...(map.get(item.dateKey) || []), item]);
    });
    return map;
  }, [filteredItems]);

  const selectedItems = itemsByDate.get(selectedKey) || [];
  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    return Array.from({ length: 42 }, (_, index) => new Date(year, month, index - firstDay + 1));
  }, [monthCursor]);

  const visibleConcerts = filteredItems.filter((item) => item.kind === "concert");
  const visibleEvents = filteredItems.filter((item) => item.kind === "event");
  const pastCount = allItems.filter((item) => item.dateObject && item.dateObject < startOfToday()).length;

  const handleFullDownload = () => {
    downloadIcs(allItems, "nchs-orchestra-schedule.ics");
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 3500);
  };

  const shiftMonth = (amount: number) => {
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  };

  if (isError) {
    return (
      <div className="schedule-page min-h-[70dvh] px-6 py-16">
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-primary/30 bg-card p-10 text-center shadow-sm" data-testid="status-schedule-error">
          <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary"><RefreshCcw className="h-6 w-6" /></div>
          <h1 className="font-serif text-3xl font-semibold text-primary">The music stand is quiet</h1>
          <p className="mt-3 text-muted-foreground">We could not load the schedule right now. Please try again in a moment.</p>
          <Button className="mt-6 gap-2" onClick={() => { void concertsQuery.refetch(); void eventsQuery.refetch(); }} data-testid="button-retry-schedule">
            <RefreshCcw className="h-4 w-4" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-page min-h-[100dvh] pb-20">
      <section className="container mx-auto px-5 pt-8 md:px-8 md:pt-12">
        <div className="schedule-hero schedule-sheen relative overflow-hidden rounded-[1.75rem] px-6 py-9 text-primary-foreground md:px-11 md:py-12">
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-[hsl(var(--accent))]">
                <span className="h-px w-8 bg-[hsl(var(--accent))]" /> NCHS Orchestra / The season
              </div>
              <h1 className="max-w-3xl font-serif text-5xl font-medium leading-[.98] tracking-[-.035em] md:text-7xl">
                The dates<br /><em className="text-[hsl(var(--accent))]">to keep.</em>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-primary-foreground/75 md:text-lg">
                One dependable place for every rehearsal, audition, and performance. Concerts are the moments that matter most; everything else helps us get there.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  onClick={handleFullDownload}
                  className="schedule-sheen h-12 gap-2 rounded-full bg-[hsl(var(--accent))] px-5 text-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent)/.88)]"
                  data-testid="button-download-full-schedule"
                >
                  {downloaded ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  {downloaded ? "Calendar file ready" : "Copy to Google Calendar"}
                </Button>
                <span className="max-w-[17rem] text-xs leading-5 text-primary-foreground/55">Downloads every concert and event as a standard .ics file for Google Calendar.</span>
              </div>
            </div>

            <div className="staff-mark relative rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[.06] p-5 backdrop-blur-sm md:p-6" data-testid="card-next-concert">
              <div className="mb-7 flex items-center justify-between text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground/55">
                <span>Next concert</span>
                <Music2 className="h-4 w-4 text-[hsl(var(--accent))]" />
              </div>
              {upcomingConcert ? (
                <>
                  <div className="flex items-start gap-4">
                    <div className="min-w-[4.5rem] border-r border-primary-foreground/15 pr-4">
                      <span className="block text-xs uppercase tracking-widest text-[hsl(var(--accent))]">{upcomingConcert.dateObject ? upcomingConcert.dateObject.toLocaleDateString("en-US", { month: "short" }) : "Date"}</span>
                      <span className="block font-serif text-5xl leading-none">{upcomingConcert.dateObject?.getDate() || "—"}</span>
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl leading-tight">{upcomingConcert.title}</h2>
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-primary-foreground/65"><Clock3 className="h-3.5 w-3.5" /> {upcomingConcert.time}</p>
                      {upcomingConcert.venue && <p className="mt-1 flex items-center gap-1.5 text-sm text-primary-foreground/65"><MapPin className="h-3.5 w-3.5" /> {upcomingConcert.venue}</p>}
                    </div>
                  </div>
                  <div className="mt-7 flex items-center justify-between border-t border-primary-foreground/15 pt-4">
                    <button type="button" className="text-sm font-semibold text-[hsl(var(--accent))] underline-offset-4 hover:underline" onClick={() => { if (upcomingConcert.dateKey) { setSelectedKey(upcomingConcert.dateKey); if (upcomingConcert.dateObject) setMonthCursor(new Date(upcomingConcert.dateObject.getFullYear(), upcomingConcert.dateObject.getMonth(), 1)); } }} data-testid="button-view-next-concert">
                      View on calendar
                    </button>
                    <ItemCalendarButton item={upcomingConcert} compact />
                  </div>
                </>
              ) : (
                <div className="py-6 text-sm text-primary-foreground/65" data-testid="text-no-next-concert">No concerts are scheduled yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-border/70 py-5 text-sm text-muted-foreground" data-testid="schedule-summary">
          <span><strong className="mr-1 font-serif text-xl text-primary">{allItems.length}</strong> total dates</span>
          <span><strong className="mr-1 font-serif text-xl text-primary">{concerts.length}</strong> concerts</span>
          <span><strong className="mr-1 font-serif text-xl text-primary">{events.length}</strong> community events</span>
          {pastCount > 0 && <span className="ml-auto hidden text-xs uppercase tracking-[.15em] md:block">{pastCount} archived dates included</span>}
        </div>
      </section>

      <main className="container mx-auto px-5 pt-9 md:px-8 md:pt-12">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-primary">Live calendar</p>
            <h2 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Plan the season.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Select a marked date to see who is gathering, where, and what to bring your attention to.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-primary" /> Concert</span>
            <span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--accent))]" /> Event</span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(19rem,.82fr)]">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_35px_hsl(270_34%_22%/.06)]" data-testid="calendar-panel">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-7">
              <button type="button" onClick={() => shiftMonth(-1)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Previous month" data-testid="button-calendar-previous"><ChevronLeft className="h-5 w-5" /></button>
              <h3 className="font-serif text-2xl text-primary" data-testid="text-calendar-month">{monthFormatter.format(monthCursor)}</h3>
              <button type="button" onClick={() => shiftMonth(1)} className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Next month" data-testid="button-calendar-next"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-7 border-b border-border bg-muted/35 px-3 py-3 md:px-5">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="text-center text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{day}</span>)}
            </div>
            {isLoading ? <CalendarSkeleton /> : (
              <div className="grid grid-cols-7 gap-1.5 p-3 md:gap-2 md:p-5" data-testid="calendar-grid">
                {calendarDays.map((day) => {
                  const key = dateKey(day);
                  const dayItems = itemsByDate.get(key) || [];
                  const inMonth = day.getMonth() === monthCursor.getMonth();
                  const isSelected = key === selectedKey;
                  const isToday = key === dateKey(new Date());
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => dayItems.length && setSelectedKey(key)}
                      disabled={!dayItems.length}
                      className={`schedule-date-button relative min-h-[4.1rem] rounded-xl border p-2 text-left ${inMonth ? "bg-background" : "bg-muted/20 opacity-45"} ${isSelected ? "border-primary bg-primary/[.08] ring-1 ring-primary/20" : "border-transparent"} ${dayItems.length ? "cursor-pointer hover:border-primary/35" : "cursor-default"}`}
                      data-testid={`button-calendar-date-${key}`}
                      aria-label={`${day.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${dayItems.length ? `, ${dayItems.length} schedule item${dayItems.length > 1 ? "s" : ""}` : ""}`}
                    >
                      <span className={`text-sm ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--accent))] font-bold text-[hsl(var(--secondary))]" : isSelected ? "font-bold text-primary" : "text-foreground/70"}`}>{day.getDate()}</span>
                      {dayItems.length > 0 && (
                        <span className="mt-2 flex gap-1">
                          {dayItems.slice(0, 3).map((item) => <i key={`${item.kind}-${item.id}`} className={`h-1.5 w-1.5 rounded-full ${item.kind === "concert" ? "bg-primary" : "bg-[hsl(var(--accent))]"}`} />)}
                          {dayItems.length > 3 && <span className="text-[9px] leading-none text-muted-foreground">+</span>}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="schedule-reveal rounded-2xl border border-primary/15 bg-[hsl(var(--secondary))] p-6 text-primary-foreground shadow-[0_14px_35px_hsl(270_34%_22%/.13)] md:p-7" data-testid="selected-date-panel">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[hsl(var(--accent))]">Selected date</p>
                <h3 className="mt-2 font-serif text-2xl leading-tight md:text-3xl" data-testid="text-selected-date">{selectedKey ? formatDate({ date: selectedKey, dateObject: parseScheduleDate(selectedKey) } as ScheduleItem) : "Choose a date"}</h3>
              </div>
              <CalendarDays className="mt-1 h-5 w-5 text-[hsl(var(--accent))]" />
            </div>
            <div className="mt-7 space-y-3">
              {selectedItems.length ? selectedItems.map((item) => (
                <motion.div key={`${item.kind}-${item.id}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary-foreground/10 bg-primary-foreground/[.07] p-4" data-testid={`card-selected-item-${item.kind}-${item.id}`}>
                  <div className="flex items-start gap-3">
                    <EventTypeMark kind={item.kind} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-[hsl(var(--accent))]">{item.kind === "concert" ? "Concert" : item.category || "Orchestra event"}</span>
                        {item.status === "past" && <Badge className="border-0 bg-primary-foreground/10 text-[10px] text-primary-foreground/65">Past</Badge>}
                      </div>
                      <h4 className="font-serif text-xl leading-tight">{item.title}</h4>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-primary-foreground/65"><Clock3 className="h-3.5 w-3.5" /> {item.time}</p>
                      {item.venue && <p className="mt-1 flex items-center gap-1.5 text-xs text-primary-foreground/65"><MapPin className="h-3.5 w-3.5" /> {item.venue}</p>}
                    </div>
                  </div>
                  {item.description && <p className="mt-4 border-t border-primary-foreground/10 pt-3 text-sm leading-6 text-primary-foreground/70">{item.description}</p>}
                  <div className="mt-4"><ItemCalendarButton item={item} compact /></div>
                </motion.div>
              )) : (
                <div className="rounded-xl border border-dashed border-primary-foreground/20 px-5 py-10 text-center" data-testid="empty-selected-date">
                  <div className="mx-auto mb-3 w-fit rounded-full bg-primary-foreground/10 p-3"><CalendarDays className="h-5 w-5 text-[hsl(var(--accent))]" /></div>
                  <p className="font-serif text-lg">A quiet measure.</p>
                  <p className="mt-1 text-sm leading-5 text-primary-foreground/55">{filter ? "No matching items on this date." : "Select a marked date to see the schedule."}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-16" data-testid="concerts-section">
          <div className="mb-7 flex items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-primary">Center stage</p>
              <h2 className="font-serif text-3xl font-medium text-primary md:text-4xl">Concerts & performances</h2>
            </div>
            <Link href="/concert-programs" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex" data-testid="link-concert-programs">Programs <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2">
              {[0, 1].map((index) => <div key={index} className="rounded-2xl border border-border bg-card p-6"><Skeleton className="mb-6 h-5 w-24" /><Skeleton className="mb-3 h-8 w-3/4" /><Skeleton className="mb-6 h-4 w-1/2" /><Skeleton className="h-12 w-full" /></div>)}
            </div>
          ) : visibleConcerts.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {visibleConcerts.map((item, index) => (
                <motion.article key={`${item.kind}-${item.id}`} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }} transition={{ delay: index * .06 }} className={`group relative overflow-hidden rounded-2xl border bg-card p-6 md:p-7 ${index === 0 ? "border-primary/35 md:col-span-2 md:grid md:grid-cols-[10rem_1fr] md:gap-7" : "border-border"}`} data-testid={`card-concert-${item.id}`}>
                  <div className={`${index === 0 ? "mb-5 md:mb-0" : "mb-5"} flex h-24 w-full items-center justify-between rounded-xl bg-primary/[.07] p-4 md:h-auto md:min-h-32 md:w-auto md:flex-col md:items-start`}>
                    <div><span className="block text-xs font-semibold uppercase tracking-[.18em] text-primary">{item.dateObject?.toLocaleDateString("en-US", { month: "short" }) || item.date}</span><span className="block font-serif text-5xl leading-none text-primary">{item.dateObject?.getDate() || "—"}</span></div>
                    <span className="text-xs font-medium text-muted-foreground">{item.dateObject?.toLocaleDateString("en-US", { weekday: "long" })}</span>
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge className="border-0 bg-primary/10 text-primary">{item.status === "past" ? "Past performance" : "Upcoming concert"}</Badge>
                    </div>
                    <h3 className="font-serif text-2xl leading-tight text-foreground transition-colors group-hover:text-primary md:text-3xl" data-testid={`text-concert-title-${item.id}`}>{item.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-primary" /> {item.time}</span>
                      {item.venue && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {item.venue}</span>}
                    </div>
                    {item.description && <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{item.description}</p>}
                    <div className="mt-6 flex items-center gap-3">
                      {item.status !== "past" && <ItemCalendarButton item={item} />}
                      {item.status === "past" && <Link href="/concert-programs" className="inline-flex h-9 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary" data-testid={`link-program-${item.id}`}>View program <ArrowUpRight className="h-4 w-4" /></Link>}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-primary/25 bg-card px-6 py-14 text-center" data-testid="empty-concerts">
              <Music2 className="mx-auto mb-3 h-7 w-7 text-primary/50" />
              <p className="font-serif text-xl text-primary">{filter ? "No concerts match that search." : "The next downbeat is still being planned."}</p>
              <p className="mt-2 text-sm text-muted-foreground">Check back here for the next performance announcement.</p>
            </div>
          )}
        </section>

        <section className="mt-16" data-testid="events-section">
          <div className="mb-7 border-b border-border pb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-[hsl(var(--primary))]">Around the orchestra</p>
            <h2 className="font-serif text-3xl font-medium md:text-4xl">Rehearsals, auditions & more</h2>
          </div>
          {visibleEvents.length ? (
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {visibleEvents.map((item, index) => (
                <motion.article key={`${item.kind}-${item.id}`} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: index * .04 }} className="grid gap-4 p-5 transition-colors hover:bg-muted/25 md:grid-cols-[8rem_1fr_auto] md:items-center md:gap-7 md:p-6" data-testid={`row-event-${item.id}`}>
                  <div className="flex items-center gap-3 md:block">
                    <span className="font-serif text-2xl text-primary">{item.dateObject?.getDate() || "—"}</span>
                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{item.dateObject?.toLocaleDateString("en-US", { month: "short", year: "numeric" }) || item.date}</span>
                  </div>
                  <div className="flex items-start gap-3"><EventTypeMark kind={item.kind} /><div><div className="mb-1 flex flex-wrap items-center gap-2"><h3 className="font-serif text-xl text-foreground">{item.title}</h3>{item.category && <Badge variant="outline" className="border-primary/20 text-xs text-primary">{item.category}</Badge>}</div><div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {item.time}</span><span className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> {item.description || "NCHS Orchestra schedule"}</span></div></div></div>
                  <ItemCalendarButton item={item} compact />
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center" data-testid="empty-events">
              <p className="font-serif text-xl text-primary">{filter ? "No events match that search." : "No additional dates are posted yet."}</p>
              <p className="mt-2 text-sm text-muted-foreground">Concerts will always appear above when they are announced.</p>
            </div>
          )}
        </section>

        <aside className="mt-16 flex flex-col gap-4 rounded-2xl border border-[hsl(var(--accent)/.45)] bg-[hsl(var(--accent)/.13)] p-6 md:flex-row md:items-center md:justify-between md:p-7" data-testid="calendar-import-help">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-card p-2.5 text-primary shadow-sm"><Download className="h-5 w-5" /></div>
            <div><h2 className="font-serif text-xl text-primary">Take the season with you.</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Download the complete schedule, then open Google Calendar → Settings → Import & export → Import. Choose the .ics file and your family calendar.</p></div>
          </div>
          <Button type="button" onClick={handleFullDownload} variant="outline" className="shrink-0 gap-2 border-primary/25 bg-card text-primary hover:bg-card/70" data-testid="button-download-footer-schedule"><Download className="h-4 w-4" /> Get .ics file</Button>
        </aside>
      </main>
    </div>
  );
}