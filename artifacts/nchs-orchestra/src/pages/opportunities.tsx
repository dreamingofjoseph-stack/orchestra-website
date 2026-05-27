import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListOpportunities } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Opportunities() {
  const [filter, setFilter] = useState("");
  const { data: opportunities = [], isLoading } = useListOpportunities();

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const filtered = (opportunities as any[]).filter((o: any) =>
    o.title.toLowerCase().includes(filter) || (o.description || "").toLowerCase().includes(filter)
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
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
              <Skeleton className="w-16 h-16 rounded-full mb-6" />
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-20 w-full mb-8" />
              <div className="w-full border-t border-border pt-6">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No opportunities found.
          </div>
        ) : (
          filtered.map((opp: any, index: number) => (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow group"
            >
              {opp.imageUrl ? (
                <img src={opp.imageUrl} alt={opp.title} className="w-full h-40 object-cover rounded-lg mb-6" />
              ) : (
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Award className="w-8 h-8" />
                </div>
              )}

              <h3 className="text-xl font-serif font-bold mb-4">{opp.title}</h3>
              <p className="text-muted-foreground text-sm mb-8 flex-grow leading-relaxed">{opp.description}</p>

              <div className="w-full border-t border-border pt-6">
                {opp.deadline && (
                  <p className="text-xs font-bold text-accent uppercase tracking-wider mb-4">{opp.deadline}</p>
                )}
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                  onClick={() => opp.link && window.open(opp.link, '_blank')}
                  disabled={!opp.link}
                >
                  Learn More <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
