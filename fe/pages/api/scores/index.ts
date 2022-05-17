import { NextApiRequest, NextApiResponse } from 'next'
import Redis from 'ioredis'

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  const redis = new Redis(process.env.REDIS_URL)
  try {
    console.log('here')
    const data = await redis.get('data')

    const dataJson = JSON.parse(data)
    if (!Array.isArray(dataJson)) {
      throw new Error('Cannot find data')
    }

    res.status(200).json(dataJson)
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message })
  } finally {
    redis.quit()
  }
}

export default handler
