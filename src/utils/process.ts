import { config } from './config'
import { EarningsMetric, TagsKey, TagsObject, Earnings, Tag } from './types'
import {
  calcPercentGrowth,
  mapTrim,
  normalize,
  sumFunc,
  trimObject,
  trimReports,
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

export const getGrowths = (earnings: Earnings[]) => {
  const growths = earnings.map((earning) => {
    const growthValues = []
    const values = Object.entries(trimObject(earning.tags)).map(
      ([key, value]: [string, Tag]) => {
        if (!value || !Object.keys(value.units).includes('USD')) {
          //console.log('here', key)
          return {
            key: key as keyof TagsObject,
            value: 0,
          }
        }
        const trimmed = trimReports(value.units.USD)
        //console.log({ key, trimmed })

        const currYear = trimmed.findIndex((x) => x.filed === config.date)
        if (currYear === -1) {
          //console.log('no currYear')
          return {
            key: key as keyof TagsObject,
            value: 0,
          }
        }
        const prevYear = trimmed[currYear + config.quaters]
        if (!prevYear) {
          //console.log('no prevYear')
          return {
            key: key as keyof TagsObject,
            value: 0,
          }
        }

        growthValues.push({
          key,
          currfile: trimmed[currYear].end,
          currVal: trimmed[currYear].val,
          prevfile: prevYear.end,
          prevVal: prevYear.val,
        })
        return {
          key: key as keyof TagsObject,
          value: calcPercentGrowth(prevYear!, trimmed[currYear]),
        }
      }
    )

    if (growthValues.length) {
      console.log(earning.ticker)
      //@ts-ignore
      console.table(growthValues)
    }
    const newGrowths = {} as Record<keyof TagsObject, number>
    values.forEach((x) => {
      newGrowths[x.key] = x.value
    })
    return { ticker: earning.ticker, metrics: newGrowths } as EarningsMetric
  })
  return growths as EarningsMetric[]
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
