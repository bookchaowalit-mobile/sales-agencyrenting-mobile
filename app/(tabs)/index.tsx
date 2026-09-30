import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  filterListings,
  formatMoney,
  moveInCost,
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

export default function RentalsScreen() {
  const [query, setQuery] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [sort, setSort] = useState<SortKey>("price-asc");
  const [expanded, setExpanded] = useState<string | null>(null);

  const listings = useMemo(
    () =>
      sortListings(
        filterListings(SAMPLE_LISTINGS, { query, maxRent: parseMaxRent(maxRent), minBedrooms }),
        sort,
      ),
    [query, maxRent, minBedrooms, sort],
  );

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
          <Text style={styles.label}>Minimum bedrooms</Text>
          <View style={styles.chips}>
            {BEDROOMS.map((n) => (
              <Chip key={n} label={n === 0 ? "Any" : `${n}+`} active={minBedrooms === n} onPress={() => setMinBedrooms(n)} />
            ))}
          </View>
          <Text style={styles.label}>Sort</Text>
          <View style={styles.chips}>
            {SORTS.map((s) => (
              <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => setSort(s.key)} />
            ))}
          </View>
          <Text style={styles.count}>{listings.length} listing(s)</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No listings match these filters.</Text>}
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          expanded={expanded === item.id}
          onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
        />
      )}
    />
  );
}

function ListingCard({ listing, expanded, onToggle }: { listing: Listing; expanded: boolean; onToggle: () => void }) {
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

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  filters: { padding: 16, gap: 8 },
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
  empty: { textAlign: "center", color: "#777", marginTop: 32 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12, elevation: 2, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#333" },
  meta: { fontSize: 14, color: "#666" },
  price: { fontSize: 16, fontWeight: "700", color: "#2A5A8C" },
  breakdown: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#eee", gap: 2 },
  total: { fontSize: 15, fontWeight: "700", color: "#222", marginTop: 4 },
});
