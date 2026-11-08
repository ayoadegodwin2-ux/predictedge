/**
 * Approved Leagues & Country Mapping (Step 16)
 * Maps 54 approved countries (Tier 1 & Tier 2) + International Clubs to exact API-Football League IDs.
 */

export interface MappedLeague {
  apiLeagueId: number;
  country: string;
  leagueName: string;
  tier: 1 | 2;
  flag: string;
  isInternationalClub?: boolean;
}

export const APPROVED_LEAGUES: MappedLeague[] = [
  /* ─────────────────────────────────────────────
     INTERNATIONAL CLUBS
     ───────────────────────────────────────────── */
  { apiLeagueId: 2, country: "International", leagueName: "UEFA Champions League", tier: 1, flag: "🇪🇺", isInternationalClub: true },
  { apiLeagueId: 3, country: "International", leagueName: "UEFA Europa League", tier: 1, flag: "🇪🇺", isInternationalClub: true },
  { apiLeagueId: 848, country: "International", leagueName: "UEFA Europa Conference League", tier: 1, flag: "🇪🇺", isInternationalClub: true },
  { apiLeagueId: 13, country: "South America", leagueName: "Copa Libertadores", tier: 1, flag: "🌎", isInternationalClub: true },
  { apiLeagueId: 11, country: "South America", leagueName: "Copa Sudamericana", tier: 1, flag: "🌎", isInternationalClub: true },

  /* ─────────────────────────────────────────────
     TIER 1 COUNTRIES (27 Top Leagues)
     ───────────────────────────────────────────── */
  { apiLeagueId: 39, country: "England", leagueName: "Premier League", tier: 1, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { apiLeagueId: 40, country: "England", leagueName: "Championship", tier: 1, flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { apiLeagueId: 140, country: "Spain", leagueName: "La Liga", tier: 1, flag: "🇪🇸" },
  { apiLeagueId: 141, country: "Spain", leagueName: "Segunda División", tier: 1, flag: "🇪🇸" },
  { apiLeagueId: 78, country: "Germany", leagueName: "Bundesliga", tier: 1, flag: "🇩🇪" },
  { apiLeagueId: 79, country: "Germany", leagueName: "2. Bundesliga", tier: 1, flag: "🇩🇪" },
  { apiLeagueId: 135, country: "Italy", leagueName: "Serie A", tier: 1, flag: "🇮🇹" },
  { apiLeagueId: 136, country: "Italy", leagueName: "Serie B", tier: 1, flag: "🇮🇹" },
  { apiLeagueId: 61, country: "France", leagueName: "Ligue 1", tier: 1, flag: "🇫🇷" },
  { apiLeagueId: 62, country: "France", leagueName: "Ligue 2", tier: 1, flag: "🇫🇷" },
  { apiLeagueId: 88, country: "Netherlands", leagueName: "Eredivisie", tier: 1, flag: "🇳🇱" },
  { apiLeagueId: 94, country: "Portugal", leagueName: "Primeira Liga", tier: 1, flag: "🇵🇹" },
  { apiLeagueId: 71, country: "Brazil", leagueName: "Série A", tier: 1, flag: "🇧🇷" },
  { apiLeagueId: 128, country: "Argentina", leagueName: "Liga Profesional", tier: 1, flag: "🇦🇷" },
  { apiLeagueId: 203, country: "Turkey", leagueName: "Süper Lig", tier: 1, flag: "🇹🇷" },
  { apiLeagueId: 144, country: "Belgium", leagueName: "Pro League", tier: 1, flag: "🇧🇪" },
  { apiLeagueId: 179, country: "Scotland", leagueName: "Premiership", tier: 1, flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { apiLeagueId: 253, country: "USA", leagueName: "MLS", tier: 1, flag: "🇺🇸" },
  { apiLeagueId: 262, country: "Mexico", leagueName: "Liga MX", tier: 1, flag: "🇲🇽" },
  { apiLeagueId: 98, country: "Japan", leagueName: "J1 League", tier: 1, flag: "🇯🇵" },
  { apiLeagueId: 307, country: "Saudi Arabia", leagueName: "Saudi Pro League", tier: 1, flag: "🇸🇦" },
  { apiLeagueId: 188, country: "Australia", leagueName: "A-League", tier: 1, flag: "🇦🇺" },
  { apiLeagueId: 235, country: "Russia", leagueName: "Premier League", tier: 1, flag: "🇷🇺" },
  { apiLeagueId: 169, country: "China", leagueName: "Super League", tier: 1, flag: "🇨🇳" },
  { apiLeagueId: 292, country: "South Korea", leagueName: "K League 1", tier: 1, flag: "🇰🇷" },
  { apiLeagueId: 218, country: "Austria", leagueName: "Bundesliga", tier: 1, flag: "🇦🇷" },
  { apiLeagueId: 207, country: "Switzerland", leagueName: "Super League", tier: 1, flag: "🇨🇭" },
  { apiLeagueId: 119, country: "Denmark", leagueName: "Superliga", tier: 1, flag: "🇩🇰" },
  { apiLeagueId: 197, country: "Greece", leagueName: "Super League", tier: 1, flag: "🇬🇷" },
  { apiLeagueId: 345, country: "Czech Republic", leagueName: "First League", tier: 1, flag: "🇨🇿" },
  { apiLeagueId: 239, country: "Colombia", leagueName: "Primera A", tier: 1, flag: "🇨🇴" },
  { apiLeagueId: 268, country: "Uruguay", leagueName: "Primera División", tier: 1, flag: "🇺🇾" },

  /* ─────────────────────────────────────────────
     TIER 2 COUNTRIES (27 Regional Leagues)
     ───────────────────────────────────────────── */
  { apiLeagueId: 103, country: "Norway", leagueName: "Eliteserien", tier: 2, flag: "🇳🇴" },
  { apiLeagueId: 113, country: "Sweden", leagueName: "Allsvenskan", tier: 2, flag: "🇸🇪" },
  { apiLeagueId: 210, country: "Croatia", leagueName: "HNL", tier: 2, flag: "🇭🇷" },
  { apiLeagueId: 106, country: "Poland", leagueName: "Ekstraklasa", tier: 2, flag: "🇵🇱" },
  { apiLeagueId: 283, country: "Romania", leagueName: "Liga I", tier: 2, flag: "🇷🇴" },
  { apiLeagueId: 286, country: "Serbia", leagueName: "SuperLiga", tier: 2, flag: "🇷🇸" },
  { apiLeagueId: 333, country: "Ukraine", leagueName: "Premier League", tier: 2, flag: "🇺🇦" },
  { apiLeagueId: 271, country: "Hungary", leagueName: "NB I", tier: 2, flag: "🇭🇺" },
  { apiLeagueId: 172, country: "Bulgaria", leagueName: "First League", tier: 2, flag: "🇧🇬" },
  { apiLeagueId: 332, country: "Slovakia", leagueName: "Super Liga", tier: 2, flag: "🇸🇰" },
  { apiLeagueId: 373, country: "Slovenia", leagueName: "1. SNL", tier: 2, flag: "🇸🇮" },
  { apiLeagueId: 244, country: "Finland", leagueName: "Veikkausliiga", tier: 2, flag: "🇫🇮" },
  { apiLeagueId: 164, country: "Iceland", leagueName: "Besta deild karla", tier: 2, flag: "🇮🇸" },
  { apiLeagueId: 357, country: "Ireland", leagueName: "Premier Division", tier: 2, flag: "🇮🇪" },
  { apiLeagueId: 110, country: "Wales", leagueName: "Premier League", tier: 2, flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { apiLeagueId: 265, country: "Chile", leagueName: "Primera División", tier: 2, flag: "🇨🇱" },
  { apiLeagueId: 281, country: "Peru", leagueName: "Primera División", tier: 2, flag: "🇵🇪" },
  { apiLeagueId: 250, country: "Paraguay", leagueName: "Primera División", tier: 2, flag: "🇵🇾" },
  { apiLeagueId: 240, country: "Ecuador", leagueName: "Liga Pro", tier: 2, flag: "🇪🇨" },
  { apiLeagueId: 305, country: "Qatar", leagueName: "Stars League", tier: 2, flag: "🇶🇦" },
  { apiLeagueId: 301, country: "UAE", leagueName: "Pro League", tier: 2, flag: "🇦🇪" },
  { apiLeagueId: 233, country: "Egypt", leagueName: "Premier League", tier: 2, flag: "🇪🇬" },
  { apiLeagueId: 288, country: "South Africa", leagueName: "Premier Soccer League", tier: 2, flag: "🇿🇦" },
  { apiLeagueId: 200, country: "Morocco", leagueName: "Botola Pro", tier: 2, flag: "🇲🇦" },
  { apiLeagueId: 202, country: "Tunisia", leagueName: "Ligue 1", tier: 2, flag: "🇹🇳" },
  { apiLeagueId: 323, country: "India", leagueName: "Indian Super League", tier: 2, flag: "🇮🇳" },
  { apiLeagueId: 299, country: "Thailand", leagueName: "Thai League 1", tier: 2, flag: "🇹🇭" },
];

// Set of all allowed API League IDs for O(1) lookup
const ALLOWED_LEAGUE_ID_SET = new Set<number>(APPROVED_LEAGUES.map((l) => l.apiLeagueId));

// Map of league ID to details
const LEAGUE_MAP = new Map<number, MappedLeague>(
  APPROVED_LEAGUES.map((l) => [l.apiLeagueId, l])
);

/** Checks whether an API league ID belongs to the 54 approved countries / int. clubs */
export function isLeagueAllowed(leagueId: number): boolean {
  return ALLOWED_LEAGUE_ID_SET.has(leagueId);
}

/** Returns all approved API league IDs */
export function getAllowedLeagueIds(): number[] {
  return Array.from(ALLOWED_LEAGUE_ID_SET);
}

/** Look up information about a specific league */
export function getLeagueInfo(leagueId: number): MappedLeague | undefined {
  return LEAGUE_MAP.get(leagueId);
}

/** Returns all mapped leagues */
export function getApprovedLeagues(): MappedLeague[] {
  return APPROVED_LEAGUES;
}

