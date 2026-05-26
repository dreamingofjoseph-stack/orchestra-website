import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

import Home from "@/pages/home";
import Concerts from "@/pages/concerts";
import ConcertPrograms from "@/pages/concert-programs";
import Events from "@/pages/events";
import Opportunities from "@/pages/opportunities";
import Board from "@/pages/board";
import Boosters from "@/pages/boosters";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/admin" component={Admin} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/concerts" component={Concerts} />
            <Route path="/concert-programs" component={ConcertPrograms} />
            <Route path="/events" component={Events} />
            <Route path="/opportunities" component={Opportunities} />
            <Route path="/board" component={Board} />
            <Route path="/boosters" component={Boosters} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
