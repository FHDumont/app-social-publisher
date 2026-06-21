import { dayKey } from "@/lib/format"

/**
 * Utilitários de grade de calendário. Cada dia é ancorado em 12:00 UTC para
 * evitar deslocamento de dia por fuso/DST; a exibição e o agrupamento usam
 * `dayKey` (timezone fixo), então grade e posts caem no mesmo dia de forma estável.
 */

export interface CalendarDay {
  /** ISO do dia ancorado em 12:00 UTC. */
  iso: string
  /** Chave "YYYY-MM-DD" no TZ fixo. */
  key: string
  /** Número do dia no mês. */
  dayNum: number
  /** Pertence ao mês de referência (para esmaecer dias vizinhos no grid mensal). */
  inMonth: boolean
  /** É o "hoje" do app. */
  isToday: boolean
}

function noonUTC(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0, 0))
}

function partsOf(iso: string): {
  year: number
  monthIndex: number
  day: number
} {
  const d = new Date(iso)
  return {
    year: d.getUTCFullYear(),
    monthIndex: d.getUTCMonth(),
    day: d.getUTCDate(),
  }
}

/** Índice da segunda-feira-base: 0 = segunda … 6 = domingo. */
function mondayIndex(date: Date): number {
  return (date.getUTCDay() + 6) % 7
}

function toDay(
  date: Date,
  refMonthIndex: number,
  todayKey: string
): CalendarDay {
  const iso = date.toISOString()
  return {
    iso,
    key: dayKey(iso),
    dayNum: date.getUTCDate(),
    inMonth: date.getUTCMonth() === refMonthIndex,
    isToday: dayKey(iso) === todayKey,
  }
}

/** Rótulos curtos dos dias da semana (segunda a domingo). */
export const WEEKDAY_LABELS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]

/** Grade mensal: semanas (segunda→domingo) cobrindo o mês do `anchorISO`. */
export function buildMonthGrid(
  anchorISO: string,
  nowISO: string
): CalendarDay[][] {
  const { year, monthIndex } = partsOf(anchorISO)
  const todayKey = dayKey(nowISO)

  const first = noonUTC(year, monthIndex, 1)
  const gridStart = noonUTC(year, monthIndex, 1 - mondayIndex(first))

  const weeks: CalendarDay[][] = []
  const cursor = new Date(gridStart)
  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = []
    for (let d = 0; d < 7; d++) {
      week.push(toDay(new Date(cursor), monthIndex, todayKey))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

/** Semana (segunda→domingo) que contém o `anchorISO`. */
export function buildWeek(anchorISO: string, nowISO: string): CalendarDay[] {
  const { year, monthIndex, day } = partsOf(anchorISO)
  const todayKey = dayKey(nowISO)
  const anchor = noonUTC(year, monthIndex, day)
  const start = noonUTC(year, monthIndex, day - mondayIndex(anchor))

  const week: CalendarDay[] = []
  const cursor = new Date(start)
  for (let d = 0; d < 7; d++) {
    week.push(toDay(new Date(cursor), monthIndex, todayKey))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return week
}

/** Um único dia (para a visão "Dia"). */
export function buildDay(anchorISO: string, nowISO: string): CalendarDay {
  const { year, monthIndex, day } = partsOf(anchorISO)
  return toDay(noonUTC(year, monthIndex, day), monthIndex, dayKey(nowISO))
}

/** Move o âncora por dias/semanas/meses (positivo = futuro). */
export function shiftAnchor(
  anchorISO: string,
  unit: "day" | "week" | "month",
  amount: number
): string {
  const d = new Date(anchorISO)
  if (unit === "day") d.setUTCDate(d.getUTCDate() + amount)
  if (unit === "week") d.setUTCDate(d.getUTCDate() + amount * 7)
  if (unit === "month") d.setUTCMonth(d.getUTCMonth() + amount)
  return d.toISOString()
}
