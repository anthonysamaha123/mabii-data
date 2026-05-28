// Deterministic scheduling math. Pure functions, no I/O, no AI.
// Used by both the build-time scheduler (scripts/scheduler/) and the
// runtime status page to compute next_expected_update from a Schedule.

import type { Frequency, Schedule } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

const CADENCE_DAYS: Record<Frequency, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 92,
  annual: 365,
  irregular: 365, // treat as annual for freshness budgeting
};

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

function utcDate(year: number, month1to12: number, day: number): Date {
  // month1to12 is 1-based; JS Date uses 0-based.
  return new Date(Date.UTC(year, month1to12 - 1, Math.min(day, 28)));
}

/**
 * Compute the next time we expect the source to publish, after `since`.
 * "since" is typically the timestamp of the last successful fetch
 * (or the day Mabii started tracking if nothing has been fetched yet).
 */
export function computeNextExpectedUpdate(
  schedule: Schedule | undefined,
  since: Date
): Date {
  if (!schedule) {
    // No schedule → assume annual default for budgeting purposes.
    return addDays(since, CADENCE_DAYS.annual);
  }

  const { cadence, release_day_of_month, release_month_of_year, secondary_release_month } =
    schedule;

  // Annual with a known release month
  if (cadence === "annual" && release_month_of_year) {
    const candidates: Date[] = [];
    const sinceYear = since.getUTCFullYear();
    for (const monthOffset of [0, 1]) {
      const month = release_month_of_year;
      const year = sinceYear + monthOffset;
      candidates.push(
        utcDate(year, month, release_day_of_month ?? 15)
      );
      if (secondary_release_month) {
        candidates.push(
          utcDate(year, secondary_release_month, release_day_of_month ?? 15)
        );
      }
    }
    const futures = candidates
      .filter((d) => d.getTime() > since.getTime())
      .sort((a, b) => a.getTime() - b.getTime());
    return futures[0] ?? addDays(since, CADENCE_DAYS.annual);
  }

  // Monthly with a known day
  if (cadence === "monthly" && release_day_of_month) {
    const sinceUtc = new Date(
      Date.UTC(since.getUTCFullYear(), since.getUTCMonth(), since.getUTCDate())
    );
    const candidate = utcDate(
      sinceUtc.getUTCFullYear(),
      sinceUtc.getUTCMonth() + 1,
      release_day_of_month
    );
    if (candidate.getTime() > since.getTime()) return candidate;
    return utcDate(
      sinceUtc.getUTCFullYear(),
      sinceUtc.getUTCMonth() + 2,
      release_day_of_month
    );
  }

  // Default: cadence-based offset
  return addDays(since, CADENCE_DAYS[cadence]);
}

export type ScheduleStatus = "fresh" | "due_soon" | "due" | "stale" | "no_schedule";

/**
 * Compare expected-next-update against now and grace_days to bucket the status.
 *   fresh     : now < expected
 *   due_soon  : expected ≤ now ≤ expected + grace/2
 *   due       : expected + grace/2 < now ≤ expected + grace
 *   stale     : now > expected + grace
 *
 * Anything without a schedule is "no_schedule".
 */
export function classifyScheduleStatus(
  schedule: Schedule | undefined,
  lastFetchedAt: Date | undefined,
  now = new Date()
): { status: ScheduleStatus; expectedNext: Date | undefined; ageDays: number | undefined } {
  if (!schedule) return { status: "no_schedule", expectedNext: undefined, ageDays: undefined };

  // If we've never fetched, the very first pull is always "due".
  const since = lastFetchedAt ?? new Date(now.getTime() - 365 * DAY_MS);
  const expected = computeNextExpectedUpdate(schedule, since);

  const overdueDays = Math.floor((now.getTime() - expected.getTime()) / DAY_MS);
  const grace = schedule.grace_days;
  const ageDays = lastFetchedAt
    ? Math.floor((now.getTime() - lastFetchedAt.getTime()) / DAY_MS)
    : undefined;

  if (overdueDays < 0) {
    return { status: "fresh", expectedNext: expected, ageDays };
  }
  if (overdueDays <= Math.ceil(grace / 2)) {
    return { status: "due_soon", expectedNext: expected, ageDays };
  }
  if (overdueDays <= grace) {
    return { status: "due", expectedNext: expected, ageDays };
  }
  return { status: "stale", expectedNext: expected, ageDays };
}

/** Whether the scheduler should actually trigger a fetch right now. */
export function shouldFetch(
  schedule: Schedule | undefined,
  lastFetchedAt: Date | undefined,
  now = new Date()
): boolean {
  const { status } = classifyScheduleStatus(schedule, lastFetchedAt, now);
  return status === "due" || status === "stale";
}

export function describeCadence(schedule: Schedule | undefined): string {
  if (!schedule) return "no schedule";
  const { cadence, release_month_of_year, release_day_of_month, secondary_release_month } =
    schedule;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  if (cadence === "annual" && release_month_of_year) {
    const parts = [months[release_month_of_year - 1]];
    if (secondary_release_month) parts.push(months[secondary_release_month - 1]);
    return `Annual, releases in ${parts.join(" + ")}`;
  }
  if (cadence === "monthly" && release_day_of_month) {
    return `Monthly, around day ${release_day_of_month}`;
  }
  return cadence.charAt(0).toUpperCase() + cadence.slice(1);
}
