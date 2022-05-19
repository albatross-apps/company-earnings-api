import Layout from '../components/Layout'
import useSWR from 'swr'
import { EarningsMetric, ReportPretty, ScoresData } from '../interfaces'
import {
  Card,
  Container,
  Grid,
  Loading,
  Table,
  Text,
  useAsyncList,
  useCollator,
} from '@nextui-org/react'
import { currencyFormatter, objArrToObj, toPercentFormat } from '../utils'
import { TagGraph } from '../components/TagGraph'
import { useEffect, useMemo, useState } from 'react'

const IndexPage = () => {
  const load = async ({ signal }) => {
    const resp = await fetch('/api/scores')
    const data = (await resp.json()) as EarningsMetric[]
    console.log({ data })
    return {
      items: data.map((d) => {
        const value = Object.entries(d.metrics).map(
          ([key, report]: [string, ReportPretty[]]) => {
            return {
              key,
              value: report?.length
                ? report[report.length - 1].percentGrowthYoY
                : 0,
            }
          }
        )
        return { ticker: d.ticker, ...objArrToObj(value) }
      }),
    }
  }
  const collator = useCollator({ numeric: true })
  async function sort({ items, sortDescriptor }) {
    return {
      items: items.sort((a, b) => {
        let first = a[sortDescriptor.column]
        let second = b[sortDescriptor.column]
        let cmp = collator.compare(first, second)
        if (sortDescriptor.direction === 'descending') {
          cmp *= -1
        }
        return cmp
      }),
    }
  }

  const list = useAsyncList({ load, sort })

  const [d, setD] = useState<EarningsMetric[]>()

  const getData = async () => {
    const resp = await fetch('/api/scores')
    return (await resp.json()) as EarningsMetric[]
  }

  useEffect(() => {
    ;(async () => {
      const r = await getData()
      setD(r)
    })()
  }, [])

  const columns = list.items?.length
    ? Object.keys(list.items[0]).map((item) => ({
        key: item,
      }))
    : [{ key: 'none' }]

  return (
    <Container fluid>
      <Grid.Container gap={2} justify="center">
        <Grid xs={12} justify="center">
          <Text h1>Company Growths</Text>
        </Grid>
        {!d ? (
          <Loading />
        ) : (
          d.slice(0, 10).map((x) => (
            <Grid>
              <Card key={x.ticker}>
                <Grid.Container gap={2}>
                  <Grid>
                    <Text h3>{x.ticker}</Text>
                  </Grid>
                  <Grid xs={12}>{<TagGraph reports={x} />}</Grid>
                </Grid.Container>
              </Card>
            </Grid>
          ))
        )}
      </Grid.Container>
    </Container>
  )
}

export default IndexPage
