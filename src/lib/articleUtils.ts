export function cleanContent(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')           // strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/ONLY AVAILABLE IN (PAID|PROFESSIONAL|CORPORATE) PLANS?\\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function extractKeyPoints(title: string, summary: string, content: string): string[] {
  const cleaned = cleanContent(content)
  const allText = `${summary}. ${cleaned}`

  // Primary: sentences long enough to be informative
  const sentences = allText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 300 && !/^(the|a|an|this|that|it|in|on|at)\s/i.test(s))

  const scored = sentences.map(s => ({
    text: s.replace(/\.$/, ''),
    score:
      (s.match(/\d[\d,.]*/g)?.length ?? 0) * 3 +
      (s.match(/%|million|billion|thousand|percent/gi)?.length ?? 0) * 2 +
      (s.match(/\b(first|record|historic|largest|breakthrough|surpass|double|triple|achieve|save|protect|restore)\b/gi)?.length ?? 0) * 2,
  }))

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(s => s.text)
    .filter(Boolean)

  if (top.length > 0) return top

  // Fallback: use any sentences we found, even short ones
  if (sentences.length > 0) return sentences.slice(0, 3).map(s => s.replace(/\.$/, ''))

  // Last resort: split summary into chunks if no sentence boundaries exist
  if (summary.trim()) {
    const chunks = summary.match(/.{40,120}(\s|$)/g) ?? [summary]
    return chunks.slice(0, 2).map(s => s.trim().replace(/\.$/, ''))
  }

  return []
}
