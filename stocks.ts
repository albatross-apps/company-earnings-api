import path from "path";
import fs from "fs";
import { join } from "path";
import os from "os";

const fsPromise = fs.promises;

const parse = async (fileName: string) => {
  const contents = await fsPromise.readFile(fileName);

  return await JSON.parse(contents.toString());
};

const main = async () => {
  console.log(
    await parse(
      join(os.homedir() + "/Downloads/companyfacts/CIK0000002491.json")
    )
  );
};

main();
