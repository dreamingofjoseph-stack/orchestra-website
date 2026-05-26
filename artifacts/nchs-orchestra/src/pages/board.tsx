import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const LEADERS = [
  { role: "Orchestra Director", name: "Dr. Sarah Maestro", bio: "Dr. Maestro has led the NCHS program for over a decade, previously playing with the State Symphony." },
  { role: "Student President", name: "Alex Chen", bio: "Senior violinist. Alex coordinates student events and acts as the liaison between the director and students." },
  { role: "Vice President", name: "Maya Johnson", bio: "Senior cellist. Maya assists with logistics, uniform management, and event planning." },
  { role: "Treasurer", name: "David Kim", bio: "Junior violist. David manages student accounts, fundraising deposits, and trip payments." },
  { role: "Secretary", name: "Emma Davis", bio: "Junior bassist. Emma handles attendance tracking, announcements, and the orchestra newsletter." },
  { role: "Librarian", name: "James Wilson", bio: "Senior violinist. James is responsible for sorting, bowing, and distributing sheet music for all ensembles." }
];

export default function Board() {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const filtered = LEADERS.filter(l => 
    l.name.toLowerCase().includes(filter) || l.role.toLowerCase().includes(filter)
  );

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Orchestra Board & Leaders</h1>
        <p className="text-lg text-muted-foreground">
          Meet the dedicated students and faculty who work behind the scenes to keep our program running smoothly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((leader, index) => (
          <motion.div
            key={leader.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-muted border-4 border-background shadow-sm rounded-full flex items-center justify-center text-2xl font-serif text-muted-foreground mb-4">
              {leader.name.charAt(0)}
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-1">{leader.name}</h3>
            <span className="text-sm font-bold text-accent uppercase tracking-wider mb-4 block">{leader.role}</span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {leader.bio}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
