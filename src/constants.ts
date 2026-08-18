import type { ProjectStatus } from "./types";

// The status picker's options, in lifecycle order. Single source of truth for
// both the dropdown and every label rendered elsewhere — see the note on
// ProjectStatus for why "paused" is stored but shown as "On hold".
export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "paused", label: "On hold" },
  { value: "completed", label: "Completed" },
];

// A project with no status set predates the field and is treated as active.
export function projectStatusLabel(status: ProjectStatus | undefined): string {
  const value = status ?? "active";
  return PROJECT_STATUSES.find((s) => s.value === value)?.label ?? "Active";
}

export const BRANDS = [
  "CargoWise",
  "CargoWise Landside",
  "WiseTech Global",
  "WiseTech Academy",
  "e2open",
  "Blume",
  "BorderWise",
  "No brand",
] as const;

// Bootstrap super users. Anyone whose Firebase Auth email matches an entry
// here is treated as a super user regardless of the `isSuperUser` flag on
// their Designer doc — this guarantees there's always at least one person
// who can grant the flag to others from the Settings UI. Designers can also
// be promoted at runtime via the Super users section in Settings (writes
// /designers/{uid}.isSuperUser to true). The reviewer pool and the
// "Manage workspaces" admin section are both gated on super-user status.
export const SUPER_USER_EMAILS = [
  "lachlan.odea@wisetechglobal.com",
] as const;

// Seed workspaces written into Firestore on first load. Once they exist
// they're managed in the /workspaces collection; this list only acts as
// the initial set. The first id is treated as the default workspace for
// pre-existing projects that don't yet have a workspaceId field.
export const SEED_WORKSPACES = [
  { id: "design", name: "Design" },
  { id: "video", name: "Video" },
  { id: "marketing", name: "Marketing" },
] as const;

export const DEFAULT_WORKSPACE_ID = SEED_WORKSPACES[0].id;

// The two offices we start with. Written into /hubs on first load the same
// way SEED_WORKSPACES is, then managed from Settings → Locations & time
// zones — super users can add, rename, retime or remove any of them, and the
// change lands in everyone's sidebar. This list only supplies the initial
// pair, so editing a seeded hub in the UI sticks; it won't be reset on the
// next boot.
export const SEED_HUBS = [
  {
    id: "sydney",
    name: "Sydney",
    timeZone: "Australia/Sydney",
    workStartHour: 8,
    workEndHour: 18,
  },
  {
    id: "chicago",
    name: "Chicago",
    timeZone: "America/Chicago",
    workStartHour: 8,
    workEndHour: 18,
  },
] as const;

export const CONTENT_TYPES = [
  "Web",
  "Landing page",
  "Social",
  "Email",
  "Print",
  "Event",
  "Mobile",
  "Video",
  "Presentation",
  "Brand",
  "Illustration",
  "Internal comms",
] as const;
