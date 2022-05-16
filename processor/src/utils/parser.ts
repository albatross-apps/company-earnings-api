import { Earnings, TagData, TagsObject } from '../types'

interface Data {
    tag: string 
    val: number
}

export const load = (earning: Earnings) => {
  const tags = {} as { [key: string]: TagData | undefined }

  // Assets
  tags['Assets'] = earning.tags['Assets'] || undefined

  // Current Assets
  tags['CurrentAssets'] = earning.tags['AssetsCurrent'] || undefined

  // Noncurrent Assets
  tags['NoncurrentAssets'] = earning.tags['AssetsNoncurrent']
  if (tags['NoncurrentAssets'] === null) {
    if (tags['Assets'] && tags['CurrentAssets']) {
      tags['NoncurrentAssets'] = tags['Assets'] - tags['CurrentAssets']
    } else {
      tags['NoncurrentAssets'] = undefined
    }
  }

  // LiabilitiesAndEquity
  tags['LiabilitiesAndEquity'] =
    earning.tags['LiabilitiesAndStockholdersEquity']
  if (tags['LiabilitiesAndEquity'] === null) {
    tags['LiabilitiesAndEquity'] = earning.tags['LiabilitiesAndPartnersCapital']
    if (tags['LiabilitiesAndEquity']) {
      tags['LiabilitiesAndEquity'] = undefined
    }
  }

  // Liabilities
  tags['Liabilities'] = earning.tags['Liabilities'] || undefined

  // CurrentLiabilities
  tags['CurrentLiabilities'] = earning.tags['LiabilitiesCurrent']

  // Noncurrent Liabilities
  tags['NoncurrentLiabilities'] = earning.tags['LiabilitiesNoncurrent']
  if (tags['NoncurrentLiabilities'] === null) {
    if (tags['Liabilities'] && tags['CurrentLiabilities']) {
      tags['NoncurrentLiabilities'] =
        tags['Liabilities'] - tags['CurrentLiabilities']
    } else {
      tags['NoncurrentLiabilities'] = undefined
    }
  }

  // CommitmentsAndContingencies
  tags['CommitmentsAndContingencies'] =
    earning.tags['CommitmentsAndContingencies'] || undefined

  // TemporaryEquity
  tags['TemporaryEquity'] =
    earning.tags['TemporaryEquityRedemptionValue'] ||
    earning.tags['RedeemablePreferredStockCarryingAmount'] ||
    earning.tags['TemporaryEquityCarryingAmount'] ||
    earning.tags['TemporaryEquityValueExcludingAdditionalPaidInCapital'] ||
    earning.tags['TemporaryEquityCarryingAmountAttributableToParent'] ||
    earning.tags['RedeemableNoncontrollingInterestEquityFairValue'] ||
    undefined

  // RedeemableNoncontrollingInterest (added to temporary equity)
  var redeemableNoncontrollingInterest =
    earning.tags['RedeemableNoncontrollingInterestEquityCarryingAmount'] ||
    earning.tags[
      'RedeemableNoncontrollingInterestEquityCommonCarryingAmount'
    ] ||
    undefined

  // This adds redeemable noncontrolling interest and temporary equity which are rare, but can be reported seperately
  if (tags['TemporaryEquity']) {
    tags['TemporaryEquity'] =
      Number(tags['TemporaryEquity']) + Number(redeemableNoncontrollingInterest)
  }

  // Equity
  tags['Equity'] =
    earning.tags[
      'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'
    ] ||
    earning.tags['StockholdersEquity'] ||
    earning.tags[
      'PartnersCapitalIncludingPortionAttributableToNoncontrollingInterest'
    ] ||
    earning.tags['PartnersCapital'] ||
    earning.tags['CommonStockholdersEquity'] ||
    earning.tags['MemberEquity'] ||
    earning.tags['AssetsNet'] ||
    undefined

  // EquityAttributableToNoncontrollingInterest
  tags['EquityAttributableToNoncontrollingInterest'] =
    earning.tags['MinorityInterest'] ||
    earning.tags['PartnersCapitalAttributableToNoncontrollingInterest'] ||
    undefined

  // EquityAttributableToParent
  tags['EquityAttributableToParent'] =
    earning.tags['StockholdersEquity'] ||
    earning.tags['LiabilitiesAndPartnersCapital'] ||
    undefined

  // BS Adjustments
  // If total assets is missing, try using current assets
  if (
    tags['Assets'] === undefined &&
    tags['Assets'] === tags['LiabilitiesAndEquity'] &&
    tags['CurrentAssets'] === tags['LiabilitiesAndEquity']
  ) {
    tags['Assets'] = tags['CurrentAssets']
  }

  // Added to fix Assets
  if (
    tags['Assets'] === undefined &&
    tags['LiabilitiesAndEquity'] !== undefined &&
    tags['CurrentAssets'] === tags['LiabilitiesAndEquity']
  ) {
    tags['Assets'] = tags['CurrentAssets']
  }

  // Added to fix Assets even more
  if (
    tags['Assets'] === undefined &&
    tags['NoncurrentAssets'] === undefined &&
    tags['LiabilitiesAndEquity'] !== undefined &&
    tags['LiabilitiesAndEquity'] === tags['Liabilities'] + tags['Equity']
  ) {
    tags['Assets'] = tags['CurrentAssets']
  }

  if (tags['Assets'] !== undefined && tags['CurrentAssets'] !== undefined) {
    tags['NoncurrentAssets'] = tags['Assets'] - tags['CurrentAssets']
  }

  if (
    tags['LiabilitiesAndEquity'] === undefined &&
    tags['Assets'] !== undefined
  ) {
    tags['LiabilitiesAndEquity'] = tags['Assets']
  }

  // Impute: Equity based no parent and noncontrolling interest being present
  if (
    tags['EquityAttributableToNoncontrollingInterest'] !== undefined &&
    tags['EquityAttributableToParent'] !== undefined
  ) {
    tags['Equity'] =
      tags['EquityAttributableToParent'] +
      tags['EquityAttributableToNoncontrollingInterest']
  }

  if (
    tags['Equity'] === undefined &&
    tags['EquityAttributableToNoncontrollingInterest'] === undefined &&
    tags['EquityAttributableToParent'] !== undefined
  ) {
    tags['Equity'] = tags['EquityAttributableToParent']
  }

  if (tags['Equity'] === undefined) {
    tags['Equity'] =
      tags['EquityAttributableToParent'] +
      tags['EquityAttributableToNoncontrollingInterest']
  }

  // Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
  if (
    tags['Equity'] !== undefined &&
    tags['EquityAttributableToNoncontrollingInterest'] !== undefined &&
    tags['EquityAttributableToParent'] === undefined
  ) {
    tags['EquityAttributableToParent'] =
      tags['Equity'] - tags['EquityAttributableToNoncontrollingInterest']
  }

  // Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
  if (
    tags['Equity'] !== undefined &&
    tags['EquityAttributableToNoncontrollingInterest'] === undefined &&
    tags['EquityAttributableToParent'] === undefined
  ) {
    tags['EquityAttributableToParent'] = tags['Equity']
  }

  // if total liabilities is missing, figure it out based on liabilities and equity
  if (tags['Liabilities'] === undefined && tags['Equity'] !== undefined) {
    tags['Liabilities'] =
      tags['LiabilitiesAndEquity'] -
      (tags['CommitmentsAndContingencies'] +
        tags['TemporaryEquity'] +
        tags['Equity'])
  }

  // This seems incorrect because liabilities might not be reported
  if (
    tags['Liabilities'] !== undefined &&
    tags['CurrentLiabilities'] !== undefined
  ) {
    tags['NoncurrentLiabilities'] =
      tags['Liabilities'] - tags['CurrentLiabilities']
  }

  // Added to fix liabilities based on current liabilities
  if (
    tags['Liabilities'] === undefined &&
    tags['CurrentLiabilities'] !== undefined &&
    tags['NoncurrentLiabilities'] === undefined
  ) {
    tags['Liabilities'] = tags['CurrentLiabilities']
  }

  if (
    tags['CurrentAssets'] === undefined &&
    tags['NoncurrentAssets'] === undefined &&
    tags['CurrentLiabilities'] === undefined &&
    tags['NoncurrentLiabilities'] === undefined
  ) {

  // Revenues
  tags['Revenues'] =
    earning.tags['Revenues'] ||
    earning.tags['SalesRevenueNet'] ||
    earning.tags['SalesRevenueServicesNet'] ||
    earning.tags['RevenuesNetOfInterestExpense'] ||
    earning.tags['RegulatedAndUnregulatedOperatingRevenue'] ||
    earning.tags['HealthCareOrganizationRevenue'] ||
    earning.tags['InterestAndDividendIncomeOperating'] ||
    earning.tags['RealEstateRevenueNet'] ||
    earning.tags['RevenueMineralSales'] ||
    earning.tags['OilAndGasRevenue'] ||
    earning.tags['FinancialServicesRevenue'] ||
    earning.tags['RegulatedAndUnregulatedOperatingRevenue'] ||
    0

  // CostOfRevenue
  tags['CostOfRevenue'] =
    earning.tags['CostOfRevenue'] ||
    earning.tags['CostOfServices'] ||
    earning.tags['CostOfGoodsSold'] ||
    earning.tags['CostOfGoodsAndServicesSold'] ||
    0

  // GrossProfit
  tags['GrossProfit'] =
    earning.tags['GrossProfit'] || earning.tags['GrossProfit'] || undefined

  // OperatingExpenses
  tags['OperatingExpenses'] =
    earning.tags['OperatingExpenses'] ||
    earning.tags['OperatingCostsAndExpenses'] ||
    0

  // CostsAndExpenses
  tags['CostsAndExpenses'] =
    earning.tags['CostsAndExpenses'] ||
    earning.tags['CostsAndExpenses'] ||
    undefined

  // OtherOperatingIncome
  tags['OtherOperatingIncome'] =
    earning.tags['OtherOperatingIncome'] ||
    earning.tags['OtherOperatingIncome'] ||
    undefined

  // OperatingIncomeLoss
  tags['OperatingIncomeLoss'] =
    earning.tags['OperatingIncomeLoss'] ||
    earning.tags['OperatingIncomeLoss'] ||
    undefined

  // NonoperatingIncomeLoss
  tags['NonoperatingIncomeLoss'] =
    earning.tags['NonoperatingIncomeExpense'] ||
    earning.tags['NonoperatingIncomeExpense'] ||
    undefined

  // InterestAndDebtExpense
  tags['InterestAndDebtExpense'] =
    earning.tags['InterestAndDebtExpense'] ||
    earning.tags['InterestAndDebtExpense'] ||
    undefined

  // IncomeBeforeEquityMethodInvestments
  tags['IncomeBeforeEquityMethodInvestments'] =
    earning.tags[
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'
    ] ||
    earning.tags[
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'
    ] ||
    undefined

  // IncomeFromEquityMethodInvestments
  tags['IncomeFromEquityMethodInvestments'] =
    earning.tags['IncomeLossFromEquityMethodInvestments'] ||
    earning.tags['IncomeLossFromEquityMethodInvestments'] ||
    undefined

  // IncomeFromContinuingOperationsBeforeTax
  tags['IncomeFromContinuingOperationsBeforeTax'] =
    earning.tags[
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'
    ] ||
    earning.tags[
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest'
    ] ||
    undefined

  // IncomeTaxExpenseBenefit
  tags['IncomeTaxExpenseBenefit'] =
    earning.tags['IncomeTaxExpenseBenefit'] ||
    earning.tags['IncomeTaxExpenseBenefitContinuingOperations'] ||
    undefined

  // IncomeFromContinuingOperationsAfterTax
  tags['IncomeFromContinuingOperationsAfterTax'] =
    earning.tags[
      'IncomeLossBeforeExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple'
    ] ||
    earning.tags[
      'IncomeLossBeforeExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple'
    ] ||
    undefined

  // IncomeFromDiscontinuedOperations
  tags['IncomeFromDiscontinuedOperations'] =
    earning.tags['IncomeLossFromDiscontinuedOperationsNetOfTax'] ||
    earning.tags[
      'DiscontinuedOperationGainLossOnDisposalOfDiscontinuedOperationNetOfTax'
    ] ||
    earning.tags[
      'IncomeLossFromDiscontinuedOperationsNetOfTaxAttributableToReportingEntity'
    ] ||
    undefined

  // ExtraordaryItemsGainLoss
  tags['ExtraordaryItemsGainLoss'] =
    earning.tags['ExtraordinaryItemNetOfTax'] ||
    earning.tags['ExtraordinaryItemNetOfTax'] ||
    undefined

  // NetIncomeLoss
  tags['NetIncomeLoss'] =
    earning.tags['ProfitLoss'] ||
    earning.tags['NetIncomeLoss'] ||
    earning.tags['NetIncomeLossAvailableToCommonStockholdersBasic'] ||
    earning.tags['IncomeLossFromContinuingOperations'] ||
    earning.tags['IncomeLossAttributableToParent'] ||
    earning.tags[
      'IncomeLossFromContinuingOperationsIncludingPortionAttributableToNoncontrollingInterest'
    ] ||
    undefined

  // NetIncomeAvailableToCommonStockholdersBasic
  tags['NetIncomeAvailableToCommonStockholdersBasic'] =
    earning.tags['NetIncomeLossAvailableToCommonStockholdersBasic'] || undefined

  // #PreferredStockDividendsAndOtherAdjustments
  tags['PreferredStockDividendsAndOtherAdjustments'] =
    earning.tags['PreferredStockDividendsAndOtherAdjustments'] || undefined

  // #NetIncomeAttributableToNoncontrollingInterest
  tags['NetIncomeAttributableToNoncontrollingInterest'] =
    earning.tags['NetIncomeLossAttributableToNoncontrollingInterest'] ||
    undefined

  // #NetIncomeAttributableToParent
  tags['NetIncomeAttributableToParent'] =
    earning.tags['NetIncomeLoss'] || undefined

  // OtherComprehensiveIncome
  tags['OtherComprehensiveIncome'] =
    earning.tags['OtherComprehensiveIncomeLossNetOfTax'] ||
    earning.tags['OtherComprehensiveIncomeLossNetOfTax'] ||
    0

  // ComprehensiveIncome
  tags['ComprehensiveIncome'] =
    earning.tags[
      'ComprehensiveIncomeNetOfTaxIncludingPortionAttributableToNoncontrollingInterest'
    ]
  earning.tags['ComprehensiveIncomeNetOfTax'] || undefined

  // ComprehensiveIncomeAttributableToParent
  tags['ComprehensiveIncomeAttributableToParent'] =
    earning.tags['ComprehensiveIncomeNetOfTax'] ||
    earning.tags['ComprehensiveIncomeNetOfTax'] ||
    undefined

  // ComprehensiveIncomeAttributableToNoncontrollingInterest
  tags['ComprehensiveIncomeAttributableToNoncontrollingInterest'] =
    earning.tags[
      'ComprehensiveIncomeNetOfTaxAttributableToNoncontrollingInterest'
    ] ||
    earning.tags[
      'ComprehensiveIncomeNetOfTaxAttributableToNoncontrollingInterest'
    ] ||
    undefined

  // 'Adjustments to income statement information
  // Impute: NonoperatingIncomeLossPlusInterestAndDebtExpense
  tags['NonoperatingIncomeLossPlusInterestAndDebtExpense'] =
    tags['NonoperatingIncomeLoss'] + tags['InterestAndDebtExpense']

  // Impute: Net income available to common stockholders  (if it does not exist)
  if (
    tags['NetIncomeAvailableToCommonStockholdersBasic'] === undefined &&
    tags['PreferredStockDividendsAndOtherAdjustments'] === undefined &&
    tags['NetIncomeAttributableToParent'] !== undefined
  ) {
    tags['NetIncomeAvailableToCommonStockholdersBasic'] =
      tags['NetIncomeAttributableToParent']
  }

  // Impute NetIncomeLoss
  if (
    tags['NetIncomeLoss'] !== undefined &&
    tags['IncomeFromContinuingOperationsAfterTax'] === undefined
  ) {
    tags['IncomeFromContinuingOperationsAfterTax'] =
      tags['NetIncomeLoss'] -
      tags['IncomeFromDiscontinuedOperations'] -
      tags['ExtraordaryItemsGainLoss']
  }

  // Impute: Net income attributable to parent if it does not exist
  if (
    tags['NetIncomeAttributableToParent'] === undefined &&
    tags['NetIncomeAttributableToNoncontrollingInterest'] === undefined &&
    tags['NetIncomeLoss'] !== undefined
  ) {
    tags['NetIncomeAttributableToParent'] = tags['NetIncomeLoss']
  }

  // Impute: PreferredStockDividendsAndOtherAdjustments
  if (
    tags['PreferredStockDividendsAndOtherAdjustments'] === undefined &&
    tags['NetIncomeAttributableToParent'] !== undefined &&
    tags['NetIncomeAvailableToCommonStockholdersBasic'] !== undefined
  ) {
    tags['PreferredStockDividendsAndOtherAdjustments'] =
      tags['NetIncomeAttributableToParent'] -
      tags['NetIncomeAvailableToCommonStockholdersBasic']
  }

  // Impute: comprehensive income
  if (
    tags['ComprehensiveIncomeAttributableToParent'] === undefined &&
    tags['ComprehensiveIncomeAttributableToNoncontrollingInterest'] ===
      undefined &&
    tags['ComprehensiveIncome'] === undefined &&
    tags['OtherComprehensiveIncome'] === undefined
  ) {
    tags['ComprehensiveIncome'] = tags['NetIncomeLoss']
  }

  // Impute: other comprehensive income
  if (
    tags['ComprehensiveIncome'] !== undefined &&
    tags['OtherComprehensiveIncome'] === undefined
  ) {
    tags['OtherComprehensiveIncome'] =
      tags['ComprehensiveIncome'] - tags['NetIncomeLoss']
  }

  // Impute: comprehensive income attributable to parent if it does not exist
  if (
    tags['ComprehensiveIncomeAttributableToParent'] === undefined &&
    tags['ComprehensiveIncomeAttributableToNoncontrollingInterest'] ===
      undefined &&
    tags['ComprehensiveIncome'] !== undefined
  ) {
    tags['ComprehensiveIncomeAttributableToParent'] =
      tags['ComprehensiveIncome']
  }

  // Impute: IncomeFromContinuingOperations*Before*Tax
  if (
    tags['IncomeBeforeEquityMethodInvestments'] !== undefined &&
    tags['IncomeFromEquityMethodInvestments'] !== undefined &&
    tags['IncomeFromContinuingOperationsBeforeTax'] === undefined
  ) {
    tags['IncomeFromContinuingOperationsBeforeTax'] =
      tags['IncomeBeforeEquityMethodInvestments'] +
      tags['IncomeFromEquityMethodInvestments']
  }

  // Impute: IncomeFromContinuingOperations*Before*Tax2 (if income before tax is missing)
  if (
    tags['IncomeFromContinuingOperationsBeforeTax'] === undefined &&
    tags['IncomeFromContinuingOperationsAfterTax'] !== undefined
  ) {
    tags['IncomeFromContinuingOperationsBeforeTax'] =
      tags['IncomeFromContinuingOperationsAfterTax'] +
      tags['IncomeTaxExpenseBenefit']
  }

  // Impute: IncomeFromContinuingOperations*After*Tax
  if (
    tags['IncomeFromContinuingOperationsAfterTax'] === undefined &&
    (tags['IncomeTaxExpenseBenefit'] !== undefined ||
      tags['IncomeTaxExpenseBenefit'] === undefined) &&
    tags['IncomeFromContinuingOperationsBeforeTax'] !== undefined
  ) {
    tags['IncomeFromContinuingOperationsAfterTax'] =
      tags['IncomeFromContinuingOperationsBeforeTax'] -
      tags['IncomeTaxExpenseBenefit']
  }

  // Impute: GrossProfit
  if (
    tags['GrossProfit'] === undefined &&
    tags['Revenues'] !== undefined &&
    tags['CostOfRevenue'] !== undefined
  ) {
    tags['GrossProfit'] = tags['Revenues'] - tags['CostOfRevenue']
  }

  // Impute: GrossProfit
  if (
    tags['GrossProfit'] === undefined &&
    tags['Revenues'] !== undefined &&
    tags['CostOfRevenue'] !== undefined
  ) {
    tags['GrossProfit'] = tags['Revenues'] - tags['CostOfRevenue']
  }

  // Impute: Revenues
  if (
    tags['GrossProfit'] !== undefined &&
    tags['Revenues'] === undefined &&
    tags['CostOfRevenue'] !== undefined
  ) {
    tags['Revenues'] = tags['GrossProfit'] + tags['CostOfRevenue']
  }

  // Impute: CostOfRevenue
  if (
    tags['GrossProfit'] !== undefined &&
    tags['Revenues'] !== undefined &&
    tags['CostOfRevenue'] === undefined
  ) {
    tags['CostOfRevenue'] = tags['Revenues'] - tags['GrossProfit']
  }

  // Impute: CostsAndExpenses (would NEVER have costs and expenses if has gross profit, gross profit is multi-step and costs and expenses is single-step)
  if (
    tags['GrossProfit'] === undefined &&
    tags['CostsAndExpenses'] === undefined &&
    tags['CostOfRevenue'] !== undefined &&
    tags['OperatingExpenses'] !== undefined
  ) {
    tags['CostsAndExpenses'] = tags['CostOfRevenue'] + tags['OperatingExpenses']
  }

  // Impute: CostsAndExpenses based on existance of both costs of revenues and operating expenses
  if (
    tags['CostsAndExpenses'] === undefined &&
    tags['OperatingExpenses'] !== undefined &&
    tags['CostOfRevenue'] !== undefined
  ) {
    tags['CostsAndExpenses'] = tags['CostOfRevenue'] + tags['OperatingExpenses']
  }

  // Impute: CostsAndExpenses
  if (
    tags['GrossProfit'] === undefined &&
    tags['CostsAndExpenses'] === undefined &&
    tags['Revenues'] !== undefined &&
    tags['OperatingIncomeLoss'] !== undefined &&
    tags['OtherOperatingIncome'] !== undefined
  ) {
    tags['CostsAndExpenses'] =
      tags['Revenues'] -
      tags['OperatingIncomeLoss'] -
      tags['OtherOperatingIncome']
  }

  // Impute: OperatingExpenses based on existance of costs and expenses and cost of revenues
  if (
    tags['CostOfRevenue'] !== undefined &&
    tags['CostsAndExpenses'] !== undefined &&
    tags['OperatingExpenses'] === undefined
  ) {
    tags['OperatingExpenses'] = tags['CostsAndExpenses'] - tags['CostOfRevenue']
  }

  // Impute: CostOfRevenues single-step method
  if (
    tags['Revenues'] !== undefined &&
    tags['GrossProfit'] === undefined &&
    tags['Revenues'] - tags['CostsAndExpenses'] ==
      tags['OperatingIncomeLoss'] &&
    tags['OperatingExpenses'] === undefined &&
    tags['OtherOperatingIncome'] === undefined
  ) {
    tags['CostOfRevenue'] = tags['CostsAndExpenses'] - tags['OperatingExpenses']
  }

  // Impute: IncomeBeforeEquityMethodInvestments
  if (
    tags['IncomeBeforeEquityMethodInvestments'] === undefined &&
    tags['IncomeFromContinuingOperationsBeforeTax'] !== undefined
  ) {
    tags['IncomeBeforeEquityMethodInvestments'] =
      tags['IncomeFromContinuingOperationsBeforeTax'] -
      tags['IncomeFromEquityMethodInvestments']
  }

  // Impute: IncomeBeforeEquityMethodInvestments
  if (
    tags['OperatingIncomeLoss'] !== undefined &&
    tags['NonoperatingIncomeLoss'] !== undefined &&
    tags['InterestAndDebtExpense'] == undefined &&
    tags['IncomeBeforeEquityMethodInvestments'] !== undefined
  ) {
    tags['InterestAndDebtExpense'] =
      tags['IncomeBeforeEquityMethodInvestments'] -
      (tags['OperatingIncomeLoss'] + tags['NonoperatingIncomeLoss'])
  }

  // Impute: OtherOperatingIncome
  if (
    tags['GrossProfit'] !== undefined &&
    tags['OperatingExpenses'] !== undefined &&
    tags['OperatingIncomeLoss'] !== undefined
  ) {
    tags['OtherOperatingIncome'] =
      tags['OperatingIncomeLoss'] -
      (tags['GrossProfit'] - tags['OperatingExpenses'])
  }

  // Move IncomeFromEquityMethodInvestments
  if (
    tags['IncomeFromEquityMethodInvestments'] !== undefined &&
    tags['IncomeBeforeEquityMethodInvestments'] !== undefined &&
    tags['IncomeBeforeEquityMethodInvestments'] !==
      tags['IncomeFromContinuingOperationsBeforeTax']
  ) {
    tags['IncomeBeforeEquityMethodInvestments'] =
      tags['IncomeFromContinuingOperationsBeforeTax'] -
      tags['IncomeFromEquityMethodInvestments']
    tags['OperatingIncomeLoss'] =
      tags['OperatingIncomeLoss'] - tags['IncomeFromEquityMethodInvestments']
  }

  // DANGEROUS!!  May need to turn off. IS3 had 2085 PASSES WITHOUT this imputing. if it is higher,: keep the test
  // Impute: OperatingIncomeLoss
  if (
    tags['OperatingIncomeLoss'] === undefined &&
    tags['IncomeBeforeEquityMethodInvestments'] !== undefined
  ) {
    tags['OperatingIncomeLoss'] =
      tags['IncomeBeforeEquityMethodInvestments'] +
      tags['NonoperatingIncomeLoss'] -
      tags['InterestAndDebtExpense']
  }

  tags[
    'NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'
  ] =
    tags['IncomeFromContinuingOperationsBeforeTax'] -
    tags['OperatingIncomeLoss']

  // NonoperatingIncomeLossPlusInterestAndDebtExpense
  if (
    tags['NonoperatingIncomeLossPlusInterestAndDebtExpense'] === undefined &&
    tags[
      'NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'
    ] !== undefined
  ) {
    tags['NonoperatingIncomeLossPlusInterestAndDebtExpense'] =
      tags[
        'NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'
      ] - tags['IncomeFromEquityMethodInvestments']
  }

  // Cash flow statement

  // NetCashFlow
  tags['NetCashFlow'] =
    earning.tags['CashAndCashEquivalentsPeriodIncreaseDecrease']
  earning.tags['CashPeriodIncreaseDecrease'] ||
    earning.tags['NetCashProvidedByUsedInContinuingOperations'] ||
    0

  // NetCashFlowsOperating
  tags['NetCashFlowsOperating'] =
    earning.tags['NetCashProvidedByUsedInOperatingActivities'] || undefined

  // NetCashFlowsInvesting
  tags['NetCashFlowsInvesting'] =
    earning.tags['NetCashProvidedByUsedInInvestingActivities'] || undefined

  // NetCashFlowsFinancing
  tags['NetCashFlowsFinancing'] =
    earning.tags['NetCashProvidedByUsedInFinancingActivities'] || undefined

  // NetCashFlowsOperatingContinuing
  tags['NetCashFlowsOperatingContinuing'] =
    earning.tags[
      'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'
    ] || undefined

  // NetCashFlowsInvestingContinuing
  tags['NetCashFlowsInvestingContinuing'] =
    earning.tags[
      'NetCashProvidedByUsedInInvestingActivitiesContinuingOperations'
    ] || undefined
  // NetCashFlowsFinancingContinuing
  tags['NetCashFlowsFinancingContinuing'] =
    earning.tags[
      'NetCashProvidedByUsedInFinancingActivitiesContinuingOperations'
    ] || undefined

  // NetCashFlowsOperatingDiscontinued
  tags['NetCashFlowsOperatingDiscontinued'] =
    earning.tags[
      'CashProvidedByUsedInOperatingActivitiesDiscontinuedOperations'
    ] || undefined

  // NetCashFlowsInvestingDiscontinued
  tags['NetCashFlowsInvestingDiscontinued'] =
    earning.tags[
      'CashProvidedByUsedInInvestingActivitiesDiscontinuedOperations'
    ] || undefined

  // NetCashFlowsFinancingDiscontinued
  tags['NetCashFlowsFinancingDiscontinued'] =
    earning.tags[
      'CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations'
    ] || undefined

  // NetCashFlowsDiscontinued
  tags['NetCashFlowsDiscontinued'] =
    earning.tags['NetCashProvidedByUsedInDiscontinuedOperations'] || undefined

  // ExchangeGainsLosses
  tags['ExchangeGainsLosses'] =
    earning.tags['EffectOfExchangeRateOnCashAndCashEquivalents'] ||
    earning.tags[
      'EffectOfExchangeRateOnCashAndCashEquivalentsContinuingOperations'
    ] ||
    earning.tags[
      'CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations'
    ] ||
    0

  // Adjustments
  // Impute: total net cash flows discontinued if not reported
  if (tags['NetCashFlowsDiscontinued'] === undefined) {
    tags['NetCashFlowsDiscontinued'] =
      tags['NetCashFlowsOperatingDiscontinued'] +
      tags['NetCashFlowsInvestingDiscontinued'] +
      tags['NetCashFlowsFinancingDiscontinued']
  }

  // Impute: cash flows from continuing
  if (
    tags['NetCashFlowsOperating'] !== undefined &&
    tags['NetCashFlowsOperatingContinuing'] === undefined
  ) {
    tags['NetCashFlowsOperatingContinuing'] =
      tags['NetCashFlowsOperating'] - tags['NetCashFlowsOperatingDiscontinued']
  }

  if (
    tags['NetCashFlowsInvesting'] !== undefined &&
    tags['NetCashFlowsInvestingContinuing'] === undefined
  ) {
    tags['NetCashFlowsInvestingContinuing'] =
      tags['NetCashFlowsInvesting'] - tags['NetCashFlowsInvestingDiscontinued']
  }

  if (
    tags['NetCashFlowsFinancing'] !== undefined &&
    tags['NetCashFlowsFinancingContinuing'] === undefined
  ) {
    tags['NetCashFlowsFinancingContinuing'] =
      tags['NetCashFlowsFinancing'] - tags['NetCashFlowsFinancingDiscontinued']
  }

  if (
    tags['NetCashFlowsOperating'] === undefined &&
    tags['NetCashFlowsOperatingContinuing'] !== undefined &&
    tags['NetCashFlowsOperatingDiscontinued'] === undefined
  ) {
    tags['NetCashFlowsOperating'] = tags['NetCashFlowsOperatingContinuing']
  }

  if (
    tags['NetCashFlowsInvesting'] === undefined &&
    tags['NetCashFlowsInvestingContinuing'] !== undefined &&
    tags['NetCashFlowsInvestingDiscontinued'] === undefined
  ) {
    tags['NetCashFlowsInvesting'] = tags['NetCashFlowsInvestingContinuing']
  }

  if (
    tags['NetCashFlowsFinancing'] === undefined &&
    tags['NetCashFlowsFinancingContinuing'] !== undefined &&
    tags['NetCashFlowsFinancingDiscontinued'] === undefined
  ) {
    tags['NetCashFlowsFinancing'] = tags['NetCashFlowsFinancingContinuing']
  }

  tags['NetCashFlowsContinuing'] =
    tags['NetCashFlowsOperatingContinuing'] +
    tags['NetCashFlowsInvestingContinuing'] +
    tags['NetCashFlowsFinancingContinuing']

  // Impute: if net cash flow is missing,: this tries to figure out the value by adding up the detail
  if (
    tags['NetCashFlow'] === undefined &&
    (tags['NetCashFlowsOperating'] !== undefined ||
      tags['NetCashFlowsInvesting'] !== undefined ||
      tags['NetCashFlowsFinancing'] !== undefined)
  ) {
    tags['NetCashFlow'] =
      tags['NetCashFlowsOperating'] +
      tags['NetCashFlowsInvesting'] +
      tags['NetCashFlowsFinancing']
  }

  // Key ratios
  tags['SGR'] =
    ((tags['NetIncomeLoss'] / tags['Revenues']) *
      (1 + (tags['Assets'] - tags['Equity']) / tags['Equity'])) /
      (1 / (tags['Revenues'] / tags['Assets']) -
        (tags['NetIncomeLoss'] / tags['Revenues']) *
          (1 + (tags['Assets'] - tags['Equity']) / tags['Equity'])) || null

  tags['ROA'] = tags['NetIncomeLoss'] / tags['Assets']

  tags['ROE'] = tags['NetIncomeLoss'] / tags['Equity']

  tags['ROS'] = tags['NetIncomeLoss'] / tags['Revenues']
}
