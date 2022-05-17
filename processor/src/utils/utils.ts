import { config } from '../config'
import {
  Defined,
  Earnings,
  Report,
  ReportPretty,
  TagData,
  TagsKey,
  TagsObject,
} from '../types'
//@ts-ignore
import CC from 'currency-converter-lt'
import { number, re } from 'mathjs'

export const errorsCache = [] as unknown[]

export const growthValues = [] as unknown[]

export const toPercentFormat = (val: number) => {
  return `${val.toFixed(2)}%`
}

export const unique = <T extends unknown>(arr: T[], func: (v: T) => string) => {
  const result = new Map<string, T>()
  arr.forEach((x) => result.set(func(x), x))
  return [...result.values()]
}

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

export const sortReports = (reports: Report[], field1: keyof Report) => {
  return reports.sort(
    (a, b) => new Date(a[field1]).getTime() - new Date(b[field1]).getTime()
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
  return ((curr.val - prev.val) / Math.abs(prev.val)) * 100
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
    if (companyTagsMap[key as TagsKey])
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

/**
 * Provided a list of reports,
 *
 * @param reports list of all the reports for a tag.
 * @param period report quarter
 * @returns
 */

export const getReportsByPeriod = (
  reports: Report[],
  period?: 'Q1' | 'Q2' | 'Q3' | 'FY'
) => {
  const mostRecentReport = reports[reports.length - 1]
  if (!period && !mostRecentReport) return []
  const reportPeriod = period || mostRecentReport.fp
  const newReports = reports.filter(
    (report) =>
      report.fp === reportPeriod &&
      report.form === (period === 'FY' ? '10-K' : '10-Q')
  )
  return newReports
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
  const { percent, reportsData } = reports.reduce(
    (previous, currentReport) => {
      const percentGrowth = previous.previousReport
        ? calcPercentGrowth(previous.previousReport, currentReport)
        : undefined
      previous.reportsData.push({
        form: currentReport.form,
        fp: currentReport.fp,
        fy: currentReport.fy,
        start: currentReport.start,
        end: currentReport.end,
        val: currencyFormatter().format(currentReport.val),
        percentGrowthYoY: percentGrowth
          ? toPercentFormat(percentGrowth)
          : undefined,
      })
      return {
        percent: percentGrowth
          ? percentGrowth + previous.percent
          : previous.percent,
        previousReport: currentReport,
        reportsData: previous.reportsData,
      }
    },
    {
      percent: 0,
      previousReport: undefined as Report | undefined,
      reportsData: [] as ReportPretty[],
    }
  )
  const averageScorePerQuarter = percent / reports.length

  return {
    key: tag as keyof TagsObject,
    value: averageScorePerQuarter,
    reports: reportsData,
  }
}

export const currencyFormatter = (currency: string = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  })
