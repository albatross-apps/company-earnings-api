import fs from 'fs'
import { join } from 'path'
import os from 'os'
import {
  Earnings,
  EarningsGrowths,
  Report,
  ReportResp,
  Tag,
  TagsObject,
  TickerInfo,
} from './utils/types'
import cliProgress from 'cli-progress'
import {
  getCompanyReport,
  getCompanyTickers,
  getEarningsCalendar,
} from './utils/dataFetch'
import { errorsCache } from './utils/utils'
import { config } from './utils/config'

const fsPromise = fs.promises

const parse = async (fileName: string) => {
  const contents = await fsPromise.readFile(fileName)

  return await JSON.parse(contents.toString())
}

const getTags = async (fileName: string) => {
  const data = (await parse(join(fileName))) as ReportResp

  return (data.facts?.['us-gaap'] as TagsObject) ?? undefined
}

const main = async () => {
  const base = join(os.homedir() + '/Downloads/companyfacts')
  const files = await fsPromise.readdir(base)
  const map: Record<string, any> = {}
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  bar1.start(files.length, 0)
  let i = 0
  for (const file of files) {
    const tags = await getTags(join(base, '/', file))
    if (tags) {
      map[file] = tags.Assets?.label
      bar1.update(i)
      i++
      break
    }
  }
  bar1.stop()
  console.log('Values: ', Object.keys(map).length)
}

const calcPercentGrowth = (prev: Report, curr: Report) => {
  if (!prev || !curr) {
    return 0
  }
  return ((curr.val - prev.val) / ((curr.val + prev.val) / 2)) * 100
}

const trimReports = (reports: Report[]) => {
  return unique(reports, 'filed').sort(
    (a, b) => new Date(a.filed).getTime() + new Date(b.filed).getTime()
  )
}

const unique = (reports: Report[], value: keyof Report) => [
  ...new Map(reports.map((item) => [item[value], item])).values(),
]

const getChunks = (a: unknown[], size: number) =>
  Array.from(new Array(Math.ceil(a.length / size)), (_, i) =>
    a.slice(i * size, i * size + size)
  )

const getGrowths = (earnings: Earnings[]) => {
  const growths = earnings.map((earning) => {
    const values = Object.entries(earning.tags)
      .filter(([_, value]: [string, Tag]) =>
        Object.keys(value.units).includes('USD')
      )
      .map(([key, value]: [string, Tag]) => {
        const trimmed = trimReports(value.units.USD)
        return {
          key: key as keyof TagsObject,
          value: calcPercentGrowth(trimmed[1], trimmed[0]),
        }
      })

    const newGrowths = {} as Record<keyof TagsObject, number>
    values.forEach((x) => {
      newGrowths[x.key] = x.value
    })
    return { ticker: earning.ticker, growths: newGrowths } as EarningsGrowths
  })
  return growths as EarningsGrowths[]
}

const timeout = (time: number) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, time)
  })

const apiMain = async () => {
  const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
  try {
    const earnings = await getEarningsCalendar('2022-05-10')
    const allTickers = Object.values(await getCompanyTickers())
    const tickers = earnings.data.rows
      .map((earning) =>
        allTickers.find(
          (x) =>
            x.ticker === earning.symbol ||
            x.title.toLowerCase() === earning.name.trim().toLowerCase()
        )
      )
      .filter((x) => x)

    let i = 0
    const reports = [] as Earnings[]
    const chunks = getChunks(
      tickers,
      config.earningsChunkSize
    ) as TickerInfo[][]
    bar1.start(chunks.length, 0)
    for await (const chunk of chunks) {
      const chunkReports = await Promise.allSettled(
        chunk.map(async (x) => {
          const ticker = x!.cik_str.toString()
          const tags = (await getCompanyReport(ticker))?.facts['us-gaap']
          return tags ? ({ tags: tags, ticker } as Earnings) : undefined
        })
      )
      chunkReports.forEach((report) => {
        if (report.status === 'fulfilled' && report.value) {
          reports.push(report.value)
        }
      })
      await timeout(1000)
      i++
      bar1.update(i)
    }
    bar1.stop()
    const growths = getGrowths(reports)
    console.log('')

    console.log('Growths Count', growths.length)
    console.log('First', growths[0])
  } catch (e) {
    bar1.stop()
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
