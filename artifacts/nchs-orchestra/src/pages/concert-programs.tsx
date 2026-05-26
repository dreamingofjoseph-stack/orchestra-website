import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROGRAMS = [
  { id: 1, title: "Winter Masterworks Concert", date: "Dec 14, 2024", season: "2024-2025" },
  { id: 2, title: "Fall Showcase Concert", date: "Oct 15, 2024", season: "2024-2025" },
  { id: 3, title: "Spring Pops Concert", date: "May 12, 2024", season: "2023-2024" },
  { id: 4, title: "State Assessment Performance", date: "Mar 05, 2024", season: "2023-2024" },
  { id: 5, title: "Winter Gala Concert", date: "Dec 10, 2023", season: "2023-2024" },
  { id: 6, title: "Fall Debut", date: "Oct 20, 2023", season: "2023-2024" },
];

export default function ConcertPrograms() {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const filteredPrograms = PROGRAMS.filter(p => 
    p.title.toLowerCase().includes(filter) || p.season.toLowerCase().includes(filter)
  );

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Concert Programs</h1>
        <p className="text-lg text-muted-foreground">
          Digital archives of our concert program booklets. Browse repertoire, student rosters, and program notes from past performances.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program, index) => (
          <motion.div
            key={program.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            
            <span className="text-xs font-bold uppercase tracking-wider text-accent mb-2">Season {program.season}</span>
            <h3 className="text-xl font-serif font-bold mb-2 leading-tight">{program.title}</h3>
            <p className="text-muted-foreground text-sm font-medium mb-8">{program.date}</p>
            
            <div className="mt-auto pt-6 border-t border-border flex gap-3">
              <Button className="w-full bg-secondary hover:bg-secondary/90">
                View Digital
              </Button>
              <Button variant="outline" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No programs found matching your search.</p>
        </div>
      )}
    </div>
  );
}
