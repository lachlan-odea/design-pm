import { useEffect, useState } from "react";
import type { Hub } from "../types";
import {
  dayOffsetLabel,
  hubClock,
  hubDayOffset,
  isWithinWorkHours,
  sortHubsByOffset,
} from "../timezones";

type Props = {
  hubs: Hub[];
  // The signed-in user's hub id, if they've been assigned one. Their own
  // clock gets a "you" marker and everyone else's is measured against it.
  myHubId?: string;
  collapsed: boolean;
};

// Live clocks for every configured location, so nobody pings Chicago at 3am
// or assumes Sydney is still on yesterday's date.
//
// Re-renders on a 30-second tick rather than every second: the display only
// shows minutes, so a faster interval would be wasted renders, and a slower
// one would let the clock sit visibly wrong.
export function HubClocks({ hubs, myHubId, collapsed }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  if (hubs.length === 0) return null;

  const myHub = hubs.find((h) => h.id === myHubId);

  // Collapsed rail has no room for the strip, so fold down to a single
  // marker for your own location with the full detail in the tooltip.
  if (collapsed) {
    if (!myHub) return null;
    return (
      <div className="hub-clocks collapsed">
        <span
          className={`hub-clock me ${
            isWithinWorkHours(myHub, now) ? "" : "off-hours"
          }`}
          title={`${myHub.name} · ${hubClock(myHub, now)}`}
        >
          <span className="hub-clock-time">
            {hubClock(myHub, now).replace(/^\S+\s/, "")}
          </span>
        </span>
      </div>
    );
  }

  // Re-sorted on every tick rather than memoised: offsets shift at daylight
  // saving boundaries, and it's a handful of items.
  return (
    <div className="hub-clocks">
      {sortHubsByOffset(hubs, now).map((hub) => {
        const isMine = hub.id === myHubId;
        const atWork = isWithinWorkHours(hub, now);
        const offset = myHub && !isMine ? hubDayOffset(hub, myHub, now) : null;
        const gap = offset === null ? "" : dayOffsetLabel(offset);
        // The name is the half that truncates, so put everything a reader
        // can't reconstruct from a truncated label into the tooltip.
        const tooltip = [
          hub.name,
          hub.timeZone,
          gap,
          atWork ? "" : "outside working hours",
        ]
          .filter(Boolean)
          .join(" · ");
        return (
          <div
            key={hub.id}
            className={`hub-clock ${isMine ? "me" : ""} ${
              atWork ? "" : "off-hours"
            }`}
            title={tooltip}
          >
            <span className="hub-clock-name">
              {hub.name}
              {isMine ? " · you" : ""}
            </span>
            <span className="hub-clock-meta">
              <span className="hub-clock-time">{hubClock(hub, now)}</span>
              {gap && <span className="hub-clock-gap">{gap}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
