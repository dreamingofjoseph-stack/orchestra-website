import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, ArrowRight, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONCERTS = [
  {
    id: 1,
    title: "Fall Showcase Concert",
    date: "2024-10-15",
    time: "7:00 PM",
    venue: "NCHS Main Auditorium",
    description: "Our season opener featuring all three ensembles performing works by Mozart, Copland, and modern composers.",
    status: "past"
  },
  {
    id: 2,
    title: "Winter Masterworks Concert",
    date: "2024-12-14",
    time: "7:00 PM",
    venue: "NCHS Main Auditorium",
    description: "A magical evening of seasonal classics and major symphonic repertoire. Join us for a festive reception following the performance.",
    status: "upcoming"
  },
  {
    id: 3,
    title: "Pre-Festival Showcase",
    date: "2025-02-28",
    time: "6:30 PM",
    venue: "City Performing Arts Center",
    description: "A special preview of our repertoire prepared for the State Orchestra Assessment.",
    status: "upcoming"
  },
  {
    id: 4,
    title: "Spring Pops & Concerto Concert",
    date: "2025-05-10",
    time: "7:30 PM",
    venue: "NCHS Main Auditorium",
    description: "Featuring our senior concerto competition winners and a selection of film scores, Broadway hits, and popular music.",
    status: "upcoming"
  }
];

export default function Concerts() {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const filteredConcerts = CONCERTS.filter(c => 
    c.title.toLowerCase().includes(filter) || c.description.toLowerCase().includes(filter)
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
          {filteredConcerts.map((concert, index) => {
            const dateObj = new Date(concert.date);
            const month = dateObj.toLocaleString('default', { month: 'short' });
            const day = dateObj.getDate();

            return (
              <motion.div 
                key={concert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative flex flex-col md:flex-row gap-6 bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="shrink-0 flex flex-col items-center justify-center bg-muted/50 rounded-xl p-4 md:w-32 border border-border/50">
                  <span className="text-primary font-bold uppercase tracking-wider text-sm">{month}</span>
                  <span className="text-4xl font-serif font-bold text-foreground">{day}</span>
                  {concert.status === "past" && (
                    <span className="mt-2 text-xs font-medium text-muted-foreground bg-border px-2 py-0.5 rounded-full">Past</span>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-2xl font-serif font-bold mb-3 group-hover:text-primary transition-colors">{concert.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium mb-4">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {concert.time}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {concert.venue}</span>
                  </div>
                  <p className="text-foreground/80 leading-relaxed mb-6">
                    {concert.description}
                  </p>
                  
                  {concert.status === "upcoming" ? (
                    <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/5">
                      Add to Calendar
                    </Button>
                  ) : (
                    <Button variant="ghost" className="text-muted-foreground" asChild>
                      <Link href="/concert-programs" className="flex items-center gap-2">
                        View Program <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </motion.div>
            )
          })}

          {filteredConcerts.length === 0 && (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground">No concerts found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
