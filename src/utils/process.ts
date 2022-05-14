import { config } from '../config/config'
import {
  EarningsMetric,
  TagsKey,
  TagsObject,
  Earnings,
  TagData,
} from '../types'
import {
  calculateGrowthPercentPerQuarter,
  mapTrim,
  normalize,
  sumFunc,
  sortReportsByEndDate,
  objArrToObj,
  getConfiguredTags,
  getReportsForSamePeriod,
  unique,
} from './utils'

export const normalizeValues = (earnings: EarningsMetric[]) => {
  return earnings.map((earning) => {
    const minMaxCache = new Map<TagsKey, [number, number]>()
    const values = Object.entries(earning.metrics).map(
      ([key, value]: [string, number]) => {
        const tagKey = key as TagsKey
        if (!minMaxCache.has(tagKey)) {
          const growths = mapTrim(earnings, (x) => x.metrics[tagKey])
          minMaxCache.set(tagKey, [Math.min(...growths), Math.max(...growths)])
        }
        const [min, max] = minMaxCache.get(tagKey)!

        const norm = normalize(value, min, max, -1, 1)
        return {
          key: key as keyof TagsObject,
          value: isNaN(norm) ? 0 : norm,
        }
      }
    )
    const normalized = {} as Record<keyof TagsObject, number>
    values.forEach((x) => {
      normalized[x.key] = x.value
    })

    return { ticker: earning.ticker, metrics: normalized } as EarningsMetric
  })
}

/**
 * Takes a list of earnings and gets the percent growth per quarter
 *
 * @param earnings
 * @returns the score for every companies
 */

export const getCompaniesPercentGrowthEveryQuarter = (earnings: Earnings[]) => {
  const allCompaniesPercentGrowth = earnings.map((earning) => {
    const configuredTags = getConfiguredTags<TagData>(earning.tags)
    const earningPercentGrowth = Object.entries(configuredTags).map(
      ([tag, data]: [string, TagData]) => {
        if (
          !data ||
          !Object.keys(data.units).find((currency) =>
            config.currencies.includes(currency)
          )
        ) {
          return {
            key: tag as keyof TagsObject,
            value: 0,
          }
        }
        const sortedReports = sortReportsByEndDate(data.units.USD)
        const samePeriodReports = unique(
          getReportsForSamePeriod(sortedReports),
          'end'
        )
        return calculateGrowthPercentPerQuarter(tag, samePeriodReports)
      }
    )
    const earningPercentGrowthMap = objArrToObj<string, number>(
      earningPercentGrowth
    )
    return {
      ticker: earning.ticker,
      metrics: earningPercentGrowthMap,
    } as EarningsMetric
  })
  return allCompaniesPercentGrowth as EarningsMetric[]
}

export const getScore = (metics: Record<TagsKey, number>) =>
  Object.entries(config.weights)
    .map(([key, weight]) => {
      return metics[key as TagsKey] ?? 0 * weight
    })
    .reduce(sumFunc)

export const getAllScores = (earnings: EarningsMetric[]) =>
  earnings.map(({ ticker, metrics }) => {
    const score = getScore(metrics)
    return { score, ticker }
  })
