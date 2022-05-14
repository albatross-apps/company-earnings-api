import { config } from '../config'
import {
  Defined,
  Earnings,
  Report,
  TagData,
  TagsKey,
  TagsObject,
} from '../types'
//@ts-ignore
import CC from 'currency-converter-lt'
import { number, re } from 'mathjs'

export const errorsCache = [] as unknown[]

export const growthValues = [] as unknown[]

export const unique = (reports: Report[], value: keyof Report) => [
  ...new Map(reports.map((item) => [item[value], item])).values(),
]

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
  return reports
    .sort((a, b) => new Date(b.filed).getTime() - new Date(a.filed).getTime())
    .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
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
 * Filters out all of the tags that are not included in the configuration
 * file.
 *
 * @param companyTagsMap
 * @returns only configured tags
 */
export const getConfiguredTags = <T extends unknown>(
  companyTagsMap: Record<TagsKey, T>
) => {
  const configuredTags = {} as Record<TagsKey, T>
  Object.keys(config.weights).forEach((key) => {
    configuredTags[key as TagsKey] = companyTagsMap[key as TagsKey]
  })
  return configuredTags
}

export const getDomesticCompanies = (earning: Earnings[]) => {
  return earning.filter((earnings) => {
    return Object.values(earnings.tags).find((tagData: TagData) => {
      if (tagData.units.USD) {
        return !!tagData.units.USD.find((report) => {
          return report.form === '10-K' || report.form === '10-Q'
        })
      }
      return false
    })
  })
}

export const getReportsForSamePeriod = (reports: Report[]) => {
  const mostRecentReport = reports.shift() as Report
  if (mostRecentReport.filed !== config.date) return []
  const samePeriodReports: Report[] = [mostRecentReport]
  let year = mostRecentReport.fy
  reports.forEach((report) => {
    if (
      report.fp === mostRecentReport.fp &&
      report.form === mostRecentReport.form
    ) {
      samePeriodReports.push(report)
    }
  })
  return samePeriodReports
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

export const calculateGrowthPercentPerQuarter = (
  tag: string,
  reports: Report[]
) => {
  if (!reports.length)
    return {
      key: tag as keyof TagsObject,
      value: 0,
    }
  const { percent } = reports.reduce(
    (previousReport, currentReport) => {
      return {
        percent: previousReport.report
          ? calcPercentGrowth(previousReport.report, currentReport) +
            previousReport.percent
          : previousReport.percent,
        report: currentReport,
      }
    },
    { percent: 0, report: undefined as Report | undefined }
  )
  const averageScorePerQuarter = percent / reports.length

  return {
    key: tag as keyof TagsObject,
    value: averageScorePerQuarter,
  }
}

export const currencyFormatter = (currency: string = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  })
