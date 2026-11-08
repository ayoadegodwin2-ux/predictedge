/**
 * League & Country Whitelist Configuration (Step 16 — Updated Rule)
 * Maps our 54 approved countries and International Clubs.
 * 
 * CRUCIAL RULE:
 * Does NOT restrict to Tier 1 and Tier 2 leagues.
 * It includes ALL available leagues/divisions/cups within these 54 countries,
 * allowing the algorithm to analyze a massive, broad pool of fixtures
 * to identify the sharpest mathematical edges.
 */

export interface WhitelistedCountry {
  name: string;
  flag: string;
  aliases: string[]; // Variations found in API responses
}

export interface InternationalCompetition {
  id: number;
  name: string;
  region: string;
}

/**
 * The 54 Approved Countries
 */
export const APPROVED_54_COUNTRIES: WhitelistedCountry[] = [
  // Europe (25)
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", aliases: ["england", "united kingdom"] },
  { name: "Spain", flag: "🇪🇸", aliases: ["spain", "espana"] },
  { name: "Germany", flag: "🇩🇪", aliases: ["germany", "deutschland"] },
  { name: "Italy", flag: "🇮🇹", aliases: ["italy", "italia"] },
  { name: "France", flag: "🇫🇷", aliases: ["france"] },
  { name: "Netherlands", flag: "🇳🇱", aliases: ["netherlands", "holland"] },
  { name: "Portugal", flag: "🇵🇹", aliases: ["portugal"] },
  { name: "Turkey", flag: "🇹🇷", aliases: ["turkey", "turkiye"] },
  { name: "Belgium", flag: "🇧🇪", aliases: ["belgium"] },
  { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", aliases: ["scotland"] },
  { name: "Austria", flag: "🇦🇹", aliases: ["austria"] },
  { name: "Switzerland", flag: "🇨🇭", aliases: ["switzerland"] },
  { name: "Denmark", flag: "🇩🇰", aliases: ["denmark"] },
  { name: "Greece", flag: "🇬🇷", aliases: ["greece"] },
  { name: "Czech Republic", flag: "🇨🇿", aliases: ["czech republic", "czech-republic", "czechia"] },
  { name: "Norway", flag: "🇳🇴", aliases: ["norway"] },
  { name: "Sweden", flag: "🇸🇪", aliases: ["sweden"] },
  { name: "Croatia", flag: "🇭🇷", aliases: ["croatia"] },
  { name: "Poland", flag: "🇵🇱", aliases: ["poland"] },
  { name: "Romania", flag: "🇷🇴", aliases: ["romania"] },
  { name: "Serbia", flag: "🇷🇸", aliases: ["serbia"] },
  { name: "Ukraine", flag: "🇺🇦", aliases: ["ukraine"] },
  { name: "Hungary", flag: "🇭🇺", aliases: ["hungary"] },
  { name: "Bulgaria", flag: "🇧🇬", aliases: ["bulgaria"] },
  { name: "Slovakia", flag: "🇸🇰", aliases: ["slovakia"] },
  { name: "Slovenia", flag: "🇸🇮", aliases: ["slovenia"] },
  { name: "Finland", flag: "🇫🇮", aliases: ["finland"] },
  { name: "Iceland", flag: "🇮🇸", aliases: ["iceland"] },
  { name: "Ireland", flag: "🇮🇪", aliases: ["ireland", "republic of ireland"] },
  { name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", aliases: ["wales"] },

  // Americas (11)
  { name: "Brazil", flag: "🇧🇷", aliases: ["brazil", "brasil"] },
  { name: "Argentina", flag: "🇦🇷", aliases: ["argentina"] },
  { name: "USA", flag: "🇺🇸", aliases: ["usa", "united states", "united-states"] },
  { name: "Mexico", flag: "🇲🇽", aliases: ["mexico"] },
  { name: "Colombia", flag: "🇨🇴", aliases: ["colombia"] },
  { name: "Uruguay", flag: "🇺🇾", aliases: ["uruguay"] },
  { name: "Chile", flag: "🇨🇱", aliases: ["chile"] },
  { name: "Peru", flag: "🇵🇪", aliases: ["peru"] },
  { name: "Paraguay", flag: "🇵🇾", aliases: ["paraguay"] },
  { name: "Ecuador", flag: "🇪🇨", aliases: ["ecuador"] },

  // Asia & Oceania (8)
  { name: "Japan", flag: "🇯🇵", aliases: ["japan"] },
  { name: "Saudi Arabia", flag: "🇸🇦", aliases: ["saudi arabia", "saudi-arabia"] },
  { name: "Australia", flag: "🇦🇺", aliases: ["australia"] },
  { name: "China", flag: "🇨🇳", aliases: ["china"] },
  { name: "South Korea", flag: "🇰🇷", aliases: ["south korea", "korea republic", "korea-republic"] },
  { name: "Qatar", flag: "🇶🇦", aliases: ["qatar"] },
  { name: "UAE", flag: "🇦🇪", aliases: ["uae", "united arab emirates"] },
  { name: "India", flag: "🇮🇳", aliases: ["india"] },
  { name: "Thailand", flag: "🇹🇭", aliases: ["thailand"] },
  { name: "Russia", flag: "🇷🇺", aliases: ["russia"] },

  // Africa (4)
  { name: "Egypt", flag: "🇪🇬", aliases: ["egypt"] },
  { name: "South Africa", flag: "🇿🇦", aliases: ["south africa", "south-africa"] },
  { name: "Morocco", flag: "🇲🇦", aliases: ["morocco"] },
  { name: "Tunisia", flag: "🇹🇳", aliases: ["tunisia"] },
];

/**
 * Whitelisted International Club Competitions
 */
export const APPROVED_INTERNATIONAL_CLUBS: InternationalCompetition[] = [
  { id: 2, name: "UEFA Champions League", region: "Europe" },
  { id: 3, name: "UEFA Europa League", region: "Europe" },
  { id: 848, name: "UEFA Europa Conference League", region: "Europe" },
  { id: 531, name: "UEFA Super Cup", region: "Europe" },
  { id: 13, name: "Copa Libertadores", region: "South America" },
  { id: 11, name: "Copa Sudamericana", region: "South America" },
  { id: 541, name: "Recopa Sudamericana", region: "South America" },
  { id: 15, name: "FIFA Club World Cup", region: "World" },
  { id: 16, name: "CONCACAF Champions Cup", region: "North America" },
  { id: 17, name: "AFC Champions League", region: "Asia" },
  { id: 12, name: "CAF Champions League", region: "Africa" },
];

// Set of lowercase aliases for O(1) matching
const COUNTRY_ALIAS_SET = new Set<string>();
APPROVED_54_COUNTRIES.forEach((c) => {
  COUNTRY_ALIAS_SET.add(c.name.toLowerCase());
  c.aliases.forEach((alias) => COUNTRY_ALIAS_SET.add(alias.toLowerCase()));
});

// Set of international competition IDs
const INT_COMP_ID_SET = new Set<number>(
  APPROVED_INTERNATIONAL_CLUBS.map((c) => c.id)
);

/**
 * Checks if a country name belongs to our 54 approved countries
 */
export function isCountryWhitelisted(countryName?: string | null): boolean {
  if (!countryName) return false;
  const normalized = countryName.trim().toLowerCase();
  return COUNTRY_ALIAS_SET.has(normalized);
}

/**
 * Checks if a fixture or league is allowed under the 54 countries + International Club rule.
 * INCLUDES ALL LEAGUES (1st, 2nd, 3rd, cups, reserves) inside the 54 countries!
 */
export function isWhitelistedLeague(league?: {
  id?: number;
  name?: string;
  country?: string | null;
}): boolean {
  if (!league) return false;

  // 1. Check if it's an approved International Club competition
  if (league.id && INT_COMP_ID_SET.has(league.id)) {
    return true;
  }

  // 2. Check if the country is one of the 54 whitelisted countries
  if (league.country && isCountryWhitelisted(league.country)) {
    return true;
  }

  return false;
}

/**
 * Helper to get country flag
 */
export function getCountryFlag(countryName?: string | null): string {
  if (!countryName) return "⚽";
  const normalized = countryName.trim().toLowerCase();
  const found = APPROVED_54_COUNTRIES.find(
    (c) => c.name.toLowerCase() === normalized || c.aliases.includes(normalized)
  );
  return found?.flag || "⚽";
}

