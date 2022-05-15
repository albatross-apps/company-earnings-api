import { Grid } from 'gridjs-react'
import Layout from '../components/Layout'
import 'gridjs/dist/theme/mermaid.css'
import useSWR from 'swr'
import { ScoresData } from '../interfaces'

//@ts-ignore
const fetcher = (...args) => fetch(...args).then((res) => res.json())

const IndexPage = () => {
  const { data, error } = useSWR('/api/scores', async (...args) => {
    console.log('here')
    const resp = await fetch(...args)
    return (await resp.json()) as ScoresData[]
  })

  // const { data, error } = useSWR('/api/scores', fetcher)

  console.log({ data, error })

  if (!data) return <h1>Loading</h1>
  return (
    <Layout title="Home | Next.js + TypeScript Example">
      <Grid
        data={data.map((x) => ({ ticker: x.ticker, score: x.score }))}
        columns={['ticker', 'score']}
        search={true}
      />
    </Layout>
  )
}

export default IndexPage
