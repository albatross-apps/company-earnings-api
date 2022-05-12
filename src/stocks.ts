import fs from 'fs'
import { Earnings } from './utils/types'
import {
  getCachedEarnings,
  getEarningsObject,
  hasCache,
  setCachedEarnings,
} from './utils/dataFetch'
import { errorsCache, objArrToObj, trimObject } from './utils/utils'
import { config } from './utils/config'
import { getAllScores, getGrowths, normalizeValues } from './utils/process'

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
    //console.log(growths.map((g) => trimObject(g.metrics)))
    //console.log(scores)
    const combined = {
      ...scores.map((x) => {
        const growthObj = growths.find((g) => g.ticker === x.ticker)?.metrics!

        const growthShort = Object.entries(growthObj).map(([key, value]) => ({
          key: key.replace(/[a-z]/g, ''),
          value: Number(value.toFixed(0)),
        }))
        return {
          ticker: x.ticker,
          score: Number(x.score.toFixed(0)),
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
