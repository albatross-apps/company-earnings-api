import Layout from '../components/Layout'
import useSWR from 'swr'
import { ScoresData } from '../interfaces'
import {
  Container,
  Grid,
  Table,
  useAsyncList,
  useCollator,
} from '@nextui-org/react'

const IndexPage = () => {
  const load = async ({ signal }) => {
    const resp = await fetch('/api/scores')
    return {
      items: (await resp.json()) as ScoresData[],
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

  return (
    <Container fluid>
      <Grid.Container gap={2} justify="center">
        <Grid xs>
          <Table
            aria-label="Example static collection table"
            css={{ minWidth: '100%', height: 'auto' }}
            sortDescriptor={list.sortDescriptor}
            onSortChange={list.sort}
            width="100%"
          >
            <Table.Header>
              <Table.Column key="ticker" allowsSorting>
                Ticker
              </Table.Column>
              <Table.Column key="score" allowsSorting>
                Score
              </Table.Column>
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
