import { getAllEarningReportsByDate } from './stocks'
import { config } from './config'
import {
  hasCache,
  getCachedEarnings,
  setCachedEarnings,
  setCache,
} from './data/dataCache'
import {
  getCompaniesPercentGrowthEveryQuarter,
  normalizeValues,
  getAllScores,
} from './utils/process'
import { Earnings } from './types'
import { objArrToObj, errorsCache, getDomesticCompanies } from './utils'
import Redis from 'ioredis'
require('dotenv').config()

const main = async () => {
  const redis = new Redis(process.env.REDIS_URL)
  try {
    const filePath = `${config.filePath}/${config.date}.json`
    let earnings: Earnings[]
    if (config.useCache && hasCache(filePath)) {
      earnings = await getCachedEarnings(filePath)
      console.log('Cache Loaded')
    } else {
      earnings = (await getAllEarningReportsByDate(config.date)) as Earnings[]
      console.log('Fetched')
      await setCachedEarnings(filePath, earnings)
      console.log('Saved To Cache')
    }
    const domesticEarnings = getDomesticCompanies(earnings)
    const companiesPercentageGrowth =
      getCompaniesPercentGrowthEveryQuarter(domesticEarnings)

    console.log('')
    //const normalizedScores = normalizeValues(companiesPercentageGrowth)
    // const scores = getAllScores(normalizedScores)
    //   .sort((a, b) => b.score - a.score)
    //   .map((x) => ({ ...x, score: x.score * 100 }))
    // const data = scores.map((x) => {
    //   const growthObj = companiesPercentageGrowth.find(
    //     (g) => g.ticker === x.ticker
    //   )?.metrics!
    //   const normalizedObj = normalizedScores.find((g) => g.ticker === x.ticker)
    //     ?.metrics!

    //   return {
    //     ticker: x.ticker,
    //     score: Number(x.score.toFixed(0)),
    //     growths: growthObj,
    //     normalized: normalizedObj,
    //   }
    // })

    await redis.set('data', JSON.stringify(companiesPercentageGrowth))

    console.log('Saved to Redis')
  } catch (e) {
    console.log('')
    console.log('Something went wrong')
    errorsCache.push(e)
  } finally {
    console.log('')
    console.log('Finished!')
    console.log('Errors:')
    console.log('')
    console.log(errorsCache?.length ? errorsCache : 'None')
    redis.quit()
  }
}

main()
