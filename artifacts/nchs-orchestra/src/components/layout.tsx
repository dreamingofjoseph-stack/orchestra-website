import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, ChevronDown, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminPanel } from "@/components/admin-panel";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("search-query", { detail: searchQuery }));
  }, [searchQuery]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Concerts & Events", href: "/concerts" },
    { label: "Opportunities", href: "/opportunities" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm py-3"
            : "bg-background/50 backdrop-blur-sm py-5"
        }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl group-hover:scale-105 transition-transform">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg leading-tight tracking-wide">
                NCHS Orchestra
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="px-4 py-2 rounded-md text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors flex items-center gap-1 outline-none">
                More <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border shadow-lg">
                <DropdownMenuItem asChild>
                  <Link href="/board" className="w-full cursor-pointer">
                    Orchestra Board & Leaders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/boosters" className="w-full cursor-pointer">
                    Boosters & Fundraisers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer flex items-center gap-2 text-muted-foreground"
                  onSelect={() => setIsAdminOpen(true)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Site
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center ml-2 relative">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden mr-2"
                  >
                    <input
                      type="text"
                      placeholder="Search page..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-muted border-none rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-full hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-24">{children}</main>

      <footer className="bg-secondary text-secondary-foreground py-12 mt-20">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-serif font-bold text-lg">
                N
              </div>
              <span className="font-serif font-bold text-xl">NCHS Orchestra</span>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 font-serif text-accent">Quick Links</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
               <li><Link href="/concerts" className="hover:text-white transition-colors">Concerts & events</Link></li>
              <li><Link href="/opportunities" className="hover:text-white transition-colors">Student Opportunities</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 font-serif text-accent">Contact</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li>NCHS Music Department</li>
              <li>123 Orchestra Way</li>
              <li>City, State 12345</li>
              <li>director@nchsorchestra.org</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-6 mt-12 pt-8 border-t border-white/10 text-sm text-secondary-foreground/50 text-center">
          &copy; {new Date().getFullYear()} NCHS Orchestra. All rights reserved.
        </div>
      </footer>

      <AdminPanel open={isAdminOpen} onOpenChange={setIsAdminOpen} />
    </div>
  );
}
