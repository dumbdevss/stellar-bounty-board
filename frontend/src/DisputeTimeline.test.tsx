import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DisputeTimeline from "./DisputeTimeline";
import type { DisputeHistoryEntry } from "./types";

const entries: DisputeHistoryEntry[] = [
  {
    type: "dispute-raised",
    actor: "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBK",
    timestamp: 1_700_000_100,
    description: "Maintainer did not review within the agreed timeframe.",
  },
  {
    type: "resolution",
    actor: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCL",
    timestamp: 1_700_010_000,
    description: "Dispute resolved in favor of the contributor (payment released).",
  },
];

describe("DisputeTimeline", () => {
  it("renders nothing when there are no entries", () => {
    const { container } = render(
      <DisputeTimeline entries={[]} formatTimestamp={() => "Jan 1, 2024"} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders dispute events in chronological order with actor and description", () => {
    render(<DisputeTimeline entries={entries} formatTimestamp={() => "Jan 1, 2024"} />);

    expect(screen.getByText("Dispute timeline")).toBeInTheDocument();
    expect(screen.getByText("Dispute raised")).toBeInTheDocument();
    expect(screen.getByText("Dispute resolved")).toBeInTheDocument();
    expect(
      screen.getByText("Maintainer did not review within the agreed timeframe."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Dispute resolved in favor of the contributor (payment released)."),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/by G/)).toHaveLength(2);
  });
});
