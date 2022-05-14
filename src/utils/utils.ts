import { config } from '../config'
import { Defined, Report, TagsKey, TagsObject } from '../types'
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

export const getChunks = (a: unknown[], size: number) =>
  Array.from(new Array(Math.ceil(a.length / size)), (_, i) =>
    a.slice(i * size, i * size + size)
  )

export const sortReportsByEndDate = (reports: Report[]) => {
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

/**
 * Filters out all of the tags that are not weighted through the configuration
 * file.
 *
 * @param companyTagsMap
 * @returns all of the weighted tags
 */
export const getWeightedTags = <T extends unknown>(
  companyTagsMap: Record<TagsKey, T>
) => {
  const weightedTags = {} as Record<TagsKey, T>
  Object.keys(config.weights).forEach((key) => {
    weightedTags[key as TagsKey] = companyTagsMap[key as TagsKey]
  })
  return weightedTags
}

export const sumFunc = <T extends number>(a: T, b: T) => a + b

/**
 * Takes an array of maps and converts it into a single map.
 *
 * @param arr
 * @returns a map version of the array
 */

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

export const calculateGrowthScorePerQuarter = (
  tag: string,
  reports: Report[]
) => {
  if (!reports.length)
    return {
      key: tag as keyof TagsObject,
      value: 0,
    }
  const { score } = reports.reduce(
    (previousReport, currentReport) => {
      return {
        score: previousReport.report
          ? calcPercentGrowth(previousReport.report, currentReport) +
            previousReport.score
          : previousReport.score,
        report: currentReport,
      }
    },
    { score: 0, report: undefined as Report | undefined }
  )
  const averageScorePerQuarter = score / reports.length

  return {
    key: tag as keyof TagsObject,
    value: averageScorePerQuarter,
  }
}
