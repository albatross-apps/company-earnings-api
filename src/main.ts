import { getAllEarningReportsByDate } from './stocks'
import { config } from './config'
import {
  hasCache,
  getCachedEarnings,
  setCachedEarnings,
} from './data/dataCache'
import {
  getCompaniesScoreEveryQuarter,
  normalizeValues,
  getAllScores,
} from './utils/process'
import { Earnings } from './types'
import { objArrToObj, errorsCache } from './utils'

const main = async () => {
  try {
    const filePath = `${config.filePath}/${config.date}.json`
    let reports: Earnings[]
    if (config.useCache && hasCache(filePath)) {
      reports = await getCachedEarnings(filePath)
      console.log('Cache Loaded')
    } else {
      reports = (await getAllEarningReportsByDate(config.date)) as Earnings[]
      console.log('Fetched')
      await setCachedEarnings(filePath, reports)
      console.log('Saved To Cache')
    }
    const companiesScores = getCompaniesScoreEveryQuarter(reports)
    console.log('')
    const normalizedScores = normalizeValues(companiesScores)
    const scores = getAllScores(normalizedScores)
      .sort((a, b) => b.score - a.score)
      .map((x) => ({ ...x, score: x.score * 100 }))
    const combined = {
      ...scores.map((x) => {
        const growthObj = companiesScores.find((g) => g.ticker === x.ticker)
          ?.metrics!

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

main()
