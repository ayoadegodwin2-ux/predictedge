import type { Prediction, MarketConfig, CountryConfig } from "./types";

/* ─────────────────────────────────────────────
   DAILY PICK — single highest-confidence game
   ───────────────────────────────────────────── */

export const mockDailyPick: Prediction = {
  id: 1,
  homeTeam: "Real Madrid",
  awayTeam: "Barcelona",
  league: "La Liga",
  country: "Spain",
  countryFlag: "🇪🇸",
  kickoff: "2025-01-15T20:00:00Z",
  market: "Over 1.5 Goals",
  odds: 1.45,
  confidence: 95,
  isWeekendPick: false,
};

/* ─────────────────────────────────────────────
   WEEKEND 50 — 50 curated weekend picks
   ───────────────────────────────────────────── */

export const mockWeekendPicks: Prediction[] = [
  { id: 1, homeTeam: "Manchester City", awayTeam: "Arsenal", league: "Premier League", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", kickoff: "2025-01-18T15:00:00Z", market: "Over 2.5 Goals", odds: 1.55, confidence: 89, isWeekendPick: true },
  { id: 2, homeTeam: "Liverpool", awayTeam: "Chelsea", league: "Premier League", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", kickoff: "2025-01-18T17:30:00Z", market: "GG / BTTS - Yes", odds: 1.72, confidence: 85, isWeekendPick: true },
  { id: 3, homeTeam: "Bayern Munich", awayTeam: "Borussia Dortmund", league: "Bundesliga", country: "Germany", countryFlag: "🇩🇪", kickoff: "2025-01-18T18:30:00Z", market: "Home Win", odds: 1.40, confidence: 91, isWeekendPick: true },
  { id: 4, homeTeam: "Inter Milan", awayTeam: "AC Milan", league: "Serie A", country: "Italy", countryFlag: "🇮🇹", kickoff: "2025-01-18T20:45:00Z", market: "Over 1.5 Goals", odds: 1.35, confidence: 94, isWeekendPick: true },
  { id: 5, homeTeam: "PSG", awayTeam: "Marseille", league: "Ligue 1", country: "France", countryFlag: "🇫🇷", kickoff: "2025-01-18T21:00:00Z", market: "Home Win", odds: 1.38, confidence: 90, isWeekendPick: true },
  { id: 6, homeTeam: "Ajax", awayTeam: "PSV Eindhoven", league: "Eredivisie", country: "Netherlands", countryFlag: "🇳🇱", kickoff: "2025-01-18T16:45:00Z", market: "Over 2.5 Goals", odds: 1.60, confidence: 82, isWeekendPick: true },
  { id: 7, homeTeam: "Benfica", awayTeam: "Porto", league: "Primeira Liga", country: "Portugal", countryFlag: "🇵🇹", kickoff: "2025-01-18T21:30:00Z", market: "GG / BTTS - Yes", odds: 1.65, confidence: 80, isWeekendPick: true },
  { id: 8, homeTeam: "Flamengo", awayTeam: "Palmeiras", league: "Série A", country: "Brazil", countryFlag: "🇧🇷", kickoff: "2025-01-19T00:00:00Z", market: "Over 1.5 Goals", odds: 1.42, confidence: 88, isWeekendPick: true },
  { id: 9, homeTeam: "Boca Juniors", awayTeam: "River Plate", league: "Liga Profesional", country: "Argentina", countryFlag: "🇦🇷", kickoff: "2025-01-19T01:00:00Z", market: "Home Double Chance", odds: 1.30, confidence: 93, isWeekendPick: true },
  { id: 10, homeTeam: "Galatasaray", awayTeam: "Fenerbahce", league: "Süper Lig", country: "Turkey", countryFlag: "🇹🇷", kickoff: "2025-01-18T19:00:00Z", market: "Over 1.5 Goals", odds: 1.38, confidence: 90, isWeekendPick: true },
  { id: 11, homeTeam: "Tottenham", awayTeam: "Manchester United", league: "Premier League", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", kickoff: "2025-01-18T12:30:00Z", market: "Over 2.5 Goals", odds: 1.70, confidence: 78, isWeekendPick: true },
  { id: 12, homeTeam: "Atletico Madrid", awayTeam: "Real Sociedad", league: "La Liga", country: "Spain", countryFlag: "🇪🇸", kickoff: "2025-01-18T16:15:00Z", market: "Home Win", odds: 1.55, confidence: 84, isWeekendPick: true },
  { id: 13, homeTeam: "Sevilla", awayTeam: "Valencia", league: "La Liga", country: "Spain", countryFlag: "🇪🇸", kickoff: "2025-01-18T14:00:00Z", market: "Under 3.5 Goals", odds: 1.32, confidence: 87, isWeekendPick: true },
  { id: 14, homeTeam: "Napoli", awayTeam: "Juventus", league: "Serie A", country: "Italy", countryFlag: "🇮🇹", kickoff: "2025-01-18T18:00:00Z", market: "GG / BTTS - Yes", odds: 1.58, confidence: 83, isWeekendPick: true },
  { id: 15, homeTeam: "AS Roma", awayTeam: "Lazio", league: "Serie A", country: "Italy", countryFlag: "🇮🇹", kickoff: "2025-01-19T20:45:00Z", market: "Over 1.5 Goals", odds: 1.40, confidence: 89, isWeekendPick: true },
  { id: 16, homeTeam: "RB Leipzig", awayTeam: "Bayer Leverkusen", league: "Bundesliga", country: "Germany", countryFlag: "🇩🇪", kickoff: "2025-01-18T15:30:00Z", market: "Over 2.5 Goals", odds: 1.62, confidence: 81, isWeekendPick: true },
  { id: 17, homeTeam: "Lyon", awayTeam: "Monaco", league: "Ligue 1", country: "France", countryFlag: "🇫🇷", kickoff: "2025-01-18T17:00:00Z", market: "GG / BTTS - Yes", odds: 1.70, confidence: 79, isWeekendPick: true },
  { id: 18, homeTeam: "Celtic", awayTeam: "Rangers", league: "Premiership", country: "Scotland", countryFlag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", kickoff: "2025-01-18T12:00:00Z", market: "Home Win", odds: 1.50, confidence: 86, isWeekendPick: true },
  { id: 19, homeTeam: "Club Brugge", awayTeam: "Anderlecht", league: "Pro League", country: "Belgium", countryFlag: "🇧🇪", kickoff: "2025-01-18T18:30:00Z", market: "Home Double Chance", odds: 1.25, confidence: 95, isWeekendPick: true },
  { id: 20, homeTeam: "Sporting CP", awayTeam: "Braga", league: "Primeira Liga", country: "Portugal", countryFlag: "🇵🇹", kickoff: "2025-01-19T18:00:00Z", market: "Home Win", odds: 1.48, confidence: 85, isWeekendPick: true },
  { id: 21, homeTeam: "Red Bull Salzburg", awayTeam: "Rapid Wien", league: "Bundesliga", country: "Austria", countryFlag: "🇦🇹", kickoff: "2025-01-18T17:00:00Z", market: "Over 2.5 Goals", odds: 1.55, confidence: 83, isWeekendPick: true },
  { id: 22, homeTeam: "Copenhagen", awayTeam: "Midtjylland", league: "Superliga", country: "Denmark", countryFlag: "🇩🇰", kickoff: "2025-01-19T14:00:00Z", market: "Home Win", odds: 1.60, confidence: 77, isWeekendPick: true },
  { id: 23, homeTeam: "Young Boys", awayTeam: "Basel", league: "Super League", country: "Switzerland", countryFlag: "🇨🇭", kickoff: "2025-01-18T16:30:00Z", market: "Over 1.5 Goals", odds: 1.38, confidence: 88, isWeekendPick: true },
  { id: 24, homeTeam: "Olympiacos", awayTeam: "Panathinaikos", league: "Super League", country: "Greece", countryFlag: "🇬🇷", kickoff: "2025-01-18T19:30:00Z", market: "Home Win", odds: 1.45, confidence: 86, isWeekendPick: true },
  { id: 25, homeTeam: "Sparta Prague", awayTeam: "Slavia Prague", league: "First League", country: "Czech Republic", countryFlag: "🇨🇿", kickoff: "2025-01-19T15:00:00Z", market: "GG / BTTS - Yes", odds: 1.68, confidence: 76, isWeekendPick: true },
  { id: 26, homeTeam: "Dinamo Zagreb", awayTeam: "Hajduk Split", league: "HNL", country: "Croatia", countryFlag: "🇭🇷", kickoff: "2025-01-18T17:00:00Z", market: "Home Win", odds: 1.52, confidence: 82, isWeekendPick: true },
  { id: 27, homeTeam: "Legia Warsaw", awayTeam: "Lech Poznan", league: "Ekstraklasa", country: "Poland", countryFlag: "🇵🇱", kickoff: "2025-01-18T18:00:00Z", market: "Over 1.5 Goals", odds: 1.40, confidence: 84, isWeekendPick: true },
  { id: 28, homeTeam: "FCSB", awayTeam: "CFR Cluj", league: "Liga I", country: "Romania", countryFlag: "🇷🇴", kickoff: "2025-01-19T19:00:00Z", market: "Under 3.5 Goals", odds: 1.28, confidence: 91, isWeekendPick: true },
  { id: 29, homeTeam: "Red Star Belgrade", awayTeam: "Partizan", league: "SuperLiga", country: "Serbia", countryFlag: "🇷🇸", kickoff: "2025-01-18T16:00:00Z", market: "Home Win", odds: 1.42, confidence: 88, isWeekendPick: true },
  { id: 30, homeTeam: "Shakhtar Donetsk", awayTeam: "Dynamo Kyiv", league: "Premier League", country: "Ukraine", countryFlag: "🇺🇦", kickoff: "2025-01-19T17:00:00Z", market: "Over 1.5 Goals", odds: 1.45, confidence: 85, isWeekendPick: true },
  { id: 31, homeTeam: "Monterrey", awayTeam: "Club América", league: "Liga MX", country: "Mexico", countryFlag: "🇲🇽", kickoff: "2025-01-19T02:00:00Z", market: "Over 2.5 Goals", odds: 1.72, confidence: 74, isWeekendPick: true },
  { id: 32, homeTeam: "LA Galaxy", awayTeam: "LAFC", league: "MLS", country: "USA", countryFlag: "🇺🇸", kickoff: "2025-01-19T03:30:00Z", market: "GG / BTTS - Yes", odds: 1.65, confidence: 78, isWeekendPick: true },
  { id: 33, homeTeam: "Yokohama F. Marinos", awayTeam: "Vissel Kobe", league: "J1 League", country: "Japan", countryFlag: "🇯🇵", kickoff: "2025-01-19T06:00:00Z", market: "Over 1.5 Goals", odds: 1.42, confidence: 83, isWeekendPick: true },
  { id: 34, homeTeam: "Al Hilal", awayTeam: "Al Nassr", league: "Saudi Pro League", country: "Saudi Arabia", countryFlag: "🇸🇦", kickoff: "2025-01-18T20:00:00Z", market: "Over 2.5 Goals", odds: 1.58, confidence: 80, isWeekendPick: true },
  { id: 35, homeTeam: "Melbourne Victory", awayTeam: "Sydney FC", league: "A-League", country: "Australia", countryFlag: "🇦🇺", kickoff: "2025-01-19T07:00:00Z", market: "Home Double Chance", odds: 1.30, confidence: 89, isWeekendPick: true },
  { id: 36, homeTeam: "Aston Villa", awayTeam: "Newcastle", league: "Premier League", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", kickoff: "2025-01-19T14:00:00Z", market: "Over 1.5 Goals", odds: 1.38, confidence: 87, isWeekendPick: true },
  { id: 37, homeTeam: "Real Betis", awayTeam: "Villarreal", league: "La Liga", country: "Spain", countryFlag: "🇪🇸", kickoff: "2025-01-19T16:15:00Z", market: "GG / BTTS - Yes", odds: 1.75, confidence: 73, isWeekendPick: true },
  { id: 38, homeTeam: "Fiorentina", awayTeam: "Atalanta", league: "Serie A", country: "Italy", countryFlag: "🇮🇹", kickoff: "2025-01-19T15:00:00Z", market: "Over 2.5 Goals", odds: 1.62, confidence: 79, isWeekendPick: true },
  { id: 39, homeTeam: "Wolfsburg", awayTeam: "Stuttgart", league: "Bundesliga", country: "Germany", countryFlag: "🇩🇪", kickoff: "2025-01-19T15:30:00Z", market: "Under 3.5 Goals", odds: 1.35, confidence: 86, isWeekendPick: true },
  { id: 40, homeTeam: "Lille", awayTeam: "Lens", league: "Ligue 1", country: "France", countryFlag: "🇫🇷", kickoff: "2025-01-19T17:00:00Z", market: "Under 4.5 Goals", odds: 1.22, confidence: 94, isWeekendPick: true },
  { id: 41, homeTeam: "Feyenoord", awayTeam: "AZ Alkmaar", league: "Eredivisie", country: "Netherlands", countryFlag: "🇳🇱", kickoff: "2025-01-19T14:30:00Z", market: "Home Win", odds: 1.55, confidence: 82, isWeekendPick: true },
  { id: 42, homeTeam: "Corinthians", awayTeam: "Santos", league: "Série A", country: "Brazil", countryFlag: "🇧🇷", kickoff: "2025-01-19T22:00:00Z", market: "Over 1.5 Goals", odds: 1.40, confidence: 86, isWeekendPick: true },
  { id: 43, homeTeam: "Racing Club", awayTeam: "Independiente", league: "Liga Profesional", country: "Argentina", countryFlag: "🇦🇷", kickoff: "2025-01-19T23:00:00Z", market: "Home Win", odds: 1.65, confidence: 75, isWeekendPick: true },
  { id: 44, homeTeam: "Besiktas", awayTeam: "Trabzonspor", league: "Süper Lig", country: "Turkey", countryFlag: "🇹🇷", kickoff: "2025-01-19T19:00:00Z", market: "Home Double Chance", odds: 1.28, confidence: 91, isWeekendPick: true },
  { id: 45, homeTeam: "Everton", awayTeam: "West Ham", league: "Premier League", country: "England", countryFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", kickoff: "2025-01-19T15:00:00Z", market: "Under 3.5 Goals", odds: 1.30, confidence: 90, isWeekendPick: true },
  { id: 46, homeTeam: "Celta Vigo", awayTeam: "Athletic Bilbao", league: "La Liga", country: "Spain", countryFlag: "🇪🇸", kickoff: "2025-01-19T18:30:00Z", market: "Away Double Chance", odds: 1.35, confidence: 84, isWeekendPick: true },
  { id: 47, homeTeam: "Bologna", awayTeam: "Torino", league: "Serie A", country: "Italy", countryFlag: "🇮🇹", kickoff: "2025-01-19T12:30:00Z", market: "Under 4.5 Goals", odds: 1.20, confidence: 96, isWeekendPick: true },
  { id: 48, homeTeam: "Rosenborg", awayTeam: "Bodø/Glimt", league: "Eliteserien", country: "Norway", countryFlag: "🇳🇴", kickoff: "2025-01-19T16:00:00Z", market: "Over 1.5 Goals", odds: 1.42, confidence: 83, isWeekendPick: true },
  { id: 49, homeTeam: "Malmö FF", awayTeam: "AIK", league: "Allsvenskan", country: "Sweden", countryFlag: "🇸🇪", kickoff: "2025-01-19T15:00:00Z", market: "Home Win", odds: 1.55, confidence: 80, isWeekendPick: true },
  { id: 50, homeTeam: "Ferencváros", awayTeam: "Újpest", league: "NB I", country: "Hungary", countryFlag: "🇭🇺", kickoff: "2025-01-19T17:30:00Z", market: "Home Win", odds: 1.38, confidence: 88, isWeekendPick: true },
];

/* ─────────────────────────────────────────────
   APPROVED MARKETS (13)
   ───────────────────────────────────────────── */

export const mockMarkets: MarketConfig[] = [
  { id: 1, name: "Home Win (1X2 - Home)", enabled: true },
  { id: 2, name: "Away Win (1X2 - Away)", enabled: true },
  { id: 3, name: "Home Double Chance (1X)", enabled: true },
  { id: 4, name: "Away Double Chance (X2)", enabled: true },
  { id: 5, name: "Handicap (Asian/European)", enabled: true },
  { id: 6, name: "Over 1.5 Goals (FT)", enabled: true },
  { id: 7, name: "Over 2.5 Goals (FT)", enabled: true },
  { id: 8, name: "GG / Both Teams to Score (BTTS - Yes)", enabled: true },
  { id: 9, name: "Home Team to Score (Over 0.5)", enabled: true },
  { id: 10, name: "Away Team to Score (Over 0.5)", enabled: true },
  { id: 11, name: "First Half Over 0.5 Goals", enabled: true },
  { id: 12, name: "Under 3.5 Goals (FT)", enabled: true },
  { id: 13, name: "Under 4.5 Goals (FT)", enabled: true },
];

/* ─────────────────────────────────────────────
   APPROVED COUNTRIES (54)
   ───────────────────────────────────────────── */

export const mockCountries: CountryConfig[] = [
  // Tier 1 — Top Leagues (27)
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: 1, enabled: true },
  { name: "Spain", flag: "🇪🇸", tier: 1, enabled: true },
  { name: "Germany", flag: "🇩🇪", tier: 1, enabled: true },
  { name: "Italy", flag: "🇮🇹", tier: 1, enabled: true },
  { name: "France", flag: "🇫🇷", tier: 1, enabled: true },
  { name: "Netherlands", flag: "🇳🇱", tier: 1, enabled: true },
  { name: "Portugal", flag: "🇵🇹", tier: 1, enabled: true },
  { name: "Brazil", flag: "🇧🇷", tier: 1, enabled: true },
  { name: "Argentina", flag: "🇦🇷", tier: 1, enabled: true },
  { name: "Turkey", flag: "🇹🇷", tier: 1, enabled: true },
  { name: "Belgium", flag: "🇧🇪", tier: 1, enabled: true },
  { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tier: 1, enabled: true },
  { name: "USA", flag: "🇺🇸", tier: 1, enabled: true },
  { name: "Mexico", flag: "🇲🇽", tier: 1, enabled: true },
  { name: "Japan", flag: "🇯🇵", tier: 1, enabled: true },
  { name: "Saudi Arabia", flag: "🇸🇦", tier: 1, enabled: true },
  { name: "Australia", flag: "🇦🇺", tier: 1, enabled: true },
  { name: "Russia", flag: "🇷🇺", tier: 1, enabled: true },
  { name: "China", flag: "🇨🇳", tier: 1, enabled: true },
  { name: "South Korea", flag: "🇰🇷", tier: 1, enabled: true },
  { name: "Austria", flag: "🇦🇹", tier: 1, enabled: true },
  { name: "Switzerland", flag: "🇨🇭", tier: 1, enabled: true },
  { name: "Denmark", flag: "🇩🇰", tier: 1, enabled: true },
  { name: "Greece", flag: "🇬🇷", tier: 1, enabled: true },
  { name: "Czech Republic", flag: "🇨🇿", tier: 1, enabled: true },
  { name: "Colombia", flag: "🇨🇴", tier: 1, enabled: true },
  { name: "Uruguay", flag: "🇺🇾", tier: 1, enabled: true },

  // Tier 2 — Regional Leagues (27)
  { name: "Norway", flag: "🇳🇴", tier: 2, enabled: true },
  { name: "Sweden", flag: "🇸🇪", tier: 2, enabled: true },
  { name: "Croatia", flag: "🇭🇷", tier: 2, enabled: true },
  { name: "Poland", flag: "🇵🇱", tier: 2, enabled: true },
  { name: "Romania", flag: "🇷🇴", tier: 2, enabled: true },
  { name: "Serbia", flag: "🇷🇸", tier: 2, enabled: true },
  { name: "Ukraine", flag: "🇺🇦", tier: 2, enabled: true },
  { name: "Hungary", flag: "🇭🇺", tier: 2, enabled: true },
  { name: "Bulgaria", flag: "🇧🇬", tier: 2, enabled: true },
  { name: "Slovakia", flag: "🇸🇰", tier: 2, enabled: true },
  { name: "Slovenia", flag: "🇸🇮", tier: 2, enabled: true },
  { name: "Finland", flag: "🇫🇮", tier: 2, enabled: true },
  { name: "Iceland", flag: "🇮🇸", tier: 2, enabled: true },
  { name: "Ireland", flag: "🇮🇪", tier: 2, enabled: true },
  { name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", tier: 2, enabled: true },
  { name: "Chile", flag: "🇨🇱", tier: 2, enabled: true },
  { name: "Peru", flag: "🇵🇪", tier: 2, enabled: true },
  { name: "Paraguay", flag: "🇵🇾", tier: 2, enabled: true },
  { name: "Ecuador", flag: "🇪🇨", tier: 2, enabled: true },
  { name: "Qatar", flag: "🇶🇦", tier: 2, enabled: true },
  { name: "UAE", flag: "🇦🇪", tier: 2, enabled: true },
  { name: "Egypt", flag: "🇪🇬", tier: 2, enabled: true },
  { name: "South Africa", flag: "🇿🇦", tier: 2, enabled: true },
  { name: "Morocco", flag: "🇲🇦", tier: 2, enabled: true },
  { name: "Tunisia", flag: "🇹🇳", tier: 2, enabled: true },
  { name: "India", flag: "🇮🇳", tier: 2, enabled: true },
  { name: "Thailand", flag: "🇹🇭", tier: 2, enabled: true },
];

