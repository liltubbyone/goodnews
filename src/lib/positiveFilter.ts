// Keywords that boost an article's positivity score
const POSITIVE_KEYWORDS = [
  // Achievements & milestones
  'breakthrough', 'discovery', 'milestone', 'record', 'record-breaking', 'record breaking',
  'first ever', 'first time', 'historic', 'historic win', 'pioneering', 'groundbreaking',
  'achievement', 'accomplished', 'success', 'successful', 'succeeds', 'surpasses', 'exceeds',
  'awarded', 'award', 'honored', 'recognized', 'celebrated', 'celebrates', 'prize',
  'champion', 'championship', 'gold medal', 'trophy',
  // Hope & progress
  'hope', 'hopeful', 'inspiring', 'inspiration', 'uplifting', 'positive change',
  'progress', 'progress made', 'advancement', 'forward', 'improvement', 'improved',
  'thriving', 'thrives', 'flourishing', 'booming', 'expanding', 'growing',
  'momentum', 'turning point', 'good news',
  // Helping & community
  'volunteers', 'volunteering', 'helping', 'helps', 'helped', 'support', 'supported',
  'charity', 'donates', 'donation', 'fundraising', 'empowers', 'empowerment',
  'community', 'neighbors', 'together', 'united', 'collaboration', 'partnership',
  'kindness', 'compassion', 'generosity', 'giving back',
  // Healing & health victories
  'saved', 'saves', 'rescues', 'rescued', 'recovery', 'recovered', 'recovering',
  'cure', 'cured', 'heals', 'healed', 'treatment success', 'remission', 'survived',
  'life-saving', 'lifesaving', 'life saving', 'restored', 'revived', 'rehabilitated',
  'vaccine approved', 'therapy approved', 'approved treatment',
  // Innovation & science wins
  'innovation', 'innovates', 'invention', 'invented', 'discovers', 'breakthrough study',
  'new technology', 'clean energy', 'renewable', 'sustainable', 'solar powered',
  'conservation', 'protected', 'species saved', 'habitat restored', 'rewilding',
  'carbon neutral', 'zero emissions', 'green energy',
  // Social good
  'eradicated', 'eliminated', 'solved', 'fixed', 'resolved', 'free of charge',
  'grants', 'scholarships', 'opens doors', 'launches', 'launched', 'opens',
  'reaches', 'builds', 'creates', 'connects', 'extraordinary', 'transforms',
  'wonderful', 'remarkable', 'unprecedented success',
]

// Any of these words in title/summary → article is disqualified (score = 0)
const NEGATIVE_KEYWORDS = [
  'killed', 'kills', 'dies', 'died', 'death toll', 'murder', 'murders',
  'war', 'attack', 'attacks', 'shooting', 'shot dead', 'bomb', 'explosion',
  'violence', 'crash', 'tragedy', 'disaster', 'crisis', 'scandal', 'fraud',
  'corruption', 'arrested', 'prison', 'lawsuit', 'riot', 'conflict',
  'abuse', 'kidnap', 'terrorism', 'terrorist', 'mass casualty', 'wildfire',
  'deadly', 'fatal', 'hostage', 'massacre', 'genocide', 'famine deaths',
  'overdose deaths', 'suicide rate', 'sex crime', 'child abuse',
]

export function scorePositivity(title: string, summary: string): number {
  const text = `${title} ${summary}`.toLowerCase()

  for (const neg of NEGATIVE_KEYWORDS) {
    if (text.includes(neg)) return 0
  }

  let score = 40
  for (const pos of POSITIVE_KEYWORDS) {
    if (text.includes(pos)) score += 8
  }

  return Math.min(100, score)
}

export function isPositive(title: string, summary: string, threshold = 60): boolean {
  return scorePositivity(title, summary) >= threshold
}

export function categorizeArticle(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase()
  if (/\b(tech|ai|robot|software|computer|digital|app|device|invention|engineer|space|nasa|quantum)\b/.test(text)) return 'Science & Tech'
  if (/\b(climate|environment|wildlife|forest|ocean|coral|renewable|solar|wind|nature|conservation|biodiversity)\b/.test(text)) return 'Environment'
  if (/\b(health|medical|hospital|doctor|cure|treatment|disease|medicine|vaccine|therapy|cancer|mental health)\b/.test(text)) return 'Health'
  if (/\b(school|education|student|teacher|literacy|learn|college|university|scholarship|children)\b/.test(text)) return 'Education'
  if (/\b(sport|athlete|olympic|champion|record|game|team|win|trophy|soccer|football|tennis|marathon)\b/.test(text)) return 'Sports'
  if (/\b(art|music|culture|film|museum|theater|dance|creative|painting|poetry|festival)\b/.test(text)) return 'Arts & Culture'
  if (/\b(volunteer|charity|donate|humanitarian|refugee|aid|rescue|poverty|hunger|shelter)\b/.test(text)) return 'Humanitarian'
  return 'Community'
}

