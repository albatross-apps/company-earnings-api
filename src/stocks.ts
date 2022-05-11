import fs from 'fs'
import { join } from 'path'
import os from 'os'
import {
  Earnings,
  EarningsMetric,
  Report,
  ReportResp,
  Tag,
  TagsKey,
  TagsObject,
  TickerInfo,
} from './utils/types'
import cliProgress from 'cli-progress'
import {
  getCachedEarnings,
  getCompanyReport,
  getCompanyTickers,
  getEarnings,
  getEarningsCalendar,
  getEarningsObject,
  hasCache,
  setCachedEarnings,
} from './utils/dataFetch'
import {
  errorsCache,
  getChunks,
  mapTrim,
  normalize,
  objArrToObj,
  trimObject,
  trimReports,
} from './utils/utils'
import { config } from './utils/config'
import { getAllScores, getGrowths, normalizeValues } from './utils/process'
const fsPromise = fs.promises

const apiMain = async () => {
  try {
    let reports: Earnings[]
    if (config.useCache && hasCache(config.filePath)) {
      reports = await getCachedEarnings(config.filePath)
      console.log('Cache Loaded')
    } else {
      reports = (await getEarningsObject()) as Earnings[]
      console.log('Fetched')
      await setCachedEarnings(config.filePath, reports)
      console.log('Saved To Cache')
    }
    const growths = getGrowths(reports)
    console.log('')
    const normalized = normalizeValues(growths)
    const scores = getAllScores(normalized)
      .sort((a, b) => b.score - a.score)
      .map((x) => ({ ...x, score: x.score * 100 }))
    const combined = {
      ...scores.map((x) => {
        const growthObj = trimObject(
          growths.find((g) => g.ticker === x.ticker)?.metrics!
        )
        const growthShort = Object.entries(growthObj).map(([key, value]) => ({
          key: key.slice(0, 3),
          value: value.toFixed(2),
        }))
        return {
          ...x,
          ...objArrToObj(growthShort),
        }
      }),
    }
    console.log('')
    console.log('Scores')
    console.table(combined)
  } catch (e) {
    console.log('')
    console.log('Something went wrong')
    errorsCache.push(e)
  } finally {
    console.log('')
    console.log('Finished!')
    console.log('Errors:')
    console.log('')
    console.log(errorsCache ?? 'None')
  }
}

apiMain()
