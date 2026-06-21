/**
 * Formatação de datas/horas em PT-BR com timezone FIXO.
 *
 * O timezone é fixado em America/Sao_Paulo de propósito: sem isso, o servidor
 * (Node) e o cliente (navegador) podem formatar o mesmo ISO com fusos diferentes
 * e causar hydration mismatch. Fixar garante render idêntico nos dois lados.
 */

const TZ = "America/Sao_Paulo"

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  year: "numeric",
})

const dayMonthFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
})

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
})

const weekdayFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  weekday: "short",
})

const weekdayLongFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  weekday: "long",
})

const monthYearFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  month: "long",
  year: "numeric",
})

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso))
}

export function formatDayMonth(iso: string): string {
  return dayMonthFmt.format(new Date(iso))
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return `${dayMonthFmt.format(new Date(iso))} · ${timeFmt.format(new Date(iso))}`
}

export function formatWeekday(iso: string): string {
  return weekdayFmt.format(new Date(iso)).replace(".", "")
}

export function formatWeekdayLong(iso: string): string {
  return weekdayLongFmt.format(new Date(iso))
}

export function formatMonthYear(iso: string): string {
  return monthYearFmt.format(new Date(iso))
}

/** Número do dia do mês (no TZ fixo). */
export function dayOfMonth(iso: string): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, day: "numeric" }).format(
      new Date(iso)
    )
  )
}

/** "YYYY-MM-DD" no TZ fixo — chave estável para agrupar por dia. */
export function dayKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
  return parts
}

/**
 * Offset fixo de São Paulo. O Brasil aboliu o horário de verão em 2019, então
 * UTC-03:00 vale o ano todo — conversão determinística sem depender de DST.
 */
const SP_OFFSET = "-03:00"

/** ISO → valor de `<input type="datetime-local">` (no TZ fixo). */
export function toDateTimeLocal(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00"
  const hour = get("hour") === "24" ? "00" : get("hour")
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`
}

/** Valor de `datetime-local` (interpretado no TZ fixo) → ISO. */
export function fromDateTimeLocal(value: string): string {
  return new Date(`${value}:00${SP_OFFSET}`).toISOString()
}

/** Rótulo relativo amigável ("Hoje", "Amanhã", "Ontem") ou data curta. */
export function relativeDayLabel(iso: string, nowISO: string): string {
  const target = dayKey(iso)
  const today = dayKey(nowISO)
  if (target === today) return "Hoje"

  const oneDay = 86_400_000
  const tomorrow = dayKey(
    new Date(new Date(nowISO).getTime() + oneDay).toISOString()
  )
  const yesterday = dayKey(
    new Date(new Date(nowISO).getTime() - oneDay).toISOString()
  )
  if (target === tomorrow) return "Amanhã"
  if (target === yesterday) return "Ontem"

  return formatDayMonth(iso)
}
