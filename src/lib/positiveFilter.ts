// Keywords that boost an article's positivity score
const POSITIVE_KEYWORDS = [
  'breakthrough', 'discovery', 'hope', 'success', 'achievement', 'saved',
  'restored', 'helping', 'volunteers', 'innovation', 'cure', 'progress',
  'milestone', 'record', 'award', 'growth', 'improved', 'thriving',
  'celebrates', 'historic', 'pioneering', 'inspiring', 'wonderful',
  'extraordinary', 'transforms', 'heals', 'protects', 'rescues', 'builds',
  'creates', 'connects', 'renewable', 'sustainable', 'clean energy',
  'conservation', 'charity', 'donates', 'education', 'empowers',
  'first ever', 'record-breaking', 'life-saving', 'groundbreaking',
  'historic win', 'free', 'grants', 'revived', 'recovered', 'thrives',
  'flourishing', 'booming', 'expanding', 'launched', 'opens', 'reaches',
  'exceeds', 'surpasses', 'celebrated', 'honored', 'awarded', 'recognized',
  'eradicated', 'eliminated', 'solved', 'fixed', 'resolved', 'healed',
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

  let score = 50
  for (const pos of POSITIVE_KEYWORDS) {
    if (text.includes(pos)) score += 6
  }

  return Math.min(100, score)
}

export function isPositive(title: string, summary: string, threshold = 50): boolean {
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

export function detectRegion(title: string, summary: string, sourceName: string): { region: string; country: string } {
  const text = `${title} ${summary} ${sourceName}`.toLowerCase()
  if (/\b(australia|new zealand|pacific islands|papua|fiji|samoa|oceania)\b/.test(text)) return { region: 'Oceania', country: 'Australia' }
  if (/\b(africa|kenya|nigeria|ghana|ethiopia|tanzania|uganda|rwanda|south africa|senegal|ghana|mali|zambia)\b/.test(text)) return { region: 'Africa', country: 'Africa' }
  if (/\b(india|china|japan|south korea|korea|asia|bangladesh|vietnam|indonesia|thailand|malaysia|singapore|pakistan)\b/.test(text)) return { region: 'Asia', country: 'Asia' }
  if (/\b(europe|uk|britain|france|germany|spain|italy|netherlands|sweden|norway|denmark|portugal|austria|switzerland|belgium)\b/.test(text)) return { region: 'Europe', country: 'Europe' }
  if (/\b(middle east|israel|jordan|saudi arabia|dubai|uae|iran|iraq|qatar|kuwait|bahrain|oman|lebanon|turkey)\b/.test(text)) return { region: 'Middle East', country: 'Middle East' }
  if (/\b(latin america|brazil|mexico|colombia|argentina|chile|peru|ecuador|venezuela|costa rica|panama)\b/.test(text)) return { region: 'Latin America', country: 'Latin America' }
  if (/\b(canada|united states|usa|america|california|new york|texas|florida|chicago)\b/.test(text)) return { region: 'North America', country: 'North America' }
  return { region: 'Global', country: 'International' }
}
