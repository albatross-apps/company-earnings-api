import fs from "fs";
import { join } from "path";
import os from "os";
import { ReportResp, TagsObject } from "./utils/types";

const fsPromise = fs.promises;

const parse = async (fileName: string) => {
  const contents = await fsPromise.readFile(fileName);

  return await JSON.parse(contents.toString());
};

const getTags = async () => {
  const data = (await parse(
    join(os.homedir() + "/Downloads/companyfacts/CIK0000002491.json")
  )) as ReportResp;

  return data.facts["us-gaap"] as TagsObject;
};

const main = async () => {
  const tags = await getTags();
  console.log(tags.AssetsCurrent.units.USD);
};

main();
