import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const EVENTS = [
  { id: 1, title: "All-State Orchestra Auditions", type: "Audition", date: "Oct 28, 2024", time: "8:00 AM", location: "Regional High School", audience: "Registered Students" },
  { id: 2, title: "Guest Artist Masterclass: Violin", type: "Masterclass", date: "Nov 12, 2024", time: "3:30 PM", location: "Orchestra Room", audience: "All Strings" },
  { id: 3, title: "Concerto Competition Prelims", type: "Competition", date: "Jan 15, 2025", time: "4:00 PM", location: "Auditorium", audience: "Seniors" },
  { id: 4, title: "Chamber Music Festival", type: "Festival", date: "Mar 22, 2025", time: "9:00 AM", location: "State University", audience: "Chamber Groups" },
  { id: 5, title: "Sectional Rehearsal Marathon", type: "Rehearsal", date: "Apr 05, 2025", time: "9:00 AM - 1:00 PM", location: "Music Wing", audience: "All Ensembles" },
];

export default function Events() {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const filteredEvents = EVENTS.filter(e => 
    e.title.toLowerCase().includes(filter) || e.type.toLowerCase().includes(filter)
  );

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Audition': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'Masterclass': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Competition': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'Festival': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Department Events</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Important dates, rehearsals, masterclasses, and auditions for NCHS Orchestra students. 
            For public performances, please see our Concerts page.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {filteredEvents.map((event, index) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 md:p-8 hover:bg-muted/30 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                <div className="shrink-0 w-full md:w-48">
                  <div className="font-bold text-foreground flex items-center gap-2 mb-1">
                    <CalendarIcon className="w-4 h-4 text-primary" /> {event.date}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {event.time}
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-serif font-bold text-foreground">{event.title}</h3>
                    <Badge variant="outline" className={`border-none ${getTypeColor(event.type)}`}>
                      {event.type}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {event.audience}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredEvents.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No events found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
