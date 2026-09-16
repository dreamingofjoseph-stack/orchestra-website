import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListConcerts, getListConcertsQueryKey,
  useListEvents, getListEventsQueryKey,
  useListOpportunities, getListOpportunitiesQueryKey,
  useListBoardMembers, getListBoardMembersQueryKey,
  useListBoosters, getListBoostersQueryKey,
  useListBoosterOfficers, getListBoosterOfficersQueryKey,
} from "@workspace/api-client-react";
import { adminFetch } from "@/lib/adminFetch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AdminImageUpload } from "@/components/admin-image-upload";
import { CalendarDays, LogOut, Lock, Music2 } from "lucide-react";

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TimePeriod = "AM" | "PM";
type CalendarKind = "concert" | "event";

type CalendarFormData = {
  kind: CalendarKind;
  title: string;
  date: string;
  time: string;
  timePeriod: TimePeriod;
  venue: string;
  description: string;
  status: string;
  category: string;
  imageUrl: string;
};

type CalendarAdminItem = CalendarFormData & { id: number };

function splitTimeValue(value: string): { clock: string; period: TimePeriod } {
  const normalized = String(value || "").trim();
  const twelveHourMatch = normalized.match(/^(.+?)\s*(am|pm)$/i);

  if (twelveHourMatch) {
    return {
      clock: twelveHourMatch[1].trim(),
      period: twelveHourMatch[2].toUpperCase() as TimePeriod,
    };
  }

  const twentyFourHourMatch = normalized.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = twentyFourHourMatch[2] || "00";
    return {
      clock: `${hours % 12 || 12}:${minutes}`,
      period: hours >= 12 ? "PM" : "AM",
    };
  }

  return { clock: normalized, period: "PM" };
}

function formatTimeValue(clock: string, period: TimePeriod) {
  return `${clock.trim()} ${period}`;
}

