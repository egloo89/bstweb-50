/**
 * 날짜 문자열을 KST(UTC+9) 기준으로 포맷
 * 서버(Vercel=UTC)와 클라이언트(브라우저) 모두 동일한 시각을 표시하기 위해
 * UTC 타임스탬프에 +9시간을 직접 더해 getUTC* 메서드로 읽음
 *
 * - 오늘: 오늘 HH:MM
 * - 올해: MM.DD. HH:MM  (시간 정보 있을 때)
 * - 올해: MM.DD.        (날짜만 있을 때)
 * - 이전 연도: YYYY.MM.DD. HH:MM
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr

  const pad = (n: number) => String(n).padStart(2, "0")
  const hasTime = dateStr.includes("T") || dateStr.includes(" ")
  const KST_OFFSET = 9 * 60 * 60 * 1000

  // KST 기준 날짜/시각 계산 (서버·클라이언트 공통)
  const kst = new Date(d.getTime() + KST_OFFSET)
  const nowKst = new Date(Date.now() + KST_OFFSET)

  const y = kst.getUTCFullYear()
  const m = kst.getUTCMonth() + 1
  const day = kst.getUTCDate()
  const h = kst.getUTCHours()
  const min = kst.getUTCMinutes()

  const isToday = y === nowKst.getUTCFullYear()
    && m === nowKst.getUTCMonth() + 1
    && day === nowKst.getUTCDate()
  const isThisYear = y === nowKst.getUTCFullYear()
  const timePart = hasTime ? ` ${pad(h)}:${pad(min)}` : ""

  if (isToday) return `오늘 ${pad(h)}:${pad(min)}`
  if (isThisYear) return `${pad(m)}.${pad(day)}.${timePart}`
  return `${y}.${pad(m)}.${pad(day)}.${timePart}`
}
