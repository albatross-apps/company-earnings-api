import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
const fsP = fs.promises

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const data = await fsP.readFile('../processor/cache/data.json')

    const dataJson = JSON.parse(data.toString())
    console.log(dataJson)
    if (!Array.isArray(dataJson)) {
      throw new Error('Cannot find data')
    }

    res.status(200).json(dataJson)
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler
