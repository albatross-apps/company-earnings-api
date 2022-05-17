import { NextApiRequest, NextApiResponse } from 'next'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log('here')
    const data = await redis.get('data')

    console.log({ data })
    const dataJson = JSON.parse(data)
    if (!Array.isArray(dataJson)) {
      throw new Error('Cannot find data')
    }

    res.status(200).json(dataJson)
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler
