import { config } from 'mathjs'
import { Weights } from '../config/config'

export interface ReportResp {
  cik: number
  facts: {
    'us-gaap': TagsObject
  }
}

export type TagsObject = Record<keyof Weights, Tag>

export type TagsKey = Extract<keyof TagsObject, string>

export interface Earnings {
  ticker: string
  tags: TagsObject
}

export interface EarningsMetric {
  ticker: string
  metrics: Record<TagsKey, number>
}

export interface EarningsScore {
  ticker: string
  score: number
}

export interface TagData {
  label: string
  description: string
  units: {
    USD: Report[]
  }
}

export interface Report {
  val: number
  form: string
  fy: number
  fp: string

  end: string
  filed: string
  frame: string
}

export interface CompanyProfile {
  lastYearRptDt: string
  lastYearEPS: string
  time: string
  symbol: string
  name: string
  marketCap: string
  fiscalQuarterEnding: string
  epsForecast: string
  noOfEsts: string
}

export interface CalendarEarnings {
  data: {
    rows: CompanyProfile[]
  }
}

export interface TickerInfo {
  cik_str: number
  ticker: string
  title: string
}

export type Defined<T> = Exclude<T, undefined>
