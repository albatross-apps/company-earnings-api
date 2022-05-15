const weights = {
  //
  NetCashProvidedByUsedInOperatingActivities: 19,
  // Revenue
  Revenues: 2,
  RevenueFromContractWithCustomerExcludingAssessedTax: 2,
  RevenueFromContractWithCustomerIncludingAssessedTax: 2,
  // (Net Income)
  ProfitLoss: 8,
  NetIncomeLoss: 8,
  //
  StockholdersEquity: 5,
  CashAndCashEquivalentsAtCarryingValue: 2,
  Cash: 2,
  PaymentsToAcquireProductiveAssets: -10,
  PaymentsToAcquirePropertyPlantAndEquipment: -8,
  PaymentsToAcquireBusinessesNetOfCashAcquired: -3,
  // NetCashProvidedByUsedInInvestingActivities: -7,
  // NetCashProvidedByUsedInFinancingActivities: -5,
  InventoryNet: -12,
  // Income tax payable
  IncreaseDecreaseInIncomeTaxesPayableNetOfIncomeTaxesReceivable: -9,
  // Deferred Income tax
  DeferredIncomeTaxExpenseBenefit: -6,
  // Share based compensation
  ShareBasedCompensation: -3,
  // Impairment of Long-Lived Assets to be Disposed of
  ImpairmentOfLongLivedAssetsToBeDisposedOf: 4,
  // AssetsCurrent: 3,
  // Liabilities: -1,
  // LiabilitiesCurrent: 0,
  //PaymentsOfDividendsCommonStock: 2,
  //Assets: 3,
}

export type Weights = typeof weights

export interface ReportResp {
  cik: number
  facts: {
    'us-gaap': TagsObject
  }
}

export type TagsObject = Record<keyof Weights, TagData>

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
    CNY: Report[]
  }
}

export interface Report {
  val: number
  form: string
  fy: number
  fp: string
  start: string
  end: string
  filed: string
  frame: string
}

export interface ReportPretty {
  val: string
  form: string
  fy: number
  fp: string
  start: string
  end: string
  percentGrowthYoY: string | undefined
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

export interface ScoresData {
  ticker: string
  score: number
  growths: Record<TagsKey, number>
  normalized: Record<TagsKey, number>
}
