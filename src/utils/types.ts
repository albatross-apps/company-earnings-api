export interface ReportResp {
  cik: number;
  facts: {
    "us-gaap": TagsObject;
  };
}

export interface TagsObject {
  AssetsCurrent: Tag;
  Assets: Tag;
  Cash: Tag;
  Liabilities: Tag;
  LiabilitiesCurrent: Tag;
  NetCashProvidedByUsedInFinancingActivities: Tag;
  NetCashProvidedByUsedInInvestingActivities: Tag;
  NetCashProvidedByUsedInOperatingActivities: Tag;
  NetIncomeLoss: Tag;
  ProfitLoss: Tag;
  CostOfRevenue: Tag;
  RevenueFromContractWithCustomerExcludingAssessedTax: Tag;

  //.....
}

export interface Tag {
  label: string;
  description: string;
  units: {
    USD: Report[];
  };
}

export interface Report {
  val: number;
  form: string;
  fy: number;
  fp: string;

  end: string;
  filed: string;
  frame: string;
}
