import { CalendarEarnings, ReportResp, TickerInfo } from './types'
import fetch from 'node-fetch'
import { errorsCache } from './utils'

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
