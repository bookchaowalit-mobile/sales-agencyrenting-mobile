import { describe, expect, it } from "vitest";
import { filterListings, formatMoney, moveInCost, parseMaxRent, SAMPLE_LISTINGS, sortListings, listingCountLabel, searchKey } from "./rentals";

describe("filterListings", () => {
  it("returns everything with an empty filter", () => {
    expect(filterListings(SAMPLE_LISTINGS, {})).toHaveLength(SAMPLE_LISTINGS.length);
  });
  it("matches title, area and agency case-insensitively", () => {
    expect(filterListings(SAMPLE_LISTINGS, { query: "green key" }).map((l) => l.id)).toEqual(["4", "6"]);
    expect(filterListings(SAMPLE_LISTINGS, { query: "ASOK" }).map((l) => l.id)).toEqual(["2"]);
  });
  it("applies max rent and min bedrooms together", () => {
    const r = filterListings(SAMPLE_LISTINGS, { maxRent: 24000, minBedrooms: 2 });
    expect(r.map((l) => l.id)).toEqual(["4", "6"]);
  });
});

describe("sortListings", () => {
  it("sorts by price both ways without mutating input", () => {
    const before = SAMPLE_LISTINGS.map((l) => l.id);
    expect(sortListings(SAMPLE_LISTINGS, "price-asc")[0].id).toBe("1");
    expect(sortListings(SAMPLE_LISTINGS, "price-desc")[0].id).toBe("3");
    expect(SAMPLE_LISTINGS.map((l) => l.id)).toEqual(before);
  });
  it("sorts by bedrooms, cheapest first on ties", () => {
    expect(sortListings(SAMPLE_LISTINGS, "bedrooms").map((l) => l.id).slice(0, 3)).toEqual(["3", "6", "4"]);
  });
});

describe("moveInCost", () => {
  it("adds first month, deposit and agency fee", () => {
    expect(moveInCost({ monthlyRent: 18500, depositMonths: 2, agencyFeeRate: 0.5 })).toEqual({
      firstMonth: 18500,
      deposit: 37000,
      agencyFee: 9250,
      total: 64750,
    });
  });
  it("rejects negative inputs", () => {
    expect(() => moveInCost({ monthlyRent: -1, depositMonths: 1, agencyFeeRate: 0 })).toThrow(RangeError);
  });
});

describe("helpers", () => {
  it("parses max rent", () => {
    expect(parseMaxRent("20,000")).toBe(20000);
    expect(parseMaxRent("")).toBeNull();
    expect(parseMaxRent("abc")).toBeNull();
  });
  it("formats money", () => {
    expect(formatMoney(64750)).toBe("THB 64,750");
  });
});

describe("pass 3 edge cases", () => {
  it("does not read a decimal comma as a thousands separator", () => {
    expect(parseMaxRent("12,50")).toBeNull();
    expect(parseMaxRent("7,5")).toBeNull();
    expect(parseMaxRent("18,500")).toBe(18500);
    expect(parseMaxRent("1,234,567")).toBe(1234567);
    expect(parseMaxRent("15000.50")).toBe(15000.5);
    expect(parseMaxRent("0x10")).toBeNull();
    expect(parseMaxRent("-5")).toBeNull();
  });
  it("matches decomposed accents and full-width letters in search", () => {
    const listing = { ...SAMPLE_LISTINGS[0], title: "Café loft" };
    expect(filterListings([listing], { query: "Cafe\u0301" })).toHaveLength(1);
    expect(searchKey("\uFF21SOK")).toBe("asok");
  });
  it("pluralises the result count", () => {
    expect(listingCountLabel(0)).toBe("0 listings");
    expect(listingCountLabel(1)).toBe("1 listing");
    expect(listingCountLabel(2)).toBe("2 listings");
  });
});
