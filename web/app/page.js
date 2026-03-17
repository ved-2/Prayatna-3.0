"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Ambulance,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Crosshair,
  HeartPulse,
  MapPinned,
  Radar,
  RadioTower,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Users,
  Waypoints,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroMetrics = [
  {
    label: "Routing Precision",
    value: "97.4%",
    detail: "distance + ICU + bed fit",
  },
  {
    label: "Average Dispatch",
    value: "42 sec",
    detail: "citizen SOS to ambulance lock",
  },
  {
    label: "Live Capacity Nodes",
    value: "128",
    detail: "hospitals, ambulances, command desks",
  },
];

const commandModes = [
  {
    id: "dispatch",
    label: "Dispatch Grid",
    icon: RadioTower,
    eyebrow: "System Decision Layer",
    title:
      "Closest ambulance is not enough. The route engine scores who can actually treat the patient.",
    copy: "Every SOS enters a live dispatch grid that ranks ambulances by travel time, hospitals by capacity, and clinical fit by available ICU and trauma teams.",
  },
  {
    id: "citizen",
    label: "Citizen Pulse",
    icon: Siren,
    eyebrow: "Mobile Trigger Layer",
    title:
      "One panic tap creates a structured medical event, not a random phone call.",
    copy: "Citizen-Hospi pushes location, symptoms, and severity metadata into the system so routing starts before call-center delays kick in.",
  },
  {
    id: "hospital",
    label: "Hospital Sync",
    icon: Building2,
    eyebrow: "Capacity Response Layer",
    title:
      "Hospitals receive incoming cases with destination certainty and resource context.",
    copy: "The dashboard sees what is coming, why it was routed, and what resources must remain ready before the patient reaches the gate.",
  },
];

const routingCandidates = [
  {
    name: "City Trauma Centre",
    eta: "06 min",
    distance: "2.4 km",
    beds: "12 beds",
    icu: "4 ICU",
    fit: "92",
    status: "Best fit",
  },
  {
    name: "Metro Heart Institute",
    eta: "08 min",
    distance: "3.9 km",
    beds: "7 beds",
    icu: "2 ICU",
    fit: "81",
    status: "Cardiac ready",
  },
  {
    name: "North Civil Hospital",
    eta: "11 min",
    distance: "5.1 km",
    beds: "19 beds",
    icu: "0 ICU",
    fit: "55",
    status: "Low ICU",
  },
];

const networkCards = [
  {
    title: "Live Hospital Mesh",
    copy: "Bed count, ICU slots, and specialty readiness stream into one scoring engine.",
    icon: Building2,
    stat: "Real-time sync",
  },
  {
    title: "Ambulance Radius Engine",
    copy: "Nearby ambulances are ranked by distance, GPS freshness, and availability.",
    icon: Ambulance,
    stat: "Distance-first",
  },
  {
    title: "Symptom-Aware Routing",
    copy: "Critical alerts change the hospital scoring profile instantly based on resources.",
    icon: HeartPulse,
    stat: "Resource-fit",
  },
  {
    title: "Command Visibility",
    copy: "Citizen, ambulance, and hospital surfaces all read the same state machine.",
    icon: Radar,
    stat: "Unified Source",
  },
];

const protocolSteps = [
  {
    title: "SOS Trigger",
    copy: "Citizen app emits GPS coordinates, symptoms, and dispatch metadata.",
    icon: Siren,
  },
  {
    title: "Hospital Scoring",
    copy: "The backend ranks nearby hospitals using resource availability and specialty fit.",
    icon: Crosshair,
  },
  {
    title: "Ambulance Lock",
    copy: "The nearest live ambulance with fresh location is assigned to the destination.",
    icon: Ambulance,
  },
  {
    title: "Arrival Sync",
    copy: "The hospital gets ETA and patient context as the ambulance moves.",
    icon: Stethoscope,
  },
];

const telemetryStrip = [
  "Citizen SOS online",
  "Hospital resource scoring",
  "Live GPS ambulance lock",
  "ICU-aware routing",
  "Guardian alerts propagated",
  "Hospital intake pre-notified",
  "Unified emergency lifecycle",
];

function SectionEyebrow({ icon: Icon, children }) {
  return (
    <div className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-blue-600/80">
      <span className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-3 py-1">
        <Icon className="size-3.5" />
        {children}
      </span>
    </div>
  );
}

function MetricTile({ value, label, detail }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-[28px] border border-slate-200/60 bg-white p-5 shadow-sm"
    >
      <div className="text-3xl font-black tracking-tighter text-slate-900">
        {value}
      </div>
      <div className="mt-2 text-sm font-bold text-slate-700">{label}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </motion.div>
  );
}

function CommandModeButton({ mode, active, onClick }) {
  const Icon = mode.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-4 py-3 text-left transition-all duration-300",
        active
          ? "border-blue-200 bg-blue-50 text-blue-900 shadow-sm"
          : "border-slate-100 bg-slate-50/50 text-slate-500 hover:border-slate-200 hover:bg-white",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "rounded-xl border p-2",
            active
              ? "border-blue-200 bg-white"
              : "border-slate-200 bg-slate-100",
          )}
        >
          <Icon className="size-4" />
        </span>
        <div>
          <div className="text-sm font-bold">{mode.label}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            {mode.eyebrow}
          </div>
        </div>
      </div>
    </button>
  );
}

