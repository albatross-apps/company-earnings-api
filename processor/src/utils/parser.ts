import { Earnings, TagData, TagsObject } from '../types'

export const load = (earning: Earnings) => {
  const tags = {} as { [key: string]: TagData }

  // Assets
  tags['Assets'] = earning.tags['Assets'] || 0

  // Current Assets
  tags['CurrentAssets'] = earning.tags['AssetsCurrent'] || 0

  // Noncurrent Assets
  tags['NoncurrentAssets'] = earning.tags['AssetsNoncurrent']
  if (tags['NoncurrentAssets'] === null) {
    if (tags['Assets'] && tags['CurrentAssets']) {
      tags['NoncurrentAssets'] = tags['Assets'] - tags['CurrentAssets']
    } else {
      tags['NoncurrentAssets'] = 0
    }
  }

  // LiabilitiesAndEquity
  tags['LiabilitiesAndEquity'] =
    earning.tags['LiabilitiesAndStockholdersEquity']
  if (tags['LiabilitiesAndEquity'] === null) {
    tags['LiabilitiesAndEquity'] = earning.tags['LiabilitiesAndPartnersCapital']
    if (tags['LiabilitiesAndEquity']) {
      tags['LiabilitiesAndEquity'] = 0
    }
  }

  // Liabilities
  tags['Liabilities'] = earning.tags['Liabilities'] || 0

  // CurrentLiabilities
  tags['CurrentLiabilities'] = earning.tags['LiabilitiesCurrent']

  // Noncurrent Liabilities
  tags['NoncurrentLiabilities'] = earning.tags['LiabilitiesNoncurrent']
  if (tags['NoncurrentLiabilities'] === null) {
    if (tags['Liabilities'] && tags['CurrentLiabilities']) {
      tags['NoncurrentLiabilities'] =
        tags['Liabilities'] - tags['CurrentLiabilities']
    } else {
      tags['NoncurrentLiabilities'] = 0
    }
  }

  // CommitmentsAndContingencies
  tags['CommitmentsAndContingencies'] =
    earning.tags['CommitmentsAndContingencies'] || 0

  // TemporaryEquity
  tags['TemporaryEquity'] =
    earning.tags['TemporaryEquityRedemptionValue'] ||
    earning.tags['RedeemablePreferredStockCarryingAmount'] ||
    earning.tags['TemporaryEquityCarryingAmount'] ||
    earning.tags['TemporaryEquityValueExcludingAdditionalPaidInCapital'] ||
    earning.tags['TemporaryEquityCarryingAmountAttributableToParent'] ||
    earning.tags['RedeemableNoncontrollingInterestEquityFairValue'] ||
    0

  // RedeemableNoncontrollingInterest (added to temporary equity)
  var redeemableNoncontrollingInterest =
    earning.tags['RedeemableNoncontrollingInterestEquityCarryingAmount'] ||
    earning.tags[
      'RedeemableNoncontrollingInterestEquityCommonCarryingAmount'
    ] ||
    0

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
    0

  // EquityAttributableToNoncontrollingInterest
  tags['EquityAttributableToNoncontrollingInterest'] =
    earning.tags['MinorityInterest'] ||
    earning.tags['PartnersCapitalAttributableToNoncontrollingInterest'] ||
    0

  // EquityAttributableToParent
  tags['EquityAttributableToParent'] =
    earning.tags['StockholdersEquity'] ||
    earning.tags['LiabilitiesAndPartnersCapital'] ||
    0

  // BS Adjustments
  // If total assets is missing, try using current assets
  if (
    tags['Assets'] === 0 &&
    tags['Assets'] === tags['LiabilitiesAndEquity'] &&
    tags['CurrentAssets'] === tags['LiabilitiesAndEquity']
  ) {
    tags['Assets'] = tags['CurrentAssets']
  }

  // Added to fix Assets
  if (
    tags['Assets'] === 0 &&
    tags['LiabilitiesAndEquity'] !== 0 &&
    tags['CurrentAssets'] === tags['LiabilitiesAndEquity']
  ) {
    tags['Assets'] = tags['CurrentAssets']
  }

  // Added to fix Assets even more
  if (
    tags['Assets'] === 0 &&
    tags['NoncurrentAssets'] === 0 &&
    tags['LiabilitiesAndEquity'] !== 0 &&
    tags['LiabilitiesAndEquity'] === tags['Liabilities'] + tags['Equity']
  ) {
    tags['Assets'] = tags['CurrentAssets']
  }

  if (tags['Assets'] !== 0 && tags['CurrentAssets'] !== 0) {
    tags['NoncurrentAssets'] = tags['Assets'] - tags['CurrentAssets']
  }

  if (tags['LiabilitiesAndEquity'] === 0 && tags['Assets'] !== 0) {
    tags['LiabilitiesAndEquity'] = tags['Assets']
  }

  // Impute: Equity based no parent and noncontrolling interest being present
  if (
    tags['EquityAttributableToNoncontrollingInterest'] !== 0 &&
    tags['EquityAttributableToParent'] !== 0
  ) {
    tags['Equity'] =
      tags['EquityAttributableToParent'] +
      tags['EquityAttributableToNoncontrollingInterest']
  }

  if (
    tags['Equity'] === 0 &&
    tags['EquityAttributableToNoncontrollingInterest'] === 0 &&
    tags['EquityAttributableToParent'] !== 0
  ) {
    tags['Equity'] = tags['EquityAttributableToParent']
  }

  if (tags['Equity'] === 0) {
    tags['Equity'] =
      tags['EquityAttributableToParent'] +
      tags['EquityAttributableToNoncontrollingInterest']
  }

  // Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
  if (
    tags['Equity'] !== 0 &&
    tags['EquityAttributableToNoncontrollingInterest'] !== 0 &&
    tags['EquityAttributableToParent'] === 0
  ) {
    tags['EquityAttributableToParent'] =
      tags['Equity'] - tags['EquityAttributableToNoncontrollingInterest']
  }

  // Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
  if (
    tags['Equity'] !== 0 &&
    tags['EquityAttributableToNoncontrollingInterest'] === 0 &&
    tags['EquityAttributableToParent'] === 0
  ) {
    tags['EquityAttributableToParent'] = tags['Equity']
  }

  // if total liabilities is missing, figure it out based on liabilities and equity
  if (tags['Liabilities'] === 0 && tags['Equity'] !== 0) {
    tags['Liabilities'] =
      tags['LiabilitiesAndEquity'] -
      (tags['CommitmentsAndContingencies'] +
        tags['TemporaryEquity'] +
        tags['Equity'])
  }

  // This seems incorrect because liabilities might not be reported
  if (tags['Liabilities'] !== 0 && tags['CurrentLiabilities'] !== 0) {
    tags['NoncurrentLiabilities'] =
      tags['Liabilities'] - tags['CurrentLiabilities']
  }

  // Added to fix liabilities based on current liabilities
  if (
    tags['Liabilities'] === 0 &&
    tags['CurrentLiabilities'] !== 0 &&
    tags['NoncurrentLiabilities'] === 0
  ) {
    tags['Liabilities'] = tags['CurrentLiabilities']
  }

  var lngBSCheck1 =
    tags['Equity'] -
    (tags['EquityAttributableToParent'] +
      tags['EquityAttributableToNoncontrollingInterest'])
  var lngBSCheck2 = tags['Assets'] - tags['LiabilitiesAndEquity']
  var lngBSCheck3
  var lngBSCheck4
  var lngBSCheck5

  if (
    tags['CurrentAssets'] === 0 &&
    tags['NoncurrentAssets'] === 0 &&
    tags['CurrentLiabilities'] === 0 &&
    tags['NoncurrentLiabilities'] === 0
  ) {
    // If current assets/liabilities are zero and noncurrent assets/liabilities;: don't do this test because the balance sheet is not classified
    lngBSCheck3 = 0
    lngBSCheck4 = 0
  } else {
    // Balance sheet IS classified
    lngBSCheck3 =
      tags['Assets'] - (tags['CurrentAssets'] + tags['NoncurrentAssets'])
    lngBSCheck4 =
      tags['Liabilities'] -
      (tags['CurrentLiabilities'] + tags['NoncurrentLiabilities'])
  }

  lngBSCheck5 =
    tags['LiabilitiesAndEquity'] -
    (tags['Liabilities'] +
      tags['CommitmentsAndContingencies'] +
      tags['TemporaryEquity'] +
      tags['Equity'])

  if (lngBSCheck1) {
    console.log(
      'BS1: Equity(' +
        tags['Equity'] +
        ') = EquityAttributableToParent(' +
        tags['EquityAttributableToParent'] +
        ') , EquityAttributableToNoncontrollingInterest(' +
        tags['EquityAttributableToNoncontrollingInterest'] +
        '): ' +
        lngBSCheck1
    )
  }
  if (lngBSCheck2) {
    console.log(
      'BS2: Assets(' +
        tags['Assets'] +
        ') = LiabilitiesAndEquity(' +
        tags['LiabilitiesAndEquity'] +
        '): ' +
        lngBSCheck2
    )
  }
  if (lngBSCheck3) {
    console.log(
      'BS3: Assets(' +
        tags['Assets'] +
        ') = CurrentAssets(' +
        tags['CurrentAssets'] +
        ') + NoncurrentAssets(' +
        tags['NoncurrentAssets'] +
        '): ' +
        lngBSCheck3
    )
  }
  if (lngBSCheck4) {
    console.log(
      'BS4: Liabilities(' +
        tags['Liabilities'] +
        ')= CurrentLiabilities(' +
        tags['CurrentLiabilities'] +
        ') + NoncurrentLiabilities(' +
        tags['NoncurrentLiabilities'] +
        '): ' +
        lngBSCheck4
    )
  }
  if (lngBSCheck5) {
    console.log(
      'BS5: Liabilities and Equity(' +
        tags['LiabilitiesAndEquity'] +
        ')= Liabilities(' +
        tags['Liabilities'] +
        ') + CommitmentsAndContingencies(' +
        tags['CommitmentsAndContingencies'] +
        ')+ TemporaryEquity(' +
        tags['TemporaryEquity'] +
        ')+ Equity(' +
        tags['Equity'] +
        '): ' +
        lngBSCheck5
    )
  }

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
    earning.tags['GrossProfit'] || earning.tags['GrossProfit'] || 0

  // OperatingExpenses
  tags['OperatingExpenses'] =
    earning.tags['OperatingExpenses'] ||
    earning.tags['OperatingCostsAndExpenses'] ||
    0

  // CostsAndExpenses
  tags['CostsAndExpenses'] =
    earning.tags['CostsAndExpenses'] || earning.tags['CostsAndExpenses'] || 0

  // OtherOperatingIncome
  tags['OtherOperatingIncome'] =
    earning.tags['OtherOperatingIncome'] ||
    earning.tags['OtherOperatingIncome'] ||
    0

  // OperatingIncomeLoss
  tags['OperatingIncomeLoss'] =
    earning.tags['OperatingIncomeLoss'] ||
    earning.tags['OperatingIncomeLoss'] ||
    0

  // NonoperatingIncomeLoss
  tags['NonoperatingIncomeLoss'] =
    earning.tags['NonoperatingIncomeExpense'] ||
    earning.tags['NonoperatingIncomeExpense'] ||
    0

  // InterestAndDebtExpense
  tags['InterestAndDebtExpense'] =
    earning.tags['InterestAndDebtExpense'] ||
    earning.tags['InterestAndDebtExpense'] ||
    0

  // IncomeBeforeEquityMethodInvestments
  tags['IncomeBeforeEquityMethodInvestments'] =
    earning.tags[
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'
    ] ||
    earning.tags[
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'
    ] ||
    0

  // IncomeFromEquityMethodInvestments
  tags['IncomeFromEquityMethodInvestments'] =
    earning.tags['IncomeLossFromEquityMethodInvestments'] ||
    earning.tags['IncomeLossFromEquityMethodInvestments'] ||
    0

  // IncomeFromContinuingOperationsBeforeTax
  tags['IncomeFromContinuingOperationsBeforeTax'] =
    earning.tags[
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'
    ] ||
    earning.tags[
      'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest'
    ] ||
    0

  // IncomeTaxExpenseBenefit
  tags['IncomeTaxExpenseBenefit'] =
    earning.tags['IncomeTaxExpenseBenefit'] ||
    earning.tags['IncomeTaxExpenseBenefitContinuingOperations'] ||
    0

  // IncomeFromContinuingOperationsAfterTax
  tags['IncomeFromContinuingOperationsAfterTax'] =
    earning.tags[
      'IncomeLossBeforeExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple'
    ] ||
    earning.tags[
      'IncomeLossBeforeExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple'
    ] ||
    0

  // IncomeFromDiscontinuedOperations
  tags['IncomeFromDiscontinuedOperations'] =
    earning.tags['IncomeLossFromDiscontinuedOperationsNetOfTax'] ||
    earning.tags[
      'DiscontinuedOperationGainLossOnDisposalOfDiscontinuedOperationNetOfTax'
    ] ||
    earning.tags[
      'IncomeLossFromDiscontinuedOperationsNetOfTaxAttributableToReportingEntity'
    ] ||
    0

  // ExtraordaryItemsGainLoss
  tags['ExtraordaryItemsGainLoss'] =
    earning.tags['ExtraordinaryItemNetOfTax'] ||
    earning.tags['ExtraordinaryItemNetOfTax'] ||
    0

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
    0

  // NetIncomeAvailableToCommonStockholdersBasic
  tags['NetIncomeAvailableToCommonStockholdersBasic'] =
    earning.tags['NetIncomeLossAvailableToCommonStockholdersBasic'] || 0

  // #PreferredStockDividendsAndOtherAdjustments
  tags['PreferredStockDividendsAndOtherAdjustments'] =
    earning.tags['PreferredStockDividendsAndOtherAdjustments'] || 0

  // #NetIncomeAttributableToNoncontrollingInterest
  tags['NetIncomeAttributableToNoncontrollingInterest'] =
    earning.tags['NetIncomeLossAttributableToNoncontrollingInterest'] || 0

  // #NetIncomeAttributableToParent
  tags['NetIncomeAttributableToParent'] = earning.tags['NetIncomeLoss'] || 0

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
  earning.tags['ComprehensiveIncomeNetOfTax'] || 0

  // ComprehensiveIncomeAttributableToParent
  tags['ComprehensiveIncomeAttributableToParent'] =
    earning.tags['ComprehensiveIncomeNetOfTax'] ||
    earning.tags['ComprehensiveIncomeNetOfTax'] ||
    0

  // ComprehensiveIncomeAttributableToNoncontrollingInterest
  tags['ComprehensiveIncomeAttributableToNoncontrollingInterest'] =
    earning.tags[
      'ComprehensiveIncomeNetOfTaxAttributableToNoncontrollingInterest'
    ] ||
    earning.tags[
      'ComprehensiveIncomeNetOfTaxAttributableToNoncontrollingInterest'
    ] ||
    0

  // 'Adjustments to income statement information
  // Impute: NonoperatingIncomeLossPlusInterestAndDebtExpense
  tags['NonoperatingIncomeLossPlusInterestAndDebtExpense'] =
    tags['NonoperatingIncomeLoss'] + tags['InterestAndDebtExpense']

  // Impute: Net income available to common stockholders  (if it does not exist)
  if (
    tags['NetIncomeAvailableToCommonStockholdersBasic'] === 0 &&
    tags['PreferredStockDividendsAndOtherAdjustments'] === 0 &&
    tags['NetIncomeAttributableToParent'] !== 0
  ) {
    tags['NetIncomeAvailableToCommonStockholdersBasic'] =
      tags['NetIncomeAttributableToParent']
  }

  // Impute NetIncomeLoss
  if (
    tags['NetIncomeLoss'] !== 0 &&
    tags['IncomeFromContinuingOperationsAfterTax'] === 0
  ) {
    tags['IncomeFromContinuingOperationsAfterTax'] =
      tags['NetIncomeLoss'] -
      tags['IncomeFromDiscontinuedOperations'] -
      tags['ExtraordaryItemsGainLoss']
  }

  // Impute: Net income attributable to parent if it does not exist
  if (
    tags['NetIncomeAttributableToParent'] === 0 &&
    tags['NetIncomeAttributableToNoncontrollingInterest'] === 0 &&
    tags['NetIncomeLoss'] !== 0
  ) {
    tags['NetIncomeAttributableToParent'] = tags['NetIncomeLoss']
  }

  // Impute: PreferredStockDividendsAndOtherAdjustments
  if (
    tags['PreferredStockDividendsAndOtherAdjustments'] === 0 &&
    tags['NetIncomeAttributableToParent'] !== 0 &&
    tags['NetIncomeAvailableToCommonStockholdersBasic'] !== 0
  ) {
    tags['PreferredStockDividendsAndOtherAdjustments'] =
      tags['NetIncomeAttributableToParent'] -
      tags['NetIncomeAvailableToCommonStockholdersBasic']
  }

  // Impute: comprehensive income
  if (
    tags['ComprehensiveIncomeAttributableToParent'] === 0 &&
    tags['ComprehensiveIncomeAttributableToNoncontrollingInterest'] === 0 &&
    tags['ComprehensiveIncome'] === 0 &&
    tags['OtherComprehensiveIncome'] === 0
  ) {
    tags['ComprehensiveIncome'] = tags['NetIncomeLoss']
  }

  // Impute: other comprehensive income
  if (
    tags['ComprehensiveIncome'] !== 0 &&
    tags['OtherComprehensiveIncome'] === 0
  ) {
    tags['OtherComprehensiveIncome'] =
      tags['ComprehensiveIncome'] - tags['NetIncomeLoss']
  }

  // Impute: comprehensive income attributable to parent if it does not exist
  if (
    tags['ComprehensiveIncomeAttributableToParent'] === 0 &&
    tags['ComprehensiveIncomeAttributableToNoncontrollingInterest'] === 0 &&
    tags['ComprehensiveIncome'] !== 0
  ) {
    tags['ComprehensiveIncomeAttributableToParent'] =
      tags['ComprehensiveIncome']
  }

  // Impute: IncomeFromContinuingOperations*Before*Tax
  if (
    tags['IncomeBeforeEquityMethodInvestments'] !== 0 &&
    tags['IncomeFromEquityMethodInvestments'] !== 0 &&
    tags['IncomeFromContinuingOperationsBeforeTax'] === 0
  ) {
    tags['IncomeFromContinuingOperationsBeforeTax'] =
      tags['IncomeBeforeEquityMethodInvestments'] +
      tags['IncomeFromEquityMethodInvestments']
  }

  // Impute: IncomeFromContinuingOperations*Before*Tax2 (if income before tax is missing)
  if (
    tags['IncomeFromContinuingOperationsBeforeTax'] === 0 &&
    tags['IncomeFromContinuingOperationsAfterTax'] !== 0
  ) {
    tags['IncomeFromContinuingOperationsBeforeTax'] =
      tags['IncomeFromContinuingOperationsAfterTax'] +
      tags['IncomeTaxExpenseBenefit']
  }

  // Impute: IncomeFromContinuingOperations*After*Tax
  if (
    tags['IncomeFromContinuingOperationsAfterTax'] === 0 &&
    (tags['IncomeTaxExpenseBenefit'] !== 0 ||
      tags['IncomeTaxExpenseBenefit'] === 0) &&
    tags['IncomeFromContinuingOperationsBeforeTax'] !== 0
  ) {
    tags['IncomeFromContinuingOperationsAfterTax'] =
      tags['IncomeFromContinuingOperationsBeforeTax'] -
      tags['IncomeTaxExpenseBenefit']
  }

  // Impute: GrossProfit
  if (
    tags['GrossProfit'] === 0 &&
    tags['Revenues'] !== 0 &&
    tags['CostOfRevenue'] !== 0
  ) {
    tags['GrossProfit'] = tags['Revenues'] - tags['CostOfRevenue']
  }

  // Impute: GrossProfit
  if (
    tags['GrossProfit'] === 0 &&
    tags['Revenues'] !== 0 &&
    tags['CostOfRevenue'] !== 0
  ) {
    tags['GrossProfit'] = tags['Revenues'] - tags['CostOfRevenue']
  }

  // Impute: Revenues
  if (
    tags['GrossProfit'] !== 0 &&
    tags['Revenues'] === 0 &&
    tags['CostOfRevenue'] !== 0
  ) {
    tags['Revenues'] = tags['GrossProfit'] + tags['CostOfRevenue']
  }

  // Impute: CostOfRevenue
  if (
    tags['GrossProfit'] !== 0 &&
    tags['Revenues'] !== 0 &&
    tags['CostOfRevenue'] === 0
  ) {
    tags['CostOfRevenue'] = tags['Revenues'] - tags['GrossProfit']
  }

  // Impute: CostsAndExpenses (would NEVER have costs and expenses if has gross profit, gross profit is multi-step and costs and expenses is single-step)
  if (
    tags['GrossProfit'] === 0 &&
    tags['CostsAndExpenses'] === 0 &&
    tags['CostOfRevenue'] !== 0 &&
    tags['OperatingExpenses'] !== 0
  ) {
    tags['CostsAndExpenses'] = tags['CostOfRevenue'] + tags['OperatingExpenses']
  }

  // Impute: CostsAndExpenses based on existance of both costs of revenues and operating expenses
  if (
    tags['CostsAndExpenses'] === 0 &&
    tags['OperatingExpenses'] !== 0 &&
    tags['CostOfRevenue'] !== 0
  ) {
    tags['CostsAndExpenses'] = tags['CostOfRevenue'] + tags['OperatingExpenses']
  }

  // Impute: CostsAndExpenses
  if (
    tags['GrossProfit'] === 0 &&
    tags['CostsAndExpenses'] === 0 &&
    tags['Revenues'] !== 0 &&
    tags['OperatingIncomeLoss'] !== 0 &&
    tags['OtherOperatingIncome'] !== 0
  ) {
    tags['CostsAndExpenses'] =
      tags['Revenues'] -
      tags['OperatingIncomeLoss'] -
      tags['OtherOperatingIncome']
  }

  // Impute: OperatingExpenses based on existance of costs and expenses and cost of revenues
  if (
    tags['CostOfRevenue'] !== 0 &&
    tags['CostsAndExpenses'] !== 0 &&
    tags['OperatingExpenses'] === 0
  ) {
    tags['OperatingExpenses'] = tags['CostsAndExpenses'] - tags['CostOfRevenue']
  }

  // Impute: CostOfRevenues single-step method
  if (
    tags['Revenues'] !== 0 &&
    tags['GrossProfit'] === 0 &&
    tags['Revenues'] - tags['CostsAndExpenses'] ==
      tags['OperatingIncomeLoss'] &&
    tags['OperatingExpenses'] === 0 &&
    tags['OtherOperatingIncome'] === 0
  ) {
    tags['CostOfRevenue'] = tags['CostsAndExpenses'] - tags['OperatingExpenses']
  }

  // Impute: IncomeBeforeEquityMethodInvestments
  if (
    tags['IncomeBeforeEquityMethodInvestments'] === 0 &&
    tags['IncomeFromContinuingOperationsBeforeTax'] !== 0
  ) {
    tags['IncomeBeforeEquityMethodInvestments'] =
      tags['IncomeFromContinuingOperationsBeforeTax'] -
      tags['IncomeFromEquityMethodInvestments']
  }

  // Impute: IncomeBeforeEquityMethodInvestments
  if (
    tags['OperatingIncomeLoss'] !== 0 &&
    tags['NonoperatingIncomeLoss'] !== 0 &&
    tags['InterestAndDebtExpense'] == 0 &&
    tags['IncomeBeforeEquityMethodInvestments'] !== 0
  ) {
    tags['InterestAndDebtExpense'] =
      tags['IncomeBeforeEquityMethodInvestments'] -
      (tags['OperatingIncomeLoss'] + tags['NonoperatingIncomeLoss'])
  }

  // Impute: OtherOperatingIncome
  if (
    tags['GrossProfit'] !== 0 &&
    tags['OperatingExpenses'] !== 0 &&
    tags['OperatingIncomeLoss'] !== 0
  ) {
    tags['OtherOperatingIncome'] =
      tags['OperatingIncomeLoss'] -
      (tags['GrossProfit'] - tags['OperatingExpenses'])
  }

  // Move IncomeFromEquityMethodInvestments
  if (
    tags['IncomeFromEquityMethodInvestments'] !== 0 &&
    tags['IncomeBeforeEquityMethodInvestments'] !== 0 &&
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
    tags['OperatingIncomeLoss'] === 0 &&
    tags['IncomeBeforeEquityMethodInvestments'] !== 0
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
    tags['NonoperatingIncomeLossPlusInterestAndDebtExpense'] === 0 &&
    tags[
      'NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'
    ] !== 0
  ) {
    tags['NonoperatingIncomeLossPlusInterestAndDebtExpense'] =
      tags[
        'NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'
      ] - tags['IncomeFromEquityMethodInvestments']
  }

  var lngIS1 = tags['Revenues'] - tags['CostOfRevenue'] - tags['GrossProfit']
  var lngIS2 =
    tags['GrossProfit'] -
    tags['OperatingExpenses'] +
    tags['OtherOperatingIncome'] -
    tags['OperatingIncomeLoss']
  var lngIS3 =
    tags['OperatingIncomeLoss'] +
    tags['NonoperatingIncomeLossPlusInterestAndDebtExpense'] -
    tags['IncomeBeforeEquityMethodInvestments']
  var lngIS4 =
    tags['IncomeBeforeEquityMethodInvestments'] +
    tags['IncomeFromEquityMethodInvestments'] -
    tags['IncomeFromContinuingOperationsBeforeTax']
  var lngIS5 =
    tags['IncomeFromContinuingOperationsBeforeTax'] -
    tags['IncomeTaxExpenseBenefit'] -
    tags['IncomeFromContinuingOperationsAfterTax']
  var lngIS6 =
    tags['IncomeFromContinuingOperationsAfterTax'] +
    tags['IncomeFromDiscontinuedOperations'] +
    tags['ExtraordaryItemsGainLoss'] -
    tags['NetIncomeLoss']
  var lngIS7 =
    tags['NetIncomeAttributableToParent'] +
    tags['NetIncomeAttributableToNoncontrollingInterest'] -
    tags['NetIncomeLoss']
  var lngIS8 =
    tags['NetIncomeAttributableToParent'] -
    tags['PreferredStockDividendsAndOtherAdjustments'] -
    tags['NetIncomeAvailableToCommonStockholdersBasic']
  var lngIS9 =
    tags['ComprehensiveIncomeAttributableToParent'] +
    tags['ComprehensiveIncomeAttributableToNoncontrollingInterest'] -
    tags['ComprehensiveIncome']
  var lngIS10 =
    tags['NetIncomeLoss'] +
    tags['OtherComprehensiveIncome'] -
    tags['ComprehensiveIncome']
  var lngIS11 =
    tags['OperatingIncomeLoss'] -
    (tags['Revenues'] - tags['CostsAndExpenses'] + tags['OtherOperatingIncome'])

  if (lngIS1) {
    console.log(
      'IS1: GrossProfit(' +
        tags['GrossProfit'] +
        ') = Revenues(' +
        tags['Revenues'] +
        ') - CostOfRevenue(' +
        tags['CostOfRevenue'] +
        '): ' +
        lngIS1
    )
  }
  if (lngIS2) {
    console.log(
      'IS2: OperatingIncomeLoss(' +
        tags['OperatingIncomeLoss'] +
        ') = GrossProfit(' +
        tags['GrossProfit'] +
        ') - OperatingExpenses(' +
        tags['OperatingExpenses'] +
        ') + OtherOperatingIncome(' +
        tags['OtherOperatingIncome'] +
        '): ' +
        lngIS2
    )
  }
  if (lngIS3) {
    console.log(
      'IS3: IncomeBeforeEquityMethodInvestments(' +
        tags['IncomeBeforeEquityMethodInvestments'] +
        ') = OperatingIncomeLoss(' +
        tags['OperatingIncomeLoss'] +
        ') - NonoperatingIncomeLoss(' +
        tags['NonoperatingIncomeLoss'] +
        ')+ InterestAndDebtExpense(' +
        tags['InterestAndDebtExpense'] +
        '): ' +
        lngIS3
    )
  }
  if (lngIS4) {
    console.log(
      'IS4: IncomeFromContinuingOperationsBeforeTax(' +
        tags['IncomeFromContinuingOperationsBeforeTax'] +
        ') = IncomeBeforeEquityMethodInvestments(' +
        tags['IncomeBeforeEquityMethodInvestments'] +
        ') + IncomeFromEquityMethodInvestments(' +
        tags['IncomeFromEquityMethodInvestments'] +
        '): ' +
        lngIS4
    )
  }
  if (lngIS5) {
    console.log(
      'IS5: IncomeFromContinuingOperationsAfterTax(' +
        tags['IncomeFromContinuingOperationsAfterTax'] +
        ') = IncomeFromContinuingOperationsBeforeTax(' +
        tags['IncomeFromContinuingOperationsBeforeTax'] +
        ') - IncomeTaxExpenseBenefit(' +
        tags['IncomeTaxExpenseBenefit'] +
        '): ' +
        lngIS5
    )
  }
  if (lngIS6) {
    console.log(
      'IS6: NetIncomeLoss(' +
        tags['NetIncomeLoss'] +
        ') = IncomeFromContinuingOperationsAfterTax(' +
        tags['IncomeFromContinuingOperationsAfterTax'] +
        ') + IncomeFromDiscontinuedOperations(' +
        tags['IncomeFromDiscontinuedOperations'] +
        ') + ExtraordaryItemsGainLoss(' +
        tags['ExtraordaryItemsGainLoss'] +
        '): ' +
        lngIS6
    )
  }
  if (lngIS7) {
    console.log(
      'IS7: NetIncomeLoss(' +
        tags['NetIncomeLoss'] +
        ') = NetIncomeAttributableToParent(' +
        tags['NetIncomeAttributableToParent'] +
        ') + NetIncomeAttributableToNoncontrollingInterest(' +
        tags['NetIncomeAttributableToNoncontrollingInterest'] +
        '): ' +
        lngIS7
    )
  }
  if (lngIS8) {
    console.log(
      'IS8: NetIncomeAvailableToCommonStockholdersBasic(' +
        tags['NetIncomeAvailableToCommonStockholdersBasic'] +
        ') = NetIncomeAttributableToParent(' +
        tags['NetIncomeAttributableToParent'] +
        ') - PreferredStockDividendsAndOtherAdjustments(' +
        tags['PreferredStockDividendsAndOtherAdjustments'] +
        '): ' +
        lngIS8
    )
  }
  if (lngIS9) {
    console.log(
      'IS9: ComprehensiveIncome(' +
        tags['ComprehensiveIncome'] +
        ') = ComprehensiveIncomeAttributableToParent(' +
        tags['ComprehensiveIncomeAttributableToParent'] +
        ') + ComprehensiveIncomeAttributableToNoncontrollingInterest(' +
        tags['ComprehensiveIncomeAttributableToNoncontrollingInterest'] +
        '): ' +
        lngIS9
    )
  }
  if (lngIS10) {
    console.log(
      'IS10: ComprehensiveIncome(' +
        tags['ComprehensiveIncome'] +
        ') = NetIncomeLoss(' +
        tags['NetIncomeLoss'] +
        ') + OtherComprehensiveIncome(' +
        tags['OtherComprehensiveIncome'] +
        '): ' +
        lngIS10
    )
  }
  if (lngIS11) {
    console.log(
      'IS11: OperatingIncomeLoss(' +
        tags['OperatingIncomeLoss'] +
        ') = Revenues(' +
        tags['Revenues'] +
        ') - CostsAndExpenses(' +
        tags['CostsAndExpenses'] +
        ') + OtherOperatingIncome(' +
        tags['OtherOperatingIncome'] +
        '): ' +
        lngIS11
    )
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
    earning.tags['NetCashProvidedByUsedInOperatingActivities'] || 0

  // NetCashFlowsInvesting
  tags['NetCashFlowsInvesting'] =
    earning.tags['NetCashProvidedByUsedInInvestingActivities'] || 0

  // NetCashFlowsFinancing
  tags['NetCashFlowsFinancing'] =
    earning.tags['NetCashProvidedByUsedInFinancingActivities'] || 0

  // NetCashFlowsOperatingContinuing
  tags['NetCashFlowsOperatingContinuing'] =
    earning.tags[
      'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'
    ] || 0

  // NetCashFlowsInvestingContinuing
  tags['NetCashFlowsInvestingContinuing'] =
    earning.tags[
      'NetCashProvidedByUsedInInvestingActivitiesContinuingOperations'
    ] || 0
  // NetCashFlowsFinancingContinuing
  tags['NetCashFlowsFinancingContinuing'] =
    earning.tags[
      'NetCashProvidedByUsedInFinancingActivitiesContinuingOperations'
    ] || 0

  // NetCashFlowsOperatingDiscontinued
  tags['NetCashFlowsOperatingDiscontinued'] =
    earning.tags[
      'CashProvidedByUsedInOperatingActivitiesDiscontinuedOperations'
    ] || 0

  // NetCashFlowsInvestingDiscontinued
  tags['NetCashFlowsInvestingDiscontinued'] =
    earning.tags[
      'CashProvidedByUsedInInvestingActivitiesDiscontinuedOperations'
    ] || 0

  // NetCashFlowsFinancingDiscontinued
  tags['NetCashFlowsFinancingDiscontinued'] =
    earning.tags[
      'CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations'
    ] || 0

  // NetCashFlowsDiscontinued
  tags['NetCashFlowsDiscontinued'] =
    earning.tags['NetCashProvidedByUsedInDiscontinuedOperations'] || 0

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
  if (tags['NetCashFlowsDiscontinued'] === 0) {
    tags['NetCashFlowsDiscontinued'] =
      tags['NetCashFlowsOperatingDiscontinued'] +
      tags['NetCashFlowsInvestingDiscontinued'] +
      tags['NetCashFlowsFinancingDiscontinued']
  }

  // Impute: cash flows from continuing
  if (
    tags['NetCashFlowsOperating'] !== 0 &&
    tags['NetCashFlowsOperatingContinuing'] === 0
  ) {
    tags['NetCashFlowsOperatingContinuing'] =
      tags['NetCashFlowsOperating'] - tags['NetCashFlowsOperatingDiscontinued']
  }

  if (
    tags['NetCashFlowsInvesting'] !== 0 &&
    tags['NetCashFlowsInvestingContinuing'] === 0
  ) {
    tags['NetCashFlowsInvestingContinuing'] =
      tags['NetCashFlowsInvesting'] - tags['NetCashFlowsInvestingDiscontinued']
  }

  if (
    tags['NetCashFlowsFinancing'] !== 0 &&
    tags['NetCashFlowsFinancingContinuing'] === 0
  ) {
    tags['NetCashFlowsFinancingContinuing'] =
      tags['NetCashFlowsFinancing'] - tags['NetCashFlowsFinancingDiscontinued']
  }

  if (
    tags['NetCashFlowsOperating'] === 0 &&
    tags['NetCashFlowsOperatingContinuing'] !== 0 &&
    tags['NetCashFlowsOperatingDiscontinued'] === 0
  ) {
    tags['NetCashFlowsOperating'] = tags['NetCashFlowsOperatingContinuing']
  }

  if (
    tags['NetCashFlowsInvesting'] === 0 &&
    tags['NetCashFlowsInvestingContinuing'] !== 0 &&
    tags['NetCashFlowsInvestingDiscontinued'] === 0
  ) {
    tags['NetCashFlowsInvesting'] = tags['NetCashFlowsInvestingContinuing']
  }

  if (
    tags['NetCashFlowsFinancing'] === 0 &&
    tags['NetCashFlowsFinancingContinuing'] !== 0 &&
    tags['NetCashFlowsFinancingDiscontinued'] === 0
  ) {
    tags['NetCashFlowsFinancing'] = tags['NetCashFlowsFinancingContinuing']
  }

  tags['NetCashFlowsContinuing'] =
    tags['NetCashFlowsOperatingContinuing'] +
    tags['NetCashFlowsInvestingContinuing'] +
    tags['NetCashFlowsFinancingContinuing']

  // Impute: if net cash flow is missing,: this tries to figure out the value by adding up the detail
  if (
    tags['NetCashFlow'] === 0 &&
    (tags['NetCashFlowsOperating'] !== 0 ||
      tags['NetCashFlowsInvesting'] !== 0 ||
      tags['NetCashFlowsFinancing'] !== 0)
  ) {
    tags['NetCashFlow'] =
      tags['NetCashFlowsOperating'] +
      tags['NetCashFlowsInvesting'] +
      tags['NetCashFlowsFinancing']
  }

  var lngCF1 =
    tags['NetCashFlow'] -
    (tags['NetCashFlowsOperating'] +
      tags['NetCashFlowsInvesting'] +
      tags['NetCashFlowsFinancing'] +
      tags['ExchangeGainsLosses'])

  if (
    lngCF1 !== 0 &&
    tags['NetCashFlow'] -
      (tags['NetCashFlowsOperating'] +
        tags['NetCashFlowsInvesting'] +
        tags['NetCashFlowsFinancing'] +
        tags['ExchangeGainsLosses']) ===
      tags['ExchangeGainsLosses'] * -1
  ) {
    lngCF1 = 888888
  }

  // What is going on here is that 171 filers compute net cash flow differently than everyone else.
  // What I am doing is marking these by setting the value of the test to a number 888888 which would never occur naturally, so that I can differentiate this from errors.
  var lngCF2 =
    tags['NetCashFlowsContinuing'] -
    (tags['NetCashFlowsOperatingContinuing'] +
      tags['NetCashFlowsInvestingContinuing'] +
      tags['NetCashFlowsFinancingContinuing'])
  var lngCF3 =
    tags['NetCashFlowsDiscontinued'] -
    (tags['NetCashFlowsOperatingDiscontinued'] +
      tags['NetCashFlowsInvestingDiscontinued'] +
      tags['NetCashFlowsFinancingDiscontinued'])
  var lngCF4 =
    tags['NetCashFlowsOperating'] -
    (tags['NetCashFlowsOperatingContinuing'] +
      tags['NetCashFlowsOperatingDiscontinued'])
  var lngCF5 =
    tags['NetCashFlowsInvesting'] -
    (tags['NetCashFlowsInvestingContinuing'] +
      tags['NetCashFlowsInvestingDiscontinued'])
  var lngCF6 =
    tags['NetCashFlowsFinancing'] -
    (tags['NetCashFlowsFinancingContinuing'] +
      tags['NetCashFlowsFinancingDiscontinued'])

  if (lngCF1) {
    console.log(
      'CF1: NetCashFlow(' +
        tags['NetCashFlow'] +
        ') = (NetCashFlowsOperating(' +
        tags['NetCashFlowsOperating'] +
        ') + (NetCashFlowsInvesting(' +
        tags['NetCashFlowsInvesting'] +
        ') + (NetCashFlowsFinancing(' +
        tags['NetCashFlowsFinancing'] +
        ') + ExchangeGainsLosses(' +
        tags['ExchangeGainsLosses'] +
        '): ' +
        lngCF1
    )
  }

  if (lngCF2) {
    console.log(
      'CF2: NetCashFlowsContinuing(' +
        tags['NetCashFlowsContinuing'] +
        ') = NetCashFlowsOperatingContinuing(' +
        tags['NetCashFlowsOperatingContinuing'] +
        ') + NetCashFlowsInvestingContinuing(' +
        tags['NetCashFlowsInvestingContinuing'] +
        ') + NetCashFlowsFinancingContinuing(' +
        tags['NetCashFlowsFinancingContinuing'] +
        '): ' +
        lngCF2
    )
  }

  if (lngCF3) {
    console.log(
      'CF3: NetCashFlowsDiscontinued(' +
        tags['NetCashFlowsDiscontinued'] +
        ') = NetCashFlowsOperatingDiscontinued(' +
        tags['NetCashFlowsOperatingDiscontinued'] +
        ') + NetCashFlowsInvestingDiscontinued(' +
        tags['NetCashFlowsInvestingDiscontinued'] +
        ') + NetCashFlowsFinancingDiscontinued(' +
        tags['NetCashFlowsFinancingDiscontinued'] +
        '): ' +
        lngCF3
    )
  }

  if (lngCF4) {
    console.log(
      'CF4: NetCashFlowsOperating(' +
        tags['NetCashFlowsOperating'] +
        ') = NetCashFlowsOperatingContinuing(' +
        tags['NetCashFlowsOperatingContinuing'] +
        ') + NetCashFlowsOperatingDiscontinued(' +
        tags['NetCashFlowsOperatingDiscontinued'] +
        '): ' +
        lngCF4
    )
  }

  if (lngCF5) {
    console.log(
      'CF5: NetCashFlowsInvesting(' +
        tags['NetCashFlowsInvesting'] +
        ') = NetCashFlowsInvestingContinuing(' +
        tags['NetCashFlowsInvestingContinuing'] +
        ') + NetCashFlowsInvestingDiscontinued(' +
        tags['NetCashFlowsInvestingDiscontinued'] +
        '): ' +
        lngCF5
    )
  }

  if (lngCF6) {
    console.log(
      'CF6: NetCashFlowsFinancing(' +
        tags['NetCashFlowsFinancing'] +
        ') = NetCashFlowsFinancingContinuing(' +
        tags['NetCashFlowsFinancingContinuing'] +
        ') + NetCashFlowsFinancingDiscontinued(' +
        tags['NetCashFlowsFinancingDiscontinued'] +
        '): ' +
        lngCF6
    )
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
