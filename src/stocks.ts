import fs from "fs";
import { join } from "path";
import os from "os";
import { ReportResp, TagsObject } from "./utils/types";
import cliProgress from "cli-progress";

const fsPromise = fs.promises;

const parse = async (fileName: string) => {
  const contents = await fsPromise.readFile(fileName);

  return await JSON.parse(contents.toString());
};

const getTags = async (fileName: string) => {
  const data = (await parse(join(fileName))) as ReportResp;

  return (data.facts?.["us-gaap"] as TagsObject) ?? undefined;
};

const main = async () => {
  const base = join(os.homedir() + "/Downloads/companyfacts");
  const files = await fsPromise.readdir(base);
  const map: Record<string, any> = {};
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  bar1.start(files.length, 0);
  let i = 0;
  for (const file of files) {
    const tags = await getTags(join(base, "/", file));
    if (tags) map[file] = tags.Assets?.label;
    bar1.update(i);
    i++;
  }
  bar1.stop();
  console.log("Values: ", Object.keys(map).length);
};

main();
