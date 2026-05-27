import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useListConcerts } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Concerts() {
  const [filter, setFilter] = useState("");
  const { data: concerts = [], isLoading } = useListConcerts();

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const filteredConcerts = (concerts as any[]).filter((c: any) =>
    c.title.toLowerCase().includes(filter) || (c.description || "").toLowerCase().includes(filter)
  );

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Concerts & Performances</h1>
          <p className="text-lg text-muted-foreground">
            Join us for an unforgettable season of music. All concerts are free and open to the public unless otherwise noted.
          </p>
        </div>

        <div className="space-y-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
                <Skeleton className="w-32 h-32 rounded-xl" />
                <div className="flex-grow space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))
          ) : filteredConcerts.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground">No concerts found matching your search.</p>
            </div>
          ) : (
            filteredConcerts.map((concert: any, index: number) => {
              const dateObj = new Date(concert.date);
              const month = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleString('default', { month: 'short' });
              const day = isNaN(dateObj.getTime()) ? "" : dateObj.getDate();

              return (
                <motion.div
                  key={concert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative flex flex-col md:flex-row gap-6 bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                  <div className="shrink-0 flex flex-col items-center justify-center bg-muted/50 rounded-xl p-4 md:w-32 border border-border/50">
                    <span className="text-primary font-bold uppercase tracking-wider text-sm">{month || concert.date}</span>
                    <span className="text-4xl font-serif font-bold text-foreground">{day}</span>
                    {concert.status === "past" && (
                      <span className="mt-2 text-xs font-medium text-muted-foreground bg-border px-2 py-0.5 rounded-full">Past</span>
                    )}
                  </div>

                  <div className="flex-grow">
                    {concert.imageUrl && (
                      <img src={concert.imageUrl} alt={concert.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                    )}
                    <h3 className="text-2xl font-serif font-bold mb-3 group-hover:text-primary transition-colors">{concert.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium mb-4">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {concert.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {concert.venue}</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed mb-6">{concert.description}</p>

                    {concert.status === "upcoming" ? (
                      <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/5">
                        Add to Calendar
                      </Button>
                    ) : (
                      <Link href="/concert-programs" className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 text-muted-foreground gap-2 px-3 py-2">
                        View Program <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
