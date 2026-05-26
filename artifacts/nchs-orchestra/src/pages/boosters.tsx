import { motion } from "framer-motion";
import { Heart, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListBoosters, useListBoosterOfficers } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Boosters() {
  const { data: boosters = [], isLoading: boostersLoading } = useListBoosters();
  const { data: officers = [], isLoading: officersLoading } = useListBoosterOfficers();

  const sortedBoosters = [...boosters].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const sortedOfficers = [...officers].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">Orchestra Boosters</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            The NCHS Orchestra Boosters is a parent-volunteer organization dedicated to supporting the musical growth of our students through fundraising, event volunteering, and community advocacy.
          </p>
        </div>

        {/* Donation Link */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-10 text-center mb-12">
          <Heart className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-3">Support the Orchestra</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Your donation directly supports our students' musical journey — from instrument maintenance and sheet music to competition fees and special events.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            data-testid="button-donate"
          >
            <a
              href="https://www.zeffy.com/en-US/donation-form/orchestra-boosters-fundraiser"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Donate Now <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>

        {/* Additional booster activities from admin */}
        {(boostersLoading || sortedBoosters.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {boostersLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-card border border-border p-8 rounded-2xl flex flex-col gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))
            ) : (
              sortedBoosters.map((booster, index) => (
                <motion.div
                  key={booster.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border p-8 rounded-2xl"
                  data-testid={`card-booster-${booster.id}`}
                >
                  {booster.imageUrl && (
                    <img src={booster.imageUrl} alt={booster.title} className="w-full h-32 object-cover rounded-lg mb-6" />
                  )}
                  <h2 className="text-2xl font-serif font-bold mb-3">{booster.title}</h2>
                  <p className="text-muted-foreground">{booster.description}</p>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Booster Officers */}
        <div className="bg-muted/30 border border-border rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2 text-center">Questions? Contact the below officers!</h2>
          <h3 className="text-lg font-semibold text-primary text-center mb-8">Boosters Officers</h3>

          {officersLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          ) : sortedOfficers.length === 0 ? (
            <p className="text-center text-muted-foreground">No officers listed yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {sortedOfficers.map((officer, index) => (
                <motion.div
                  key={officer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                  data-testid={`row-officer-${officer.id}`}
                >
                  <div>
                    <p className="font-semibold text-foreground">{officer.name}, {officer.role}</p>
                  </div>
                  <a
                    href={`mailto:${officer.email}`}
                    className="flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                    data-testid={`link-officer-email-${officer.id}`}
                  >
                    <Mail className="w-4 h-4" />
                    {officer.email}
                  </a>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
