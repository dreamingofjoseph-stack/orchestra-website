import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useListBoardMembers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Board() {
  const [filter, setFilter] = useState("");
  const { data: members = [], isLoading } = useListBoardMembers();

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const sortedMembers = [...members].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  const filtered = sortedMembers.filter(l => 
    l.name.toLowerCase().includes(filter) || (l.role || "").toLowerCase().includes(filter)
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
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center flex flex-col items-center">
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No board members found.
          </div>
        ) : (
          filtered.map((leader, index) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border p-6 rounded-2xl shadow-sm text-center flex flex-col items-center"
            >
              {leader.imageUrl ? (
                <img src={leader.imageUrl} alt={leader.name} className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-sm mb-4" />
              ) : (
                <div className="w-24 h-24 bg-muted border-4 border-background shadow-sm rounded-full flex items-center justify-center text-2xl font-serif text-muted-foreground mb-4">
                  {leader.name.charAt(0)}
                </div>
              )}
              
              <h3 className="text-xl font-serif font-bold text-foreground mb-1">{leader.name}</h3>
              <span className="text-sm font-bold text-accent uppercase tracking-wider mb-4 block">{leader.role}</span>
              {leader.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {leader.bio}
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
