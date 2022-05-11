import fs from 'fs'
import { join } from 'path'
import os from 'os'
import {
  Report,
  ReportResp,
  Tag,
  TagGrowths,
  TagsObject,
  TickerInfo,
} from './utils/types'
import cliProgress from 'cli-progress'
import {
  getCompanyReport,
  getCompanyTickers,
  getEarningsCalendar,
} from './utils/dataFetch'

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
      console.log({ tags })

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
  console.log({ curr, prev })
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

function chunkMaxLength(arr: unknown[], chunkSize: number, maxLength: number) {
  return Array.from({ length: maxLength }, () => arr.splice(0, chunkSize))
}

const getGrowths = (fullReports: TagsObject[]) => {
  const growths = fullReports.map((tagObject) => {
    const values = Object.entries(tagObject)
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

    const newGrowths = {} as TagGrowths
    values.forEach((x) => {
      newGrowths[x.key] = x.value
    })
  })
}

const timeout = (time: number) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, time)
  })

const apiMain = async () => {
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
    const reports = [] as TagsObject[]
    const bar1 = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic
    )
    bar1.start(tickers.length, 0)
    const chunks = chunkMaxLength(tickers, 8, 8) as TickerInfo[][]
    for await (const chunk of chunks) {
      const chunkReports = await Promise.allSettled(
        chunk.map(
          async (x) =>
            (
              await getCompanyReport(x!.cik_str.toString())
            )?.facts['us-gaap']
        )
      )
      chunkReports.forEach((report) => {
        // @ts-ignore
        if (report.value as TagsObject) {
          // @ts-ignore
          console.log(report.value.Asset?.USD?.[0])
          // @ts-ignore
          reports.push(report.value)
        }
      })
      await timeout(1000)
      bar1.update(i)
      i++
    }
    bar1.stop()
    const growths = getGrowths(reports)
    console.log(growths)
  } catch (e) {
    console.log(e)
  }
}

apiMain()
