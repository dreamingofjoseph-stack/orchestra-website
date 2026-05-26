import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useListEvents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Events() {
  const [filter, setFilter] = useState("");
  const { data: events = [], isLoading } = useListEvents();

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    if (isNaN(eventDate.getTime())) return true;
    return eventDate >= today;
  }).filter(e =>
    e.title.toLowerCase().includes(filter) || (e.category || "").toLowerCase().includes(filter)
  );

  const getTypeColor = (type: string) => {
    switch((type || "").toLowerCase()) {
      case 'audition': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'masterclass': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'competition': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'festival': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
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
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="shrink-0 w-full md:w-48 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex-grow space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))
            ) : filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                No events found matching your search.
              </div>
            ) : (
              filteredEvents.map((event, index) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 md:p-8 hover:bg-muted/30 transition-colors flex flex-col md:flex-row gap-6 items-start md:items-center"
                >
                  {event.imageUrl && (
                    <img src={event.imageUrl} alt={event.title} className="w-24 h-24 object-cover rounded-lg shrink-0" />
                  )}
                  
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
                      {event.category && (
                        <Badge variant="outline" className={`border-none ${getTypeColor(event.category)}`}>
                          {event.category}
                        </Badge>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-foreground/80 mt-2 mb-3">{event.description}</p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
