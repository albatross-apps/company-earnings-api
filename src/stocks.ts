import { Earnings, TickerInfo } from './utils/types'
import { errorsCache, getChunks, mapTrim, timeout } from './utils/utils'
import { config } from './utils/config'
import cliProgress from 'cli-progress'
import {
  getCompanyReport,
  getEarningsCalendar,
  getCompanyTickers,
} from './utils/dataFetch'

const getCompaniesEarningsByChunks = async (
  companyChunks: TickerInfo[][],
  wait: number = 1000,
  onChunkDone?: (i: number) => void
) => {
  let i = 0
  const reports = [] as Earnings[]

  for await (const companyChunk of companyChunks) {
    const chunkReports = await Promise.allSettled(
      companyChunk.map(async (x) => {
        const cik = x!.cik_str.toString()
        const ticker = x!.ticker
        const tags = (await getCompanyReport(cik))?.facts['us-gaap']
        return tags ? ({ tags: tags, ticker } as Earnings) : undefined
      })
    )
    chunkReports.forEach((report) => {
      if (report.status === 'fulfilled' && report.value) {
        reports.push(report.value)
      }
    })
    await timeout(wait)
    i++
    onChunkDone?.(i)
  }
  return reports
}

/**
 * Gets all companies earning reports released on the date provided.
 *
 * @param date earnings report date
 * @returns a list of company's earning reports
 */

export const getAllEarningReportsByDate = async (date: string) => {
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  try {
    const earnings = await getEarningsCalendar(date)
    const allTickers = Object.values(await getCompanyTickers())
    const earningsTickers = mapTrim(earnings.data.rows, (earning) =>
      allTickers.find(
        (x) =>
          x.ticker === earning.symbol ||
          x.title.toLowerCase() === earning.name.trim().toLowerCase()
      )
    )
    const tickersToUse = [...earningsTickers.slice(0)]
    const earningsChunks = getChunks(
      tickersToUse,
      config.earningsChunkSize
    ) as TickerInfo[][]
    bar1.start(earningsChunks.length, 0)
    const earningReports = await getCompaniesEarningsByChunks(
      earningsChunks,
      config.waitTime,
      (i) => {
        bar1.update(i)
      }
    )
    return earningReports
  } catch (e) {
    errorsCache.push(e)
  } finally {
    bar1.stop()
  }
}
