export interface ReportResp {
  cik: number
  facts: {
    'us-gaap': TagsObject
  }
}

export interface TagsObject {
  AssetsCurrent: Tag
  Assets: Tag
  Cash: Tag
  Liabilities: Tag
  LiabilitiesCurrent: Tag
  NetCashProvidedByUsedInFinancingActivities: Tag
  NetCashProvidedByUsedInInvestingActivities: Tag
  NetCashProvidedByUsedInOperatingActivities: Tag
  NetIncomeLoss: Tag
  ProfitLoss: Tag
  CostOfRevenue: Tag
  RevenueFromContractWithCustomerExcludingAssessedTax: Tag

  //.....
}

export interface Earnings {
  ticker: string
  tags: TagsObject
}

export interface EarningsGrowths {
  ticker: string
  growths: Record<keyof TagsObject, number>
}

export interface Tag {
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