function CandidateTone({ candidate }) {
  const isBest = candidate.fit === "92";
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        isBest
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-slate-100 bg-white",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-slate-900">
            {candidate.name}
          </div>
          <div className="text-xs text-slate-500">
            {candidate.distance} • {candidate.eta}
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-slate-200 bg-white text-[9px] uppercase tracking-widest"
        >
          {candidate.status}
        </Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-medium">
        <div className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600">
          {candidate.beds}
        </div>
        <div className="rounded-lg bg-slate-100 px-2 py-1.5 text-slate-600">
          {candidate.icu}
        </div>
        <div className="rounded-lg bg-blue-600 px-2 py-1.5 text-white text-center font-bold">
          Fit {candidate.fit}
        </div>
      </div>
    </div>
  );
}

function CommandPanel({ mode, onModeChange }) {
  const activeMode =
    commandModes.find((item) => item.id === mode) ?? commandModes[0];
  return (
    <div className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-white p-4 shadow-xl sm:p-6">
      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
        <Badge className="border-0 bg-rose-100 text-rose-700 hover:bg-rose-100">
          <span className="mr-2 inline-block size-1.5 rounded-full bg-rose-500 animate-pulse" />
          Live Decision Engine
        </Badge>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <Waves className="size-3 text-blue-500" />
          Syncing Nodes
        </div>
      </div>

      <div className="pt-14">
        <div className="grid gap-3 md:grid-cols-3">
          {commandModes.map((item) => (
            <CommandModeButton
              key={item.id}
              mode={item}
              active={item.id === mode}
              onClick={() => onModeChange(item.id)}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 space-y-6"
          >
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-100 bg-slate-50/50 p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  {activeMode.eyebrow}
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {activeMode.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {activeMode.copy}
                </p>
                {activeMode.id === "dispatch" && (
                  <div classN
                  ame="mt-6 space-y-3">
                    {routingCandidates.map((c) => (
                      <CandidateTone key={c.name} candidate={c} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Current Trace
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900">
                    Emergency 07A / Priority High
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      { label: "GPS Lock", icon: CheckCircle2 },
                      { label: "Hospital Scoring", icon: Crosshair },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-600">
                          <item.icon className="size-3.5 text-blue-500" />{" "}
                          {item.label}
                        </div>
                        <span className="font-bold text-emerald-600 uppercase text-[9px]">
                          Verified
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [activeMode, setActiveMode] = useState("dispatch");

  return (
    <main className="relative min-h-screen bg-slate-50/50 text-slate-900">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-32 sm:px-8 lg:px-10">
        <div className="grid items-start gap-12 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl">
            <SectionEyebrow icon={Sparkles}>Infrastructure v3.0</SectionEyebrow>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Not a website.
              <span className="block text-blue-600">The Emergency OS.</span>
            </h1>
            <p className="mt-7 text-lg leading-relaxed text-slate-600">
              Citizen SOS, ambulance routing, and hospital readiness unified
              into one dynamic workflow. We route by clinical fit, not just
              proximity.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-blue-600 px-8 font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                <Link href="/register">
                  Launch Network <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-slate-200 bg-white px-8 font-bold hover:bg-slate-50"
              >
                <Link href="/login">
                  Command Console <ShieldCheck className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {heroMetrics.map((m) => (
                <MetricTile key={m.label} {...m} />
              ))}
            </div>
          </div>

          <div className="xl:pt-6">
            <CommandPanel mode={activeMode} onModeChange={setActiveMode} />
          </div>
        </div>
      </section>

      {/* Marquee Strip */}
      <section className="border-y border-slate-200 bg-white py-4 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...telemetryStrip, ...telemetryStrip].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-8 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400"
            >
              <span className="size-1.5 rounded-full bg-blue-500" /> {item}
            </div>
          ))}
        </div>
      </section>

      <section id="network" className="mx-auto max-w-7xl px-6 py-24">
        <SectionEyebrow icon={Radar}>The Live Grid</SectionEyebrow>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Shared State Visibility.
            </h2>
            <p className="mt-6 text-slate-600 leading-relaxed">
              The response path is reshaped in real-time. When a citizen signal
              drops, the entire mesh updates—from the nearest paramedic's tablet
              to the ICU charge nurse's dashboard.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {networkCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <card.icon className="size-5" />
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600 text-[9px] uppercase tracking-tighter"
                  >
                    {card.stat}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {card.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[48px] bg-blue-600 p-12 text-center text-white shadow-2xl shadow-blue-200">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Ready to secure your region?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-blue-100">
            Deploy the Prayatna 3.0 protocol and eliminate the technical
            friction between a crisis and a cure.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full bg-white text-blue-600 hover:bg-blue-50 font-bold px-10"
            >
              Start Deployment
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-blue-400 text-white hover:bg-blue-500 font-bold px-10"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
