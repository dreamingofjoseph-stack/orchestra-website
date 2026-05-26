import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Music, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const OPPORTUNITIES = [
  {
    id: 1,
    title: "Regional & All-State Orchestra",
    icon: Award,
    description: "Audition for a chance to perform with the best musicians in the state. Requirements include scales, sight-reading, and a prepared solo.",
    deadline: "Registration due September 15",
  },
  {
    id: 2,
    title: "Concerto Competition",
    icon: Music,
    description: "Open to seniors. The winner performs a concerto movement accompanied by the Symphony Orchestra at the Spring Concert.",
    deadline: "Applications due December 1",
  },
  {
    id: 3,
    title: "Chamber Music Ensembles",
    icon: BookOpen,
    description: "Form a string quartet or quintet with peers. Receive specialized coaching and perform at community events and festivals.",
    deadline: "Ongoing registration",
  }
];

export default function Opportunities() {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const filtered = OPPORTUNITIES.filter(o => 
    o.title.toLowerCase().includes(filter) || o.description.toLowerCase().includes(filter)
  );

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Student Opportunities</h1>
        <p className="text-lg text-muted-foreground">
          Take your musicianship to the next level. Explore auditions, competitions, and special ensembles available to NCHS students.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filtered.map((opp, index) => (
          <motion.div
            key={opp.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <opp.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold mb-4">{opp.title}</h3>
            <p className="text-muted-foreground text-sm mb-8 flex-grow leading-relaxed">
              {opp.description}
            </p>
            <div className="w-full border-t border-border pt-6">
              <p className="text-xs font-bold text-accent uppercase tracking-wider mb-4">{opp.deadline}</p>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                Learn More <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
