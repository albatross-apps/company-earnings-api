import { CalendarEarnings, Earnings, ReportResp, TickerInfo } from '../types'
import fetch from 'node-fetch'
import { errorsCache, getChunks, mapTrim, timeout } from '../utils/utils'

/**
 * By passing in a date this function will use the nasdaq API
 * to get all of the companies who are filing earnings on that date.
 *
 * @param earningsDate
 * @returns list of companies
 */

export const getEarningsCalendar = async (
  earningsDate: string
): Promise<CalendarEarnings> => {
  const earningsResponse = await fetch(
    `https://api.nasdaq.com/api/calendar/earnings?date=${earningsDate}`,
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
 * Uses the SEC EDGAR api to get a list of all company tickers with
 * their cik number.
 *
 * @returns a list of all company tickers w/ cik number
 */

export const getCompanyTickers = async (): Promise<{
  [key: string]: TickerInfo
}> => {
  const tickers = await fetch('https://www.sec.gov/files/company_tickers.json')
  return tickers.json()
}

/**
 * Gets a company's earnings report by cik number using the SEC EDGAR api.
 *
 * @param cik
 * @returns an earning report for a company
 */

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
