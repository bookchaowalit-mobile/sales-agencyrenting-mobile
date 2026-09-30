import { describe, expect, it } from "vitest";
import { encodeEnvelope, valueCodec } from "./persist";
import { DEFAULT_PREFS, isRentalPrefs, toggleSaved } from "./rentals";

describe("rental prefs persistence", () => {
  const codec = valueCodec(isRentalPrefs);

  it("round-trips preferences", () => {
    const prefs = { ...DEFAULT_PREFS, query: "Ari", savedIds: ["a1"], savedOnly: true };
    expect(codec.decode(codec.encode(prefs))).toEqual(prefs);
  });

  it("rejects malformed stored prefs", () => {
    expect(codec.decode(encodeEnvelope({ ...DEFAULT_PREFS, sort: "random" }))).toBeUndefined();
    expect(codec.decode(encodeEnvelope({ ...DEFAULT_PREFS, minBedrooms: -1 }))).toBeUndefined();
    expect(codec.decode(encodeEnvelope({ ...DEFAULT_PREFS, savedIds: [1] }))).toBeUndefined();
    expect(codec.decode("garbage")).toBeUndefined();
  });

  it("toggleSaved adds then removes an id", () => {
    expect(toggleSaved([], "x")).toEqual(["x"]);
    expect(toggleSaved(["x", "y"], "x")).toEqual(["y"]);
  });
});
