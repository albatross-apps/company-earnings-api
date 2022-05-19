import { getAllEarningReportsByDate } from './stocks'
import { config } from './config'
import {
  hasCache,
  getCachedEarnings,
  setCachedEarnings,
} from './data/dataCache'
import { getCompaniesPercentGrowthEveryQuarter } from './utils/process'
import { Earnings } from './types'
import { errorsCache, getDomesticCompanies } from './utils'
import Redis from 'ioredis'
require('dotenv').config()

const getEarnings = async (filePath: string) => {
  let earnings: Earnings[]
  if (config.useCache && hasCache(filePath)) {
    earnings = await getCachedEarnings(filePath)
  } else {
    earnings = (await getAllEarningReportsByDate(config.date)) as Earnings[]
    await setCachedEarnings(filePath, earnings)
  }
  return earnings
}

const main = async () => {
  const redis = new Redis(process.env.REDIS_URL)
  try {
    const filePath = `${config.filePath}/${config.date}.json`
    const earnings = await getEarnings(filePath)
    const domesticEarnings = getDomesticCompanies(earnings)
    const companiesPercentageGrowth =
      getCompaniesPercentGrowthEveryQuarter(domesticEarnings)

    await redis.set('data', JSON.stringify(companiesPercentageGrowth))
  } catch (e) {
    errorsCache.push(e)
  } finally {
    console.log('Errors: ', errorsCache?.length ? errorsCache : 'None')
    redis.quit()
  }
}

main()
