import {
  CalendarEarnings,
  Earnings,
  EarningsMetric,
  ReportResp,
  TickerInfo,
} from './types'
import fetch from 'node-fetch'
import { errorsCache, getChunks, mapTrim, timeout } from './utils'
import { config } from './config'
import cliProgress from 'cli-progress'
import fs from 'fs'
const fsPromise = fs.promises

/**
 * Sick
 */
export const getEarningsCalendar = async (
  date: string
): Promise<CalendarEarnings> => {
  const earningsResponse = await fetch(
    `https://api.nasdaq.com/api/calendar/earnings?date=${date}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36',
      },
    }
  )

  return earningsResponse.json()
}

/**
 * This is awesome
 */
export const getCompanyTickers = async (): Promise<{
  [key: string]: TickerInfo
}> => {
  const tickers = await fetch('https://www.sec.gov/files/company_tickers.json')
  return tickers.json()
}

export const getCompanyReport = async (cik: string) => {
  try {
    const report = await fetch(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik.padStart(
        10,
        '0'
      )}.json`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36',
        },
      }
    )

    return (await report.json()) as ReportResp
  } catch (e) {
    errorsCache.push(e)
    return undefined
  }
}

export const getEarnings = async (
  chunks: TickerInfo[][],
  wait: number = 1000,
  onChunkDone?: (i: number) => void
) => {
  let i = 0
  const reports = [] as Earnings[]

  for await (const chunk of chunks) {
    const chunkReports = await Promise.allSettled(
      chunk.map(async (x) => {
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

export const getEarningsObject = async () => {
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  try {
    const earnings = await getEarningsCalendar(config.date)
    const allTickers = Object.values(await getCompanyTickers())
    const tickers = mapTrim(earnings.data.rows, (earning) =>
      allTickers.find(
        (x) =>
          x.ticker === earning.symbol ||
          x.title.toLowerCase() === earning.name.trim().toLowerCase()
      )
    )
    const tickersToUse = [...tickers.slice(0)]
    const chunks = getChunks(
      tickersToUse,
      config.earningsChunkSize
    ) as TickerInfo[][]
    bar1.start(chunks.length, 0)
    const reports = await getEarnings(chunks, config.waitTime, (i) => {
      bar1.update(i)
    })
    return reports
  } catch (e) {
    errorsCache.push(e)
  } finally {
    bar1.stop()
  }
}

export const getCachedEarnings = async (fileName: string) => {
  const content = await fsPromise.readFile(fileName)
  return JSON.parse(content.toString())
}

export const setCachedEarnings = async (fileName: string, data: Earnings[]) => {
  await fsPromise.writeFile(fileName, JSON.stringify(data))
}

export const hasCache = (fileName: string) => fs.existsSync(fileName)
