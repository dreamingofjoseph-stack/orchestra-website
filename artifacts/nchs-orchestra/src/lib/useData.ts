import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL;

const fetchJson = <T>(file: string): Promise<T[]> =>
  fetch(`${BASE}data/${file}`).then((r) => {
    if (!r.ok) throw new Error(`Failed to load ${file}: ${r.status}`);
    return r.json();
  });

export const useStaticConcerts = () =>
  useQuery({ queryKey: ["data", "concerts"], queryFn: () => fetchJson("concerts.json") });

export const useStaticEvents = () =>
  useQuery({ queryKey: ["data", "events"], queryFn: () => fetchJson("events.json") });

export const useStaticPrograms = () =>
  useQuery({ queryKey: ["data", "programs"], queryFn: () => fetchJson("programs.json") });

export const useStaticOpportunities = () =>
  useQuery({ queryKey: ["data", "opportunities"], queryFn: () => fetchJson("opportunities.json") });

export const useStaticBoardMembers = () =>
  useQuery({ queryKey: ["data", "board"], queryFn: () => fetchJson("board.json") });

export const useStaticBoosters = () =>
  useQuery({ queryKey: ["data", "boosters"], queryFn: () => fetchJson("boosters.json") });

export const useStaticBoosterOfficers = () =>
  useQuery({ queryKey: ["data", "booster-officers"], queryFn: () => fetchJson("booster-officers.json") });
