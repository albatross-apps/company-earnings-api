import fs from 'fs'

const fsPromise = fs.promises

export const getCachedEarnings = async (fileName: string) => {
  const content = await fsPromise.readFile(fileName)
  return JSON.parse(content.toString())
}

export const setCachedEarnings = async (fileName: string, data: Earnings[]) => {
  await fsPromise.writeFile(fileName, JSON.stringify(data))
}

export const hasCache = (fileName: string) => fs.existsSync(fileName)
