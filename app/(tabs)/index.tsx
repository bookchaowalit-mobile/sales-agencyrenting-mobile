import { useMemo, useState } from "react";
import { valueCodec } from "../../lib/persist";
import { usePersistentState } from "../../lib/usePersistentState";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  DEFAULT_PREFS,
  filterListings,
  isRentalPrefs,
  toggleSaved,
  type RentalPrefs,
  formatMoney,
  moveInCost,
  listingCountLabel,
  parseMaxRent,
  SAMPLE_LISTINGS,
  sortListings,
  type Listing,
  type SortKey,
} from "../../lib/rentals";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price-asc", label: "Cheapest" },
  { key: "price-desc", label: "Priciest" },
  { key: "bedrooms", label: "Most beds" },
];
const BEDROOMS = [0, 1, 2, 3];
const prefsCodec = valueCodec(isRentalPrefs);

export default function RentalsScreen() {
  const [prefs, setPrefs] = usePersistentState<RentalPrefs>("rentals.prefs.v1", DEFAULT_PREFS, prefsCodec);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { query, maxRent, minBedrooms, sort, savedIds, savedOnly } = prefs;
  const update = (patch: Partial<RentalPrefs>) => setPrefs((cur) => ({ ...cur, ...patch }));
  const setQuery = (q: string) => update({ query: q });
  const setMaxRent = (m: string) => update({ maxRent: m });
  const setMinBedrooms = (n: number) => update({ minBedrooms: n });
  const setSort = (s: SortKey) => update({ sort: s });

  const listings = useMemo(() => {
    const pool = savedOnly ? SAMPLE_LISTINGS.filter((l) => savedIds.includes(l.id)) : SAMPLE_LISTINGS;
    return sortListings(filterListings(pool, { query, maxRent: parseMaxRent(maxRent), minBedrooms }), sort);
  }, [query, maxRent, minBedrooms, sort, savedIds, savedOnly]);

  return (
    <FlatList
      style={styles.container}
      data={listings}
      keyExtractor={(l) => l.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.filters}>
          <TextInput
            style={styles.input}
            placeholder="Search title, area or agency"
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search listings"
          />
          <TextInput
            style={styles.input}
            placeholder="Max monthly rent (THB)"
            keyboardType="number-pad"
            value={maxRent}
            onChangeText={setMaxRent}
            accessibilityLabel="Maximum monthly rent"
          />
          {maxRent.trim() !== "" && parseMaxRent(maxRent) === null && (
            <Text style={styles.hint} accessibilityLiveRegion="polite">
              Enter the rent as a whole number, e.g. 18500 — the limit is ignored until then.
            </Text>
          )}
          <Text style={styles.label}>Minimum bedrooms</Text>
          <View style={styles.chips}>
            {BEDROOMS.map((n) => (
              <Chip
                key={n}
                label={n === 0 ? "Any" : `${n}+`}
                a11yLabel={n === 0 ? "Any number of bedrooms" : `At least ${n} bedroom${n > 1 ? "s" : ""}`}
                active={minBedrooms === n}
                onPress={() => setMinBedrooms(n)}
              />
            ))}
          </View>
          <Text style={styles.label}>Sort</Text>
          <View style={styles.chips}>
            {SORTS.map((s) => (
              <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} />
            ))}
          </View>
          <View style={styles.chips}>
            <Chip
              label={`Saved only (${savedIds.length})`}
              a11yLabel={`Show saved listings only, ${savedIds.length} saved`}
              active={savedOnly}
              onPress={() => update({ savedOnly: !savedOnly })}
            />
          </View>
          <Text style={styles.count}>{listingCountLabel(listings.length)}</Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          {savedOnly && savedIds.length === 0 ? "No saved listings yet — tap Save on a listing." : "No listings match these filters."}
        </Text>
      }
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          expanded={expanded === item.id}
          saved={savedIds.includes(item.id)}
          onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
          onToggleSaved={() => update({ savedIds: toggleSaved(savedIds, item.id) })}
        />
      )}
    />
  );
}

function ListingCard({
  listing,
  expanded,
  saved,
  onToggle,
  onToggleSaved,
}: {
  listing: Listing;
  expanded: boolean;
  saved: boolean;
  onToggle: () => void;
  onToggleSaved: () => void;
}) {
  const cost = moveInCost(listing);
  return (
    <Pressable
      style={styles.card}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityHint="Shows the move-in cost breakdown"
    >
      <Text style={styles.cardTitle}>{listing.title}</Text>
      <Text style={styles.meta}>
        {listing.area} · {listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bed`} · {listing.agency}
      </Text>
      <Text style={styles.price}>{formatMoney(listing.monthlyRent)} / month</Text>
      <Pressable
        onPress={onToggleSaved}
        style={styles.save}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={saved ? `Remove ${listing.title} from saved` : `Save ${listing.title}`}
        accessibilityState={{ selected: saved }}
      >
        <Text style={styles.saveText}>{saved ? "★ Saved" : "☆ Save"}</Text>
      </Pressable>
      {expanded && (
        <View style={styles.breakdown}>
          <Text style={styles.meta}>First month: {formatMoney(cost.firstMonth)}</Text>
          <Text style={styles.meta}>
            Deposit ({listing.depositMonths} mo): {formatMoney(cost.deposit)}
          </Text>
          <Text style={styles.meta}>Agency fee: {formatMoney(cost.agencyFee)}</Text>
          <Text style={styles.total}>Move-in total: {formatMoney(cost.total)}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Chip({
  label,
  a11yLabel,
  active,
  onPress,
}: {
  label: string;
  a11yLabel?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  filters: { padding: 16, gap: 8 },
  save: { alignSelf: "flex-start", marginTop: 6, paddingVertical: 4 },
  saveText: { color: "#1F5FA8", fontWeight: "600" },

  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  label: { fontSize: 13, color: "#555", marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: "#E3ECF7" },
  chipActive: { backgroundColor: "#4A90D9" },
  chipText: { color: "#2A5A8C", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  count: { fontSize: 13, color: "#777", marginTop: 4 },
  hint: { fontSize: 13, color: "#8A4B00" },
  empty: { textAlign: "center", color: "#777", marginTop: 32 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, elevation: 2, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#333" },
  meta: { fontSize: 14, color: "#666" },
  price: { fontSize: 16, fontWeight: "700", color: "#2A5A8C" },
  breakdown: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#eee", gap: 2 },
  total: { fontSize: 15, fontWeight: "700", color: "#222", marginTop: 4 },
});
