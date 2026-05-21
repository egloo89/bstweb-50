/**
 * 날짜 문자열을 사람 친화적 형식으로 변환
 * - 오늘: 오늘 HH:MM
 * - 올해: MM.DD. HH:MM  (시간 정보 있을 때)
 * - 올해: MM.DD.        (날짜만 있을 때)
 * - 이전 연도: YYYY.MM.DD. HH:MM
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const pad = (n: number) => String(n).padStart(2, "0")
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const isThisYear = d.getFullYear() === now.getFullYear()
  const hasTime = dateStr.includes("T") || dateStr.includes(" ")
  const timePart = hasTime ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}` : ""

  if (isToday) return `오늘 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (isThisYear) return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${timePart}`
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}.${timePart}`
}
