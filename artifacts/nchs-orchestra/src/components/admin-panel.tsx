import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListConcerts, getListConcertsQueryKey,
  useListPrograms, getListProgramsQueryKey,
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
import { LogOut, Lock } from "lucide-react";

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
              <Tabs defaultValue="concerts">
                <TabsList className="mb-6 flex-wrap h-auto gap-1">
                  <TabsTrigger value="concerts">Concerts</TabsTrigger>
                  <TabsTrigger value="programs">Programs</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                  <TabsTrigger value="board">Board</TabsTrigger>
                  <TabsTrigger value="boosters">Boosters</TabsTrigger>
                  <TabsTrigger value="officers">Officers</TabsTrigger>
                </TabsList>
                <TabsContent value="concerts"><ConcertsAdmin /></TabsContent>
                <TabsContent value="programs"><ProgramsAdmin /></TabsContent>
                <TabsContent value="events"><EventsAdmin /></TabsContent>
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

function ConcertsAdmin() {
  const { data: items = [] } = useListConcerts();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "", date: "", time: "", venue: "", description: "", status: "upcoming", imageUrl: "",
  });

  const resetForm = () => {
    setFormData({ title: "", date: "", time: "", venue: "", description: "", status: "upcoming", imageUrl: "" });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({
      title: item.title, date: item.date, time: item.time, venue: item.venue,
      description: item.description || "", status: item.status || "upcoming", imageUrl: item.imageUrl || "",
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await adminFetch(`/api/concerts/${editingId}`, { method: "PATCH", body: JSON.stringify(formData) });
    } else {
      await adminFetch("/api/concerts", { method: "POST", body: JSON.stringify(formData) });
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
                <div className="space-y-1"><Label>Time</Label><Input required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} /></div>
                <div className="space-y-1"><Label>Venue</Label><Input required value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} /></div>
                <div className="space-y-1 col-span-2"><Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="past">Past</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2"><Label>Image URL (optional)</Label><Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} /></div>
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

function ProgramsAdmin() {
  const { data: items = [] } = useListPrograms();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", date: "", description: "", fileUrl: "", imageUrl: "" });

  const resetForm = () => { setFormData({ title: "", date: "", description: "", fileUrl: "", imageUrl: "" }); setEditingId(null); };

  const handleOpenEdit = (item: any) => {
    setFormData({ title: item.title, date: item.date, description: item.description || "", fileUrl: item.fileUrl || "", imageUrl: item.imageUrl || "" });
    setEditingId(item.id); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { await adminFetch(`/api/programs/${editingId}`, { method: "PATCH", body: JSON.stringify(formData) }); }
    else { await adminFetch("/api/programs", { method: "POST", body: JSON.stringify(formData) }); }
    queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
    setOpen(false); resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this program?")) { await adminFetch(`/api/programs/${id}`, { method: "DELETE" }); queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() }); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Programs</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild><Button size="sm">Add Program</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Program</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1"><Label>Title</Label><Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
              <div className="space-y-1"><Label>Date</Label><Input required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} /></div>
              <div className="space-y-1"><Label>Program PDF URL (optional)</Label><Input value={formData.fileUrl} onChange={e => setFormData({ ...formData, fileUrl: e.target.value })} /></div>
              <div className="space-y-1"><Label>Image URL (optional)</Label><Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="border rounded-lg bg-card">
        {items.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">No programs yet.</p>}
        {items.map(item => (
          <div key={item.id} className="p-3 border-b last:border-0 flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="font-medium text-sm truncate">{item.title}</p><p className="text-xs text-muted-foreground">{item.date}</p></div>
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
  const [formData, setFormData] = useState({ title: "", date: "", time: "", description: "", category: "", imageUrl: "" });

  const resetForm = () => { setFormData({ title: "", date: "", time: "", description: "", category: "", imageUrl: "" }); setEditingId(null); };

  const handleOpenEdit = (item: any) => {
    setFormData({ title: item.title, date: item.date, time: item.time, description: item.description || "", category: item.category || "", imageUrl: item.imageUrl || "" });
    setEditingId(item.id); setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { await adminFetch(`/api/events/${editingId}`, { method: "PATCH", body: JSON.stringify(formData) }); }
    else { await adminFetch("/api/events", { method: "POST", body: JSON.stringify(formData) }); }
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
                <div className="space-y-1"><Label>Time</Label><Input required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>Category</Label><Input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Rehearsal" /></div>
              <div className="space-y-1"><Label>Image URL (optional)</Label><Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} /></div>
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
              <div className="space-y-1"><Label>Image URL (optional)</Label><Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} /></div>
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
              <div className="space-y-1"><Label>Image URL (optional)</Label><Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} /></div>
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
              <div className="space-y-1"><Label>Image URL (optional)</Label><Input value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} /></div>
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
