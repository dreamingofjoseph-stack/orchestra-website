import React from "react";
import { motion } from "framer-motion";
import { Heart, Gift, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Boosters() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-6">Orchestra Boosters</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            The NCHS Orchestra Boosters is a parent-volunteer organization dedicated to supporting the musical growth of our students through fundraising, event volunteering, and community advocacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary text-primary-foreground p-8 rounded-2xl"
          >
            <Heart className="w-10 h-10 mb-6 text-accent" />
            <h2 className="text-2xl font-serif font-bold mb-4">Make a Donation</h2>
            <p className="mb-8 text-primary-foreground/80">
              Your tax-deductible donation goes directly toward purchasing new sheet music, instrument repairs, bringing in guest clinicians, and student scholarships.
            </p>
            <Button variant="secondary" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              Donate via PayPal
            </Button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border p-8 rounded-2xl"
          >
            <ShoppingBag className="w-10 h-10 mb-6 text-primary" />
            <h2 className="text-2xl font-serif font-bold mb-4">Current Fundraiser</h2>
            <p className="mb-8 text-muted-foreground">
              <strong>Holiday Poinsettia Sale!</strong> Order beautiful plants for the holiday season while supporting the orchestra's spring trip to Chicago.
            </p>
            <Button variant="outline" className="w-full group">
              Order Online <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        <div className="bg-muted/30 border border-border p-8 md:p-12 rounded-2xl text-center">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-serif font-bold mb-4">Join the Booster Club</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            We meet on the first Tuesday of every month at 7:00 PM in the Orchestra Room. All parents of orchestra students are welcome and encouraged to attend.
          </p>
          <Button>Contact Booster President</Button>
        </div>
      </div>
    </div>
  );
}
