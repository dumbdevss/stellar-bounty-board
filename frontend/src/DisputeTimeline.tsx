import { Scale } from "lucide-react";

import type { DisputeHistoryEntry } from "./types";

const EVENT_LABELS: Record<DisputeHistoryEntry["type"], string> = {
  "dispute-raised": "Dispute raised",
  "evidence-added": "Evidence added",
  resolution: "Dispute resolved",
};

type Props = {
  entries: DisputeHistoryEntry[];
  formatTimestamp: (value?: number) => string;
};

export default function DisputeTimeline({ entries, formatTimestamp }: Props) {
  if (!entries || entries.length === 0) {
    return null;
  }

  const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="dispute-timeline">
      <h3 className="dispute-timeline__title">
        <Scale size={16} />
        Dispute timeline
      </h3>
      <ol className="dispute-timeline__list">
        {sorted.map((entry, index) => (
          <li
            key={`${entry.type}-${entry.timestamp}-${index}`}
            className={`dispute-timeline__item dispute-timeline__item--${entry.type}`}
          >
            <div className="dispute-timeline__dot" aria-hidden="true" />
            <div className="dispute-timeline__content">
              <strong className="dispute-timeline__event">{EVENT_LABELS[entry.type]}</strong>
              <time
                className="dispute-timeline__time"
                dateTime={new Date(entry.timestamp * 1000).toISOString()}
              >
                {formatTimestamp(entry.timestamp)}
              </time>
              <span className="dispute-timeline__actor">by {entry.actor}</span>
              <p className="dispute-timeline__description">{entry.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
