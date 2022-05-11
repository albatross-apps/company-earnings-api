const weights = {
  NetCashProvidedByUsedInOperatingActivities: 12,
  // (Net Income)
  Revenues: 2,
  ProfitLoss: 8,
  StockholdersEquity: 5,
  Cash: 2,
  PaymentsToAcquireProductiveAssets: -10,
  PaymentsToAcquirePropertyPlantAndEquipment: -8,
  PaymentsToAcquireBusinessesNetOfCashAcquired: -3,
  NetCashProvidedByUsedInInvestingActivities: -7,
  NetCashProvidedByUsedInFinancingActivities: -5,
  InventoryNet: -12,
  // AssetsCurrent: 3,
  // Liabilities: -1,
  // LiabilitiesCurrent: 0,
  //PaymentsOfDividendsCommonStock: 2,
  //Assets: 3,
}

export type Weights = typeof weights

export const config = {
  useCache: true,
  filePath: './cache.json',
  earningsChunkSize: 11,
  waitTime: 1000,
  weights,
}
