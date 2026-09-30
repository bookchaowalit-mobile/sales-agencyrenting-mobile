/** Pure logic for browsing agency rental listings and estimating move-in cost. */

export type Listing = {
  id: string;
  title: string;
  area: string;
  agency: string;
  monthlyRent: number;
  bedrooms: number;
  /** Security deposit expressed in months of rent. */
  depositMonths: number;
  /** One-off agency fee as a fraction of one month's rent (0.5 = half a month). */
  agencyFeeRate: number;
};

export type SortKey = "price-asc" | "price-desc" | "bedrooms";

export type ListingFilter = {
  query?: string;
  maxRent?: number | null;
  minBedrooms?: number;
};

export function filterListings(listings: Listing[], filter: ListingFilter): Listing[] {
  const q = (filter.query ?? "").trim().toLowerCase();
  return listings.filter((l) => {
    if (q && ![l.title, l.area, l.agency].some((s) => s.toLowerCase().includes(q))) return false;
    if (filter.maxRent != null && l.monthlyRent > filter.maxRent) return false;
    if (filter.minBedrooms != null && l.bedrooms < filter.minBedrooms) return false;
    return true;
  });
}

export function sortListings(listings: Listing[], key: SortKey): Listing[] {
  const copy = [...listings];
  switch (key) {
    case "price-asc":
      return copy.sort((a, b) => a.monthlyRent - b.monthlyRent || a.title.localeCompare(b.title));
    case "price-desc":
      return copy.sort((a, b) => b.monthlyRent - a.monthlyRent || a.title.localeCompare(b.title));
    case "bedrooms":
      return copy.sort((a, b) => b.bedrooms - a.bedrooms || a.monthlyRent - b.monthlyRent);
  }
}

export type MoveInCost = { firstMonth: number; deposit: number; agencyFee: number; total: number };

/** Upfront cash needed to move in: first month + deposit + agency fee (rounded to whole units). */
export function moveInCost(listing: Pick<Listing, "monthlyRent" | "depositMonths" | "agencyFeeRate">): MoveInCost {
  const { monthlyRent, depositMonths, agencyFeeRate } = listing;
  if (monthlyRent < 0 || depositMonths < 0 || agencyFeeRate < 0) {
    throw new RangeError("rent, deposit and fee must be non-negative");
  }
  const firstMonth = Math.round(monthlyRent);
  const deposit = Math.round(monthlyRent * depositMonths);
  const agencyFee = Math.round(monthlyRent * agencyFeeRate);
  return { firstMonth, deposit, agencyFee, total: firstMonth + deposit + agencyFee };
}

/** Parse an optional max-rent field: blank means "no limit", invalid text also means no limit. */
export function parseMaxRent(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  return Number(cleaned);
}

export function formatMoney(amount: number, currency = "THB"): string {
  return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
}

export const SAMPLE_LISTINGS: Listing[] = [
  { id: "1", title: "Riverside studio", area: "Bang Rak", agency: "Siam Homes", monthlyRent: 12000, bedrooms: 0, depositMonths: 2, agencyFeeRate: 0 },
  { id: "2", title: "Sukhumvit 1-bed condo", area: "Asok", agency: "City Nest", monthlyRent: 18500, bedrooms: 1, depositMonths: 2, agencyFeeRate: 0.5 },
  { id: "3", title: "Family townhouse", area: "Bang Na", agency: "Siam Homes", monthlyRent: 28000, bedrooms: 3, depositMonths: 2, agencyFeeRate: 1 },
  { id: "4", title: "Ari garden 2-bed", area: "Phaya Thai", agency: "Green Key", monthlyRent: 24000, bedrooms: 2, depositMonths: 2, agencyFeeRate: 0.5 },
  { id: "5", title: "Old Town loft", area: "Phra Nakhon", agency: "City Nest", monthlyRent: 15000, bedrooms: 1, depositMonths: 1, agencyFeeRate: 0 },
  { id: "6", title: "Lakeside 2-bed", area: "Ratchada", agency: "Green Key", monthlyRent: 21000, bedrooms: 2, depositMonths: 2, agencyFeeRate: 0.5 },
];
