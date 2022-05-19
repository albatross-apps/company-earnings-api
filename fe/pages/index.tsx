import Layout from '../components/Layout'
import useSWR from 'swr'
import { EarningsMetric, ReportPretty, ScoresData } from '../interfaces'
import {
  Container,
  Grid,
  Loading,
  Table,
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

  if (list.isLoading) return <Loading type="points" />
  return (
    <Container fluid>
      <Grid.Container gap={2} justify="center">
        {d && <TagGraph reports={d[0]} />}
        <Grid xs>
          {/* <Table
            css={{ minWidth: '100%', height: 'auto' }}
            sortDescriptor={list.sortDescriptor}
            onSortChange={list.sort}
            width="100%"
          >
            <Table.Header columns={columns}>
              {(column) => (
                <Table.Column key={column.key}>{column.key}</Table.Column>
              )}
            </Table.Header>
            <Table.Body items={list.items} loadingState={list.loadingState}>
              {(item) => (
                <Table.Row key={item.ticker}>
                  {(columnKey) => {
                    if (columnKey === 'ticker')
                      return <Table.Cell>{item[columnKey]}</Table.Cell>
                    return (
                      <Table.Cell>
                        {!!item[columnKey]
                          ? toPercentFormat(item[columnKey])
                          : '0%'}
                      </Table.Cell>
                    )
                  }}
                </Table.Row>
              )}
            </Table.Body>
            <Table.Pagination
              shadow
              noMargin
              align="center"
              rowsPerPage={10}
              onPageChange={(page) => console.log({ page })}
            />
          </Table> */}
        </Grid>
      </Grid.Container>
    </Container>
  )
}

export default IndexPage
