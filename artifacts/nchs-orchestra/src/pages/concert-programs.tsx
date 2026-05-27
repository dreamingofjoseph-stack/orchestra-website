import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListPrograms } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConcertPrograms() {
  const [filter, setFilter] = useState("");
  const { data: programs = [], isLoading } = useListPrograms();

  useEffect(() => {
    const handleSearch = (e: CustomEvent) => setFilter(e.detail.toLowerCase());
    window.addEventListener("search-query" as any, handleSearch);
    return () => window.removeEventListener("search-query" as any, handleSearch);
  }, []);

  const filteredPrograms = (programs as any[]).filter((p: any) =>
    p.title.toLowerCase().includes(filter) || (p.description || "").toLowerCase().includes(filter)
  );

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">Concert Programs</h1>
        <p className="text-lg text-muted-foreground">
          Digital archives of our concert program booklets. Browse repertoire, student rosters, and program notes from past performances.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border p-6 rounded-2xl shadow-sm h-full flex flex-col gap-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="mt-auto pt-6 flex gap-3">
                <Skeleton className="h-10 flex-grow" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No programs found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program: any, index: number) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full"
            >
              {program.imageUrl ? (
                <img src={program.imageUrl} alt={program.title} className="w-full h-40 object-cover rounded-lg mb-6" />
              ) : (
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <h3 className="text-xl font-serif font-bold mb-2 leading-tight">{program.title}</h3>
              <p className="text-muted-foreground text-sm font-medium mb-4">{program.date}</p>

              {program.description && (
                <p className="text-sm text-foreground/80 mb-8">{program.description}</p>
              )}

              <div className="mt-auto pt-6 border-t border-border flex gap-3">
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90"
                  onClick={() => program.fileUrl && window.open(program.fileUrl, '_blank')}
                  disabled={!program.fileUrl}
                >
                  View Digital
                </Button>
                {program.fileUrl && (
                  <Button variant="outline" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" asChild>
                    <a href={program.fileUrl} download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
