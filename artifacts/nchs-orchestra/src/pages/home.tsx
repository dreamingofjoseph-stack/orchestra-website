import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Music, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image / Overlay */}
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
            <span className="inline-block py-1 px-3 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium mb-6 uppercase tracking-widest">
              Season 2024-2025
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              A Tradition of <br className="hidden md:block" />
              <span className="text-accent italic">Musical Excellence</span>
            </h1>
            <p className="text-lg md:text-xl text-secondary-foreground/80 max-w-2xl mx-auto mb-10 font-light">
              Welcome to the proud digital home of the NCHS Orchestra program.
              Join us for a season of inspiring performances and artistry.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto font-medium">
                <Link href="/concerts">
                  View Upcoming Concerts
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto border-secondary-foreground/20 text-secondary-foreground hover:bg-white/10">
                <Link href="/boosters">
                  Support the Orchestra
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-serif font-bold text-primary mb-6">Welcome to NCHS Orchestra</h2>
            <div className="w-16 h-1 bg-accent mx-auto mb-8" />
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              The NCHS Orchestra is composed of over 150 talented student musicians across three distinct ensembles. Dedicated to the pursuit of artistic growth, our program provides students with the opportunity to perform standard symphonic repertoire, engage in masterclasses with renowned clinicians, and share their passion for music with the community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-16">
            {[
              { icon: Music, title: "3 Ensembles", desc: "Symphony, Philharmonic & String" },
              { icon: Users, title: "150+ Students", desc: "Dedicated musicians" },
              { icon: Calendar, title: "8 Concerts", desc: "Annually performed" },
              { icon: Star, title: "State Recognized", desc: "Award-winning program" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-card border border-border shadow-sm"
              >
                <div className="w-12 h-12 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <stat.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{stat.title}</h3>
                <p className="text-sm text-muted-foreground">{stat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Highlight */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Featured Concert Card */}
            <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm group hover:shadow-md transition-shadow">
              <div className="h-48 bg-secondary relative">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1594122230689-45899d9e6f69?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 left-4 bg-background/95 backdrop-blur text-foreground px-4 py-2 rounded-lg text-center shadow-sm">
                  <span className="block text-xs font-bold uppercase text-primary">Dec</span>
                  <span className="block text-2xl font-serif font-bold">14</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold mb-2">Winter Masterworks Concert</h3>
                <p className="text-muted-foreground mb-4">Featuring works by Tchaikovsky, Holst, and contemporary seasonal pieces.</p>
                <div className="flex items-center gap-4 text-sm font-medium text-foreground/80">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> 7:00 PM</span>
                  <span className="flex items-center gap-1.5">NCHS Auditorium</span>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm group hover:shadow-md transition-shadow">
              <div className="h-48 bg-primary/90 relative">
                 <div className="absolute top-4 left-4 bg-background/95 backdrop-blur text-foreground px-4 py-2 rounded-lg text-center shadow-sm">
                  <span className="block text-xs font-bold uppercase text-primary">Feb</span>
                  <span className="block text-2xl font-serif font-bold">28</span>
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold mb-2">Pre-Festival Showcase</h3>
                <p className="text-muted-foreground mb-4">A special preview of our repertoire for the State Orchestra Assessment.</p>
                <div className="flex items-center gap-4 text-sm font-medium text-foreground/80">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> 6:30 PM</span>
                  <span className="flex items-center gap-1.5">Performing Arts Center</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
