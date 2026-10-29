export function getContrastColor(bgColor: string): string {
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#111111' : '#ffffff'
}

/** "#888" or "#888888" plus an alpha byte ("cc") → "#888888cc". Plain concatenation broke 3-digit colours. */
export function withAlpha(color: string, alpha: string): string {
  const hex = color.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.slice(0, 6)
  return `#${full}${alpha}`
}
