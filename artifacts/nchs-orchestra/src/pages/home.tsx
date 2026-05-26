import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStaticConcerts } from "@/lib/useData";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: concerts = [], isLoading } = useStaticConcerts();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingConcerts = concerts
    .filter((c: any) => {
      const d = new Date(c.date);
      return !isNaN(d.getTime()) && d >= today;
    })
    .slice(0, 2);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-secondary">
          <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent" />
        </div>

        <div className="container relative z-10 px-6 text-center text-secondary-foreground pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-10 leading-tight">
              Welcome to the <br className="hidden md:block" />
              <span className="text-accent italic">NCHS Orchestra Website</span>
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto font-medium" data-testid="button-view-concerts">
                <Link href="/concerts">
                  View Upcoming Concerts
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-secondary-foreground/20 text-secondary-foreground hover:bg-white/10" data-testid="button-support">
                <Link href="/boosters">
                  Support the Orchestra
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Next on Stage */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Next on Stage</h2>
              <p className="text-muted-foreground">Don't miss our upcoming performances.</p>
            </div>
            <Button asChild variant="link" className="text-primary mt-4 md:mt-0 px-0">
              <Link href="/concerts" className="flex items-center gap-2">
                See all concerts <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[0, 1].map(i => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-8 space-y-3">
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingConcerts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-border">
              <p className="text-muted-foreground text-lg">No upcoming concerts at this time. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {upcomingConcerts.map((concert: any, index: number) => {
                const dateObj = new Date(concert.date);
                const month = isNaN(dateObj.getTime()) ? "" : dateObj.toLocaleString("default", { month: "short" });
                const day = isNaN(dateObj.getTime()) ? "" : dateObj.getDate();

                return (
                  <motion.div
                    key={concert.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm group hover:shadow-md transition-shadow"
                    data-testid={`card-concert-${concert.id}`}
                  >
                    <div className="h-48 bg-secondary relative overflow-hidden">
                      {concert.imageUrl ? (
                        <img
                          src={concert.imageUrl}
                          alt={concert.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-primary/80 group-hover:scale-105 transition-transform duration-700" />
                      )}
                      {month && day && (
                        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur text-foreground px-4 py-2 rounded-lg text-center shadow-sm">
                          <span className="block text-xs font-bold uppercase text-primary">{month}</span>
                          <span className="block text-2xl font-serif font-bold">{day}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-8">
                      <h3 className="text-2xl font-serif font-bold mb-2">{concert.title}</h3>
                      {concert.description && (
                        <p className="text-muted-foreground mb-4 line-clamp-2">{concert.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground/80">
                        {concert.time && (
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {concert.time}</span>
                        )}
                        {concert.venue && (
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {concert.venue}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