function createEmptyCalendarForm(kind: CalendarKind = "concert"): CalendarFormData {
  return {
    kind,
    title: "",
    date: "",
    time: "",
    timePeriod: "PM",
    venue: "",
    description: "",
    status: "upcoming",
    category: "",
    imageUrl: "",
  };
}

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("adminKey")
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem("adminKey", password);
        setIsAuthenticated(true);
        setError("");
        setPassword("");
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Cannot connect to the local admin server. Make sure it's running.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminKey");
    setIsAuthenticated(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b bg-primary text-primary-foreground flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-primary-foreground font-serif text-xl">
              Site Editor
            </SheetTitle>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-primary-foreground hover:bg-primary-foreground/20 gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            )}
          </div>
        </SheetHeader>

        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold font-serif">Admin Login</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your password to edit site content
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                {error && (
                  <p className="text-destructive text-sm font-medium">{error}</p>
                )}
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-6">
              <Tabs defaultValue="calendar">
                <TabsList className="mb-6 flex-wrap h-auto gap-1">
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                  <TabsTrigger value="board">Board</TabsTrigger>
                  <TabsTrigger value="boosters">Boosters</TabsTrigger>
                  <TabsTrigger value="officers">Officers</TabsTrigger>
                </TabsList>
                <TabsContent value="calendar"><CalendarAdmin /></TabsContent>
                <TabsContent value="opportunities"><OpportunitiesAdmin /></TabsContent>
                <TabsContent value="board"><BoardAdmin /></TabsContent>
                <TabsContent value="boosters"><BoostersAdmin /></TabsContent>
                <TabsContent value="officers"><BoosterOfficersAdmin /></TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CalendarAdmin() {
  const { data: concerts = [] } = useListConcerts();
  const { data: events = [] } = useListEvents();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ kind: CalendarKind; id: number } | null>(null);
  const [formData, setFormData] = useState<CalendarFormData>(() => createEmptyCalendarForm());
  const [formError, setFormError] = useState("");

  const items = useMemo<CalendarAdminItem[]>(
    () => [
      ...concerts.map((item: any) => ({
        ...createEmptyCalendarForm("concert"),
        kind: "concert" as const,
        id: item.id,
        title: item.title,
        date: item.date,
        time: item.time,
        venue: item.venue || "",
        description: item.description || "",
        status: item.status || "upcoming",
        imageUrl: item.imageUrl || "",
      })),
      ...events.map((item: any) => ({
        ...createEmptyCalendarForm("event"),
        kind: "event" as const,
        id: item.id,
        title: item.title,
        date: item.date,
        time: item.time,
        description: item.description || "",
        category: item.category || "",
        imageUrl: item.imageUrl || "",
      })),
    ].sort((a, b) => {
      const dateOrder = String(a.date).localeCompare(String(b.date));
      if (dateOrder !== 0) return dateOrder;
      const timeOrder = String(a.time).localeCompare(String(b.time));
      if (timeOrder !== 0) return timeOrder;
      if (a.kind !== b.kind) return a.kind === "concert" ? -1 : 1;
      return a.id - b.id;
    }),
    [concerts, events],
  );

  const resetForm = (kind: CalendarKind = "concert") => {
    setFormData(createEmptyCalendarForm(kind));
    setEditing(null);
    setFormError("");
  };

  const handleOpenCreate = (kind: CalendarKind) => {
    resetForm(kind);
    setOpen(true);
  };

  const handleOpenEdit = (item: CalendarAdminItem) => {
    const parsedTime = splitTimeValue(item.time);
    setFormData({ ...item, time: parsedTime.clock, timePeriod: parsedTime.period });
    setEditing({ kind: item.kind, id: item.id });
    setFormError("");
    setOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.time.trim()) {
      setFormError("Please enter a time.");
      return;
    }

    const payload = formData.kind === "concert"
      ? {
          title: formData.title,
          date: formData.date,
          time: formatTimeValue(formData.time, formData.timePeriod),
          venue: formData.venue,
          description: formData.description,
          status: formData.status,
          imageUrl: formData.imageUrl || null,
        }
      : {
          title: formData.title,
          date: formData.date,
          time: formatTimeValue(formData.time, formData.timePeriod),
          description: formData.description,
          category: formData.category,
          imageUrl: formData.imageUrl || null,
        };

    try {
      const basePath = formData.kind === "concert" ? "/api/concerts" : "/api/events";
      const url = editing ? `${basePath}/${editing.id}` : basePath;
      const response = await adminFetch(url, {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("The schedule item could not be saved.");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListConcertsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }),
      ]);
      setOpen(false);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The schedule item could not be saved.");
    }
  };

  const handleDelete = async (item: CalendarAdminItem) => {
    if (!confirm(`Delete this ${item.kind}?`)) return;

    const response = await adminFetch(`/api/${item.kind === "concert" ? "concerts" : "events"}/${item.id}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListConcertsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }),
    ]);
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Combined calendar</h2>
          <p className="text-sm text-muted-foreground">Manage concerts and orchestra events in date order.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleOpenCreate("event")}>New event</Button>
          <Button size="sm" onClick={() => handleOpenCreate("concert")}>New concert</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No calendar items yet.</p>}
        {items.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 border-b p-3 last:border-0">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`mt-0.5 rounded-full p-2 ${item.kind === "concert" ? "bg-primary/10 text-primary" : "bg-accent/25 text-primary"}`}>
                {item.kind === "concert" ? <Music2 className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.kind}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.date} · {item.time}{item.venue ? ` · ${item.venue}` : item.category ? ` · ${item.category}` : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(item)}>Del</Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} {formData.kind === "concert" ? "Concert" : "Event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Title</Label><Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Date (YYYY-MM-DD)</Label><Input required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
              <div className="space-y-1">
                <Label>Time</Label>
                <div className="flex gap-2">
                  <Input required placeholder="7:00" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
                  <Select value={formData.timePeriod} onValueChange={(value: TimePeriod) => setFormData({ ...formData, timePeriod: value })}>
                    <SelectTrigger className="w-[5.5rem]"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              {formData.kind === "concert" ? (
                <>
                  <div className="col-span-2 space-y-1"><Label>Venue</Label><Input required value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} /></div>
                  <div className="col-span-2 space-y-1">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="past">Past</SelectItem></SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="col-span-2 space-y-1"><Label>Category</Label><Input required placeholder="e.g. Rehearsal" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} /></div>
              )}
              <div className="col-span-2 space-y-1"><Label>Image (optional)</Label><AdminImageUpload value={formData.imageUrl} onChange={(imageUrl) => setFormData({ ...formData, imageUrl })} /></div>
              <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
            </div>
            {formError && <p className="text-sm font-medium text-destructive">{formError}</p>}
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConcertsAdmin() {
  const { data: items = [] } = useListConcerts();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "", date: "", time: "", timePeriod: "PM" as TimePeriod, venue: "", description: "", status: "upcoming", imageUrl: "",
  });

  const resetForm = () => {
    setFormData({ title: "", date: "", time: "", timePeriod: "PM", venue: "", description: "", status: "upcoming", imageUrl: "" });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    const parsedTime = splitTimeValue(item.time);
    setFormData({
      title: item.title, date: item.date, time: parsedTime.clock, timePeriod: parsedTime.period, venue: item.venue,
      description: item.description || "", status: item.status || "upcoming", imageUrl: item.imageUrl || "",
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, time: formatTimeValue(formData.time, formData.timePeriod) };
    if (editingId) {
      await adminFetch(`/api/concerts/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
      await adminFetch("/api/concerts", { method: "POST", body: JSON.stringify(payload) });
    }
    queryClient.invalidateQueries({ queryKey: getListConcertsQueryKey() });
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this concert?")) {
      await adminFetch(`/api/concerts/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListConcertsQueryKey() });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Concerts</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm">Add Concert</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Concert</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Title</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
                <div className="space-y-1"><Label>Date (YYYY-MM-DD)</Label><Input required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                <div className="space-y-1">
                  <Label>Time</Label>
                  <div className="flex gap-2">
                    <Input required placeholder="7:00" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                    <Select value={formData.timePeriod} onValueChange={(value: TimePeriod) => setFormData({ ...formData, timePeriod: value })}>
                      <SelectTrigger className="w-[5.5rem]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1"><Label>Venue</Label><Input required value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} /></div>
                <div className="space-y-1 col-span-2"><Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="past">Past</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2"><Label>Image (optional)</Label><AdminImageUpload value={formData.imageUrl} onChange={(imageUrl) => setFormData({ ...formData, imageUrl })} /></div>
                <div className="space-y-1 col-span-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg bg-card">
        {items.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No concerts yet.</p>}
        {items.map(item => (
          <div key={item.id} className="p-3 border-b last:border-0 flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-medium text-sm truncate">{item.title}</p><p className="text-xs text-muted-foreground">{item.date} · {item.venue}</p></div>
            <div className="flex gap-1 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Del</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsAdmin() {
  const { data: items = [] } = useListEvents();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", date: "", time: "", timePeriod: "PM" as TimePeriod, description: "", category: "", imageUrl: "" });

  const resetForm = () => { setFormData({ title: "", date: "", time: "", timePeriod: "PM", description: "", category: "", imageUrl: "" }); setEditingId(null); };

  const handleOpenEdit = (item: any) => {
    const parsedTime = splitTimeValue(item.time);
    setFormData({ title: item.title, date: item.date, time: parsedTime.clock, timePeriod: parsedTime.period, description: item.description || "", category: item.category || "", imageUrl: item.imageUrl || "" });
    setEditingId(item.id); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, time: formatTimeValue(formData.time, formData.timePeriod) };
    if (editingId) { await adminFetch(`/api/events/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) }); }
    else { await adminFetch("/api/events", { method: "POST", body: JSON.stringify(payload) }); }
    queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    setOpen(false); resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this event?")) { await adminFetch(`/api/events/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Events</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm">Add Event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Event</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Date</Label><Input required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
                <div className="space-y-1">
                  <Label>Time</Label>
                  <div className="flex gap-2">
                    <Input required placeholder="7:00" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                    <Select value={formData.timePeriod} onValueChange={(value: TimePeriod) => setFormData({ ...formData, timePeriod: value })}>
                      <SelectTrigger className="w-[5.5rem]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-1"><Label>Category</Label><Input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Rehearsal" /></div>
              <div className="space-y-1"><Label>Image (optional)</Label><AdminImageUpload value={formData.imageUrl} onChange={(imageUrl) => setFormData({ ...formData, imageUrl })} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg bg-card">
        {items.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No events yet.</p>}
        {items.map(item => (
          <div key={item.id} className="p-3 border-b last:border-0 flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-medium text-sm truncate">{item.title}</p><p className="text-xs text-muted-foreground">{item.date} · {item.time}</p></div>
            <div className="flex gap-1 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Del</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpportunitiesAdmin() {
  const { data: items = [] } = useListOpportunities();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", deadline: "", link: "", imageUrl: "" });

  const resetForm = () => { setFormData({ title: "", description: "", deadline: "", link: "", imageUrl: "" }); setEditingId(null); };

  const handleOpenEdit = (item: any) => {
    setFormData({ title: item.title, description: item.description || "", deadline: item.deadline || "", link: item.link || "", imageUrl: item.imageUrl || "" });
    setEditingId(item.id); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { await adminFetch(`/api/opportunities/${editingId}`, { method: "PATCH", body: JSON.stringify(formData) }); }
    else { await adminFetch("/api/opportunities", { method: "POST", body: JSON.stringify(formData) }); }
    queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
    setOpen(false); resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this opportunity?")) { await adminFetch(`/api/opportunities/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() }); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Opportunities</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm">Add Opportunity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Opportunity</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Deadline (optional)</Label><Input value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} /></div>
              <div className="space-y-1"><Label>Link (optional)</Label><Input value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} /></div>
              <div className="space-y-1"><Label>Image (optional)</Label><AdminImageUpload value={formData.imageUrl} onChange={(imageUrl) => setFormData({ ...formData, imageUrl })} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg bg-card">
        {items.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No opportunities yet.</p>}
        {items.map(item => (
          <div key={item.id} className="p-3 border-b last:border-0 flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-medium text-sm truncate">{item.title}</p><p className="text-xs text-muted-foreground">{item.deadline || "No deadline"}</p></div>
            <div className="flex gap-1 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Del</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardAdmin() {
  const { data: items = [] } = useListBoardMembers();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", role: "", bio: "", imageUrl: "", sortOrder: 0 });

  const resetForm = () => { setFormData({ name: "", role: "", bio: "", imageUrl: "", sortOrder: 0 }); setEditingId(null); };

  const handleOpenEdit = (item: any) => {
    setFormData({ name: item.name, role: item.role, bio: item.bio || "", imageUrl: item.imageUrl || "", sortOrder: item.sortOrder || 0 });
    setEditingId(item.id); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, sortOrder: Number(formData.sortOrder) };
    if (editingId) { await adminFetch(`/api/board/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) }); }
    else { await adminFetch("/api/board", { method: "POST", body: JSON.stringify(payload) }); }
    queryClient.invalidateQueries({ queryKey: getListBoardMembersQueryKey() });
    setOpen(false); resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this board member?")) { await adminFetch(`/api/board/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: getListBoardMembersQueryKey() }); }
  };

  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Board Members</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm">Add Member</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Board Member</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1"><Label>Name</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Role</Label><Input required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} /></div>
              <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Image (optional)</Label><AdminImageUpload value={formData.imageUrl} onChange={(imageUrl) => setFormData({ ...formData, imageUrl })} /></div>
              <div className="space-y-1"><Label>Bio</Label><Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg bg-card">
        {sorted.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No board members yet.</p>}
        {sorted.map(item => (
          <div key={item.id} className="p-3 border-b last:border-0 flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-medium text-sm truncate">{item.name}</p><p className="text-xs text-muted-foreground">{item.role}</p></div>
            <div className="flex gap-1 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Del</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoosterOfficersAdmin() {
  const { data: items = [] } = useListBoosterOfficers();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", role: "", email: "", sortOrder: 0 });

  const resetForm = () => { setFormData({ name: "", role: "", email: "", sortOrder: 0 }); setEditingId(null); };

  const handleOpenEdit = (item: any) => {
    setFormData({ name: item.name, role: item.role, email: item.email, sortOrder: item.sortOrder ?? 0 });
    setEditingId(item.id); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, sortOrder: Number(formData.sortOrder) };
    if (editingId) { await adminFetch(`/api/booster-officers/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) }); }
    else { await adminFetch("/api/booster-officers", { method: "POST", body: JSON.stringify(payload) }); }
    queryClient.invalidateQueries({ queryKey: getListBoosterOfficersQueryKey() });
    setOpen(false); resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Remove this officer?")) { await adminFetch(`/api/booster-officers/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: getListBoosterOfficersQueryKey() }); }
  };

  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Booster Officers</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm">Add Officer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Officer</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1"><Label>Name</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Role / Title</Label><Input required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email</Label><Input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg bg-card">
        {sorted.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No officers yet.</p>}
        {sorted.map(item => (
          <div key={item.id} className="p-3 border-b last:border-0 flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-medium text-sm">{item.name} — {item.role}</p><p className="text-xs text-muted-foreground">{item.email}</p></div>
            <div className="flex gap-1 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Del</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoostersAdmin() {
  const { data: items = [] } = useListBoosters();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", type: "", imageUrl: "", sortOrder: 0 });

  const resetForm = () => { setFormData({ title: "", description: "", type: "", imageUrl: "", sortOrder: 0 }); setEditingId(null); };

  const handleOpenEdit = (item: any) => {
    setFormData({ title: item.title, description: item.description || "", type: item.type || "", imageUrl: item.imageUrl || "", sortOrder: item.sortOrder || 0 });
    setEditingId(item.id); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, sortOrder: Number(formData.sortOrder) };
    if (editingId) { await adminFetch(`/api/boosters/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) }); }
    else { await adminFetch("/api/boosters", { method: "POST", body: JSON.stringify(payload) }); }
    queryClient.invalidateQueries({ queryKey: getListBoostersQueryKey() });
    setOpen(false); resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this booster activity?")) { await adminFetch(`/api/boosters/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: getListBoostersQueryKey() }); }
  };

  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Boosters</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm">Add Activity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Booster Activity</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Type (e.g. donation, fundraiser)</Label><Input required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} /></div>
              <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Image (optional)</Label><AdminImageUpload value={formData.imageUrl} onChange={(imageUrl) => setFormData({ ...formData, imageUrl })} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg bg-card">
        {sorted.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No booster activities yet.</p>}
        {sorted.map(item => (
          <div key={item.id} className="p-3 border-b last:border-0 flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-medium text-sm truncate">{item.title}</p><p className="text-xs text-muted-foreground">{item.type}</p></div>
            <div className="flex gap-1 flex-shrink-0"><Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Del</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
