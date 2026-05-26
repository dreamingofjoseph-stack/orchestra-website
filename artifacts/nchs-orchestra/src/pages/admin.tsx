import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListConcerts, getListConcertsQueryKey,
  useListPrograms, getListProgramsQueryKey,
  useListEvents, getListEventsQueryKey,
  useListOpportunities, getListOpportunitiesQueryKey,
  useListBoardMembers, getListBoardMembersQueryKey,
  useListBoosters, getListBoostersQueryKey,
  useListBoosterOfficers, getListBoosterOfficersQueryKey
} from "@workspace/api-client-react";
import { adminFetch } from "@/lib/adminFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("adminKey"));
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
      } else {
        setError("Incorrect password");
      }
    } catch (err) {
      setError("Login failed");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-primary/5 flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm w-full max-w-md">
          <h1 className="text-3xl font-serif font-bold text-primary mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-destructive text-sm font-medium">{error}</p>}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold">NCHS Orchestra Admin</h1>
        <Button 
          variant="secondary" 
          onClick={() => {
            localStorage.removeItem("adminKey");
            setIsAuthenticated(false);
          }}
        >
          Logout
        </Button>
      </header>

      <main className="container mx-auto p-6">
        <Tabs defaultValue="concerts">
          <TabsList className="mb-8">
            <TabsTrigger value="concerts">Concerts</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="board">Board Members</TabsTrigger>
            <TabsTrigger value="boosters">Boosters</TabsTrigger>
            <TabsTrigger value="officers">Booster Officers</TabsTrigger>
          </TabsList>

          <TabsContent value="concerts"><ConcertsAdmin /></TabsContent>
          <TabsContent value="programs"><ProgramsAdmin /></TabsContent>
          <TabsContent value="events"><EventsAdmin /></TabsContent>
          <TabsContent value="opportunities"><OpportunitiesAdmin /></TabsContent>
          <TabsContent value="board"><BoardAdmin /></TabsContent>
          <TabsContent value="boosters"><BoostersAdmin /></TabsContent>
          <TabsContent value="officers"><BoosterOfficersAdmin /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ConcertsAdmin() {
  const { data: items = [] } = useListConcerts();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    title: "", date: "", time: "", venue: "", description: "", status: "upcoming", imageUrl: ""
  });

  const resetForm = () => {
    setFormData({ title: "", date: "", time: "", venue: "", description: "", status: "upcoming", imageUrl: "" });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ 
      title: item.title, date: item.date, time: item.time, venue: item.venue, 
      description: item.description || "", status: item.status || "upcoming", imageUrl: item.imageUrl || "" 
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
    if (confirm("Are you sure you want to delete this concert?")) {
      await adminFetch(`/api/concerts/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListConcertsQueryKey() });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Concerts</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild><Button>Add Concert</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Concert</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Date (YYYY-MM-DD)</Label>
                  <Input required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input required value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Image URL (optional)</Label>
                  <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        {items.map(item => (
          <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.date} • {item.venue}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenEdit(item)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
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
  
  const [formData, setFormData] = useState({
    title: "", date: "", description: "", fileUrl: "", imageUrl: ""
  });

  const resetForm = () => {
    setFormData({ title: "", date: "", description: "", fileUrl: "", imageUrl: "" });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ 
      title: item.title, date: item.date, description: item.description || "", 
      fileUrl: item.fileUrl || "", imageUrl: item.imageUrl || "" 
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await adminFetch(`/api/programs/${editingId}`, { method: "PATCH", body: JSON.stringify(formData) });
    } else {
      await adminFetch("/api/programs", { method: "POST", body: JSON.stringify(formData) });
    }
    queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this program?")) {
      await adminFetch(`/api/programs/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListProgramsQueryKey() });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Programs</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild><Button>Add Program</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Program</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Program PDF URL (optional)</Label>
                <Input value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        {items.map(item => (
          <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.date}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenEdit(item)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
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
  
  const [formData, setFormData] = useState({
    title: "", date: "", time: "", description: "", category: "", imageUrl: ""
  });

  const resetForm = () => {
    setFormData({ title: "", date: "", time: "", description: "", category: "", imageUrl: "" });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ 
      title: item.title, date: item.date, time: item.time, 
      description: item.description || "", category: item.category || "", imageUrl: item.imageUrl || "" 
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await adminFetch(`/api/events/${editingId}`, { method: "PATCH", body: JSON.stringify(formData) });
    } else {
      await adminFetch("/api/events", { method: "POST", body: JSON.stringify(formData) });
    }
    queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      await adminFetch(`/api/events/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Events</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild><Button>Add Event</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Title</Label>
                  <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Category</Label>
                  <Input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Rehearsal" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Image URL (optional)</Label>
                  <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        {items.map(item => (
          <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.date} • {item.time}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenEdit(item)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
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
  
  const [formData, setFormData] = useState({
    title: "", description: "", deadline: "", link: "", imageUrl: ""
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", deadline: "", link: "", imageUrl: "" });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ 
      title: item.title, description: item.description || "", 
      deadline: item.deadline || "", link: item.link || "", imageUrl: item.imageUrl || "" 
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await adminFetch(`/api/opportunities/${editingId}`, { method: "PATCH", body: JSON.stringify(formData) });
    } else {
      await adminFetch("/api/opportunities", { method: "POST", body: JSON.stringify(formData) });
    }
    queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this opportunity?")) {
      await adminFetch(`/api/opportunities/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListOpportunitiesQueryKey() });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Opportunities</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild><Button>Add Opportunity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Opportunity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Deadline (optional)</Label>
                <Input value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Link (optional)</Label>
                <Input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        {items.map(item => (
          <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.deadline || "No deadline"}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenEdit(item)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
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
  
  const [formData, setFormData] = useState({
    name: "", role: "", bio: "", imageUrl: "", sortOrder: 0
  });

  const resetForm = () => {
    setFormData({ name: "", role: "", bio: "", imageUrl: "", sortOrder: 0 });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ 
      name: item.name, role: item.role, bio: item.bio || "", 
      imageUrl: item.imageUrl || "", sortOrder: item.sortOrder || 0 
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, sortOrder: Number(formData.sortOrder) };
    if (editingId) {
      await adminFetch(`/api/board/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
      await adminFetch("/api/board", { method: "POST", body: JSON.stringify(payload) });
    }
    queryClient.invalidateQueries({ queryKey: getListBoardMembersQueryKey() });
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this board member?")) {
      await adminFetch(`/api/board/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListBoardMembersQueryKey() });
    }
  };

  const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Board Members</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild><Button>Add Member</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Board Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        {sortedItems.map(item => (
          <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
            <div>
              <h3 className="font-bold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.role}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenEdit(item)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
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

  const resetForm = () => {
    setFormData({ name: "", role: "", email: "", sortOrder: 0 });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ name: item.name, role: item.role, email: item.email, sortOrder: item.sortOrder ?? 0 });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, sortOrder: Number(formData.sortOrder) };
    if (editingId) {
      await adminFetch(`/api/booster-officers/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
      await adminFetch("/api/booster-officers", { method: "POST", body: JSON.stringify(payload) });
    }
    queryClient.invalidateQueries({ queryKey: getListBoosterOfficersQueryKey() });
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Remove this officer?")) {
      await adminFetch(`/api/booster-officers/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListBoosterOfficersQueryKey() });
    }
  };

  const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Booster Officers</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild><Button>Add Officer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Officer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Role / Title</Label>
                <Input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        {sorted.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No officers yet.</p>
        ) : sorted.map(item => (
          <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
            <div>
              <p className="font-bold">{item.name} — {item.role}</p>
              <p className="text-sm text-muted-foreground">{item.email}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenEdit(item)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
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
  
  const [formData, setFormData] = useState({
    title: "", description: "", type: "", imageUrl: "", sortOrder: 0
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", type: "", imageUrl: "", sortOrder: 0 });
    setEditingId(null);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ 
      title: item.title, description: item.description || "", 
      type: item.type || "", imageUrl: item.imageUrl || "", sortOrder: item.sortOrder || 0 
    });
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, sortOrder: Number(formData.sortOrder) };
    if (editingId) {
      await adminFetch(`/api/boosters/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
    } else {
      await adminFetch("/api/boosters", { method: "POST", body: JSON.stringify(payload) });
    }
    queryClient.invalidateQueries({ queryKey: getListBoostersQueryKey() });
    setOpen(false);
    resetForm();
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this booster activity?")) {
      await adminFetch(`/api/boosters/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: getListBoostersQueryKey() });
    }
  };

  const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Boosters</h2>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm(); }}>
          <DialogTrigger asChild><Button>Add Booster Activity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Booster Activity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Type (e.g. donation, fundraiser)</Label>
                <Input required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        {sortedItems.map(item => (
          <div key={item.id} className="p-4 border-b last:border-0 flex items-center justify-between">
            <div>
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.type}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenEdit(item)}>Edit</Button>
              <Button variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
