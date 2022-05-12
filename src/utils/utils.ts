import { config } from './config'
import { Defined, Report, TagsKey, TagsObject } from './types'
//@ts-ignore
import CC from 'currency-converter-lt'
import { number, re } from 'mathjs'

export const errorsCache = [] as unknown[]

export const growthValues = [] as unknown[]

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
  if (!prev.val || !curr.val) {
    return 0
  }
  return ((prev.val - curr.val) / prev.val) * 100
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

export const growthSecret = (key: string, reports: Report[]) => {
  //console.log({ key, trimmed })
  if (!reports.length)
    return {
      key: key as keyof TagsObject,
      value: 0,
    }
  const sum = reports.reduce(
    (prev, curr) => {
      if (prev.rep && calcPercentGrowth(prev.rep, curr) === Infinity)
        console.log({ p: prev.rep, c: curr })

      return {
        score: prev.rep
          ? calcPercentGrowth(prev.rep, curr) + prev.score
          : prev.score,
        rep: curr,
      }
    },
    { score: 0, rep: undefined as Report | undefined }
  )
  //console.log(sum.score)
  const avg = sum.score / reports.length

  return {
    key: key as keyof TagsObject,
    value: avg,
  }
}