// Country name mappings for specific detection
const COUNTRY_PATTERNS: Array<{ pattern: RegExp; region: string; country: string }> = [
  // Oceania
  { pattern: /\baustralian?\b/, region: 'Oceania', country: 'Australia' },
  { pattern: /\bnew zealand\b/, region: 'Oceania', country: 'New Zealand' },
  { pattern: /\bfiji\b/, region: 'Oceania', country: 'Fiji' },
  { pattern: /\bsamoa\b/, region: 'Oceania', country: 'Samoa' },
  { pattern: /\bpapua\b/, region: 'Oceania', country: 'Papua New Guinea' },
  { pattern: /\boceania\b/, region: 'Oceania', country: 'Oceania' },
  // Africa
  { pattern: /\bsouth africa\b/, region: 'Africa', country: 'South Africa' },
  { pattern: /\bkenya(n)?\b/, region: 'Africa', country: 'Kenya' },
  { pattern: /\bnigeria(n)?\b/, region: 'Africa', country: 'Nigeria' },
  { pattern: /\bghana(ian)?\b/, region: 'Africa', country: 'Ghana' },
  { pattern: /\bethiopia(n)?\b/, region: 'Africa', country: 'Ethiopia' },
  { pattern: /\btanzania(n)?\b/, region: 'Africa', country: 'Tanzania' },
  { pattern: /\buganda(n)?\b/, region: 'Africa', country: 'Uganda' },
  { pattern: /\brwanda(n)?\b/, region: 'Africa', country: 'Rwanda' },
  { pattern: /\bsenegal(ese)?\b/, region: 'Africa', country: 'Senegal' },
  { pattern: /\bmali(an)?\b/, region: 'Africa', country: 'Mali' },
  { pattern: /\bzambia(n)?\b/, region: 'Africa', country: 'Zambia' },
  { pattern: /\bmorocco|moroccan\b/, region: 'Africa', country: 'Morocco' },
  { pattern: /\begypt(ian)?\b/, region: 'Africa', country: 'Egypt' },
  { pattern: /\bcameroon\b/, region: 'Africa', country: 'Cameroon' },
  { pattern: /\bafrica(n)?\b/, region: 'Africa', country: 'Africa' },
  // Asia
  { pattern: /\bjapan(ese)?\b/, region: 'Asia', country: 'Japan' },
  { pattern: /\bchina|chinese\b/, region: 'Asia', country: 'China' },
  { pattern: /\bindia(n)?\b/, region: 'Asia', country: 'India' },
  { pattern: /\bsouth korea(n)?|korean\b/, region: 'Asia', country: 'South Korea' },
  { pattern: /\bkorea(n)?\b/, region: 'Asia', country: 'South Korea' },
  { pattern: /\bbangladesh(i)?\b/, region: 'Asia', country: 'Bangladesh' },
  { pattern: /\bvietnam(ese)?\b/, region: 'Asia', country: 'Vietnam' },
  { pattern: /\bindonesia(n)?\b/, region: 'Asia', country: 'Indonesia' },
  { pattern: /\bthailand|thai\b/, region: 'Asia', country: 'Thailand' },
  { pattern: /\bmalaysia(n)?\b/, region: 'Asia', country: 'Malaysia' },
  { pattern: /\bsingapore(an)?\b/, region: 'Asia', country: 'Singapore' },
  { pattern: /\bpakistan(i)?\b/, region: 'Asia', country: 'Pakistan' },
  { pattern: /\bphilippines|filipino\b/, region: 'Asia', country: 'Philippines' },
  { pattern: /\basia(n)?\b/, region: 'Asia', country: 'Asia' },
  // Europe
  { pattern: /\bunited kingdom|u\.k\.|uk\b/, region: 'Europe', country: 'United Kingdom' },
  { pattern: /\bbritain|british\b/, region: 'Europe', country: 'United Kingdom' },
  { pattern: /\bfrance|french\b/, region: 'Europe', country: 'France' },
  { pattern: /\bgermany|german\b/, region: 'Europe', country: 'Germany' },
  { pattern: /\bspain|spanish\b/, region: 'Europe', country: 'Spain' },
  { pattern: /\bitaly|italian\b/, region: 'Europe', country: 'Italy' },
  { pattern: /\bnetherlands|dutch\b/, region: 'Europe', country: 'Netherlands' },
  { pattern: /\bsweden|swedish\b/, region: 'Europe', country: 'Sweden' },
  { pattern: /\bnorway|norwegian\b/, region: 'Europe', country: 'Norway' },
  { pattern: /\bdenmark|danish\b/, region: 'Europe', country: 'Denmark' },
  { pattern: /\bportugal|portuguese\b/, region: 'Europe', country: 'Portugal' },
  { pattern: /\baustria(n)?\b/, region: 'Europe', country: 'Austria' },
  { pattern: /\bswitzerland|swiss\b/, region: 'Europe', country: 'Switzerland' },
  { pattern: /\bbelgium|belgian\b/, region: 'Europe', country: 'Belgium' },
  { pattern: /\bireland|irish\b/, region: 'Europe', country: 'Ireland' },
  { pattern: /\bpoland|polish\b/, region: 'Europe', country: 'Poland' },
  { pattern: /\bfinland|finnish\b/, region: 'Europe', country: 'Finland' },
  { pattern: /\bgreece|greek\b/, region: 'Europe', country: 'Greece' },
  { pattern: /\beurope(an)?\b/, region: 'Europe', country: 'Europe' },
  // Middle East
  { pattern: /\bisrael(i)?\b/, region: 'Middle East', country: 'Israel' },
  { pattern: /\bjordan(ian)?\b/, region: 'Middle East', country: 'Jordan' },
  { pattern: /\bsaudi arabia|saudi\b/, region: 'Middle East', country: 'Saudi Arabia' },
  { pattern: /\bdubai\b/, region: 'Middle East', country: 'UAE' },
  { pattern: /\buae|emirates\b/, region: 'Middle East', country: 'UAE' },
  { pattern: /\biran(ian)?\b/, region: 'Middle East', country: 'Iran' },
  { pattern: /\biraq(i)?\b/, region: 'Middle East', country: 'Iraq' },
  { pattern: /\bqatar(i)?\b/, region: 'Middle East', country: 'Qatar' },
  { pattern: /\bkuwait(i)?\b/, region: 'Middle East', country: 'Kuwait' },
  { pattern: /\bbahrain(i)?\b/, region: 'Middle East', country: 'Bahrain' },
  { pattern: /\boman(i)?\b/, region: 'Middle East', country: 'Oman' },
  { pattern: /\blebanon|lebanese\b/, region: 'Middle East', country: 'Lebanon' },
  { pattern: /\bturkey|turkish\b/, region: 'Middle East', country: 'Turkey' },
  { pattern: /\bmiddle east\b/, region: 'Middle East', country: 'Middle East' },
  // Latin America
  { pattern: /\bbrazil(ian)?\b/, region: 'Latin America', country: 'Brazil' },
  { pattern: /\bmexico|mexican\b/, region: 'Latin America', country: 'Mexico' },
  { pattern: /\bcolombia(n)?\b/, region: 'Latin America', country: 'Colombia' },
  { pattern: /\bargentina(n)?\b/, region: 'Latin America', country: 'Argentina' },
  { pattern: /\bchile(an)?\b/, region: 'Latin America', country: 'Chile' },
  { pattern: /\bperu(vian)?\b/, region: 'Latin America', country: 'Peru' },
  { pattern: /\becuador(ian)?\b/, region: 'Latin America', country: 'Ecuador' },
  { pattern: /\bvenezuela(n)?\b/, region: 'Latin America', country: 'Venezuela' },
  { pattern: /\bcosta rica(n)?\b/, region: 'Latin America', country: 'Costa Rica' },
  { pattern: /\bpanama(nian)?\b/, region: 'Latin America', country: 'Panama' },
  { pattern: /\blatin america(n)?\b/, region: 'Latin America', country: 'Latin America' },
  // North America
  { pattern: /\bcanada(ian)?\b/, region: 'North America', country: 'Canada' },
  { pattern: /\bunited states|u\.s\.|usa\b/, region: 'North America', country: 'United States' },
  { pattern: /\bamerica(n)?\b/, region: 'North America', country: 'United States' },
  { pattern: /\bcalifornia\b/, region: 'North America', country: 'United States' },
  { pattern: /\bnew york\b/, region: 'North America', country: 'United States' },
  { pattern: /\btexas\b/, region: 'North America', country: 'United States' },
  { pattern: /\bflorida\b/, region: 'North America', country: 'United States' },
  { pattern: /\bchicago\b/, region: 'North America', country: 'United States' },
]

export function detectRegion(title: string, summary: string, sourceName: string): { region: string; country: string } {
  const text = `${title} ${summary} ${sourceName}`.toLowerCase()

  for (const entry of COUNTRY_PATTERNS) {
    if (entry.pattern.test(text)) {
      return { region: entry.region, country: entry.country }
    }
  }

  return { region: 'Global', country: 'International' }
}
