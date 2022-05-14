const weights = {
  //
  NetCashProvidedByUsedInOperatingActivities: 19,
  Revenues: 2,
  RevenueFromContractWithCustomerIncludingAssessedTax: 2,
  ProfitLoss: 8,
  // (Net Income)
  NetIncomeLoss: 8,
  StockholdersEquity: 5,
  CashAndCashEquivalentsAtCarryingValue: 2,
  Cash: 2,
  PaymentsToAcquireProductiveAssets: -10,
  PaymentsToAcquirePropertyPlantAndEquipment: -8,
  PaymentsToAcquireBusinessesNetOfCashAcquired: -3,
  NetCashProvidedByUsedInInvestingActivities: -7,
  NetCashProvidedByUsedInFinancingActivities: -5,
  InventoryNet: -12,
  // Income tax payable
  IncreaseDecreaseInIncomeTaxesPayableNetOfIncomeTaxesReceivable: -9,
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

export const config = {
  useCache: true,
  filePath: './cache',
  earningsChunkSize: 11,
  waitTime: 1000,
  date: '2022-05-12',
  weights,
  quaters: 1,
  currencies: ['USD'],
}
