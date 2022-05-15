import fs from 'fs'
import { Earnings } from '../types'

const fsPromise = fs.promises

export const getCachedEarnings = async (fileName: string) => {
  const content = await fsPromise.readFile(fileName)
  return JSON.parse(content.toString())
}

export const setCachedEarnings = async (fileName: string, data: Earnings[]) => {
  await fsPromise.writeFile(fileName, JSON.stringify(data))
}

export const setCache = async (fileName: string, data: unknown[]) => {
  await fsPromise.writeFile(fileName, JSON.stringify(data))
}

export const getCached = async <T extends unknown>(fileName: string) => {
  const content = await fsPromise.readFile(fileName)
  return JSON.parse(content.toString()) as T
}

export const hasCache = (fileName: string) => fs.existsSync(fileName)
