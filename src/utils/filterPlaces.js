/**
 * Shared place filtering used by App.vue, CuisinePanel, ViewAllModal, and
 * SpinWheelModal. Centralizes the category/search/tier/region pipeline so the
 * different views stay in sync.
 *
 * Single-select fields (`category`, `tier`, `region`) accept a string;
 * multi-select fields accept an array of strings (used by SpinWheelModal).
 * Empty / falsy values mean "no filter on this dimension".
 */
export function filterPlaces(places, criteria = {}) {
  if (!Array.isArray(places)) return []

  const { category, search, tier, region, categories, tiers, regions } = criteria
  let result = places

  if (category) {
    result = result.filter((p) => p.cuisine_type === category)
  }
  if (Array.isArray(categories) && categories.length > 0) {
    result = result.filter((p) => categories.includes(p.cuisine_type))
  }

  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.address && p.address.toLowerCase().includes(q))
    )
  }

  if (tier) {
    result = result.filter((p) => p.tier === tier)
  }
  if (Array.isArray(tiers) && tiers.length > 0) {
    result = result.filter((p) => tiers.includes(p.tier))
  }

  if (region) {
    result = result.filter((p) => p.region === region)
  }
  if (Array.isArray(regions) && regions.length > 0) {
    result = result.filter((p) => regions.includes(p.region))
  }

  return result
}
