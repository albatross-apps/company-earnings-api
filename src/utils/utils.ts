import { config } from './config'
import { Defined, Report, TagsKey } from './types'
//@ts-ignore
import CC from 'currency-converter-lt'

export const errorsCache = [] as unknown[]

export const mapTrim = <T extends unknown, TR extends unknown>(
  arr: T[],
  func: (val: T) => TR
) => arr.map(func).filter((x) => x !== undefined) as Defined<TR>[]

export const normalize = (
  val: number,
  valMin: number,
  valMax: number,
  min: number,
  max: number
) => {
  return ((val - valMin) / (valMax - valMin)) * (max - min) + min
}

export const unique = (reports: Report[], value: keyof Report) => [
  ...new Map(reports.map((item) => [item[value], item])).values(),
]

export const getChunks = (a: unknown[], size: number) =>
  Array.from(new Array(Math.ceil(a.length / size)), (_, i) =>
    a.slice(i * size, i * size + size)
  )

export const trimReports = (reports: Report[]) => {
  return reports.sort(
    (a, b) => new Date(b.end).getTime() - new Date(a.end).getTime()
  )
}

export const timeout = (time: number) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, time)
  })

export const calcPercentGrowth = (prev: Report, curr: Report) => {
  if (!prev || !curr) {
    return 0
  }
  return ((curr.val - prev.val) / ((curr.val + prev.val) / 2)) * 100
}

export const trimObject = <T extends unknown>(obj: Record<TagsKey, T>) => {
  const trimmedObj = {} as Record<TagsKey, T>
  Object.keys(config.weights).forEach((key) => {
    trimmedObj[key as TagsKey] = obj[key as TagsKey]
  })
  return trimmedObj
}

export const sumFunc = <T extends number>(a: T, b: T) => a + b

export const objArrToObj = <T extends string, TV extends unknown>(
  arr: {
    key: T
    value: TV
  }[]
) => {
  const result = {} as Record<T, TV>
  arr.forEach((item) => {
    result[item.key] = item.value
  })
  return result
}

export const convertCurrencies = (currencies: { [key: string]: Report[] }) => {
  const newCurrencies = {} as Record<string, Report[]>
  Object.keys(currencies).forEach((key) => {
    const currencyConverter = new CC({ from: key, to: 'USD', amount: 100 })
    newCurrencies[key] = currencyConverter
  })

  return newCurrencies
}
