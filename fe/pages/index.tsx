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
import { objArrToObj } from '../utils'

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

  // const { data, error } = useSWR('/api/scores', fetcher)

  const list = useAsyncList({ load, sort })

  if (list.isLoading) return <Loading type="points" />
  console.log({ list: list.items })

  const columns = list.items?.length
    ? Object.keys(list.items).map((item) => ({
        key: item,
      }))
    : [{ key: 'none' }]

  return (
    <Container fluid>
      <Grid.Container gap={2} justify="center">
        <Grid xs>
          <Table
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
                  {(columnKey) => <Table.Cell>{item[columnKey]}</Table.Cell>}
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
          </Table>
        </Grid>
      </Grid.Container>
    </Container>
  )
}

export default IndexPage
