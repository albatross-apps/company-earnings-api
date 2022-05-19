import { useMemo } from 'react'
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EarningsMetric } from '../interfaces'
import stringToColor from 'string-to-color'
import { currencyFormatter } from '../utils'

import { scaleLog } from 'd3-scale'
const scale = scaleLog().base(10)

interface Props {
  reports: EarningsMetric
}

const labelFormatter = (v: number) => {
  const value = v.toString()
  return `${value.slice(0, 4)}Q${value.charAt(4)}`
}

const priceFormatter = (v) => {
  return currencyFormatter('USD')
    .format(v / 100000)
    .slice(0, -3)
}

export const TagGraph = ({ reports }: Props) => {
  const data = useMemo(() => {
    const allData = Object.entries(reports.metrics).flatMap(
      ([tag, reports]) => {
        return reports.map((x) => {
          return {
            name: Number(`${x.fy}${x.fp.charAt(1)}`),
            [tag]: x.val,
          }
        })
      }
    )
    return allData
      .reduce((prev, curr) => {
        const x = prev.find((x) => x.name === curr.name)
        if (x) {
          x[Object.keys(curr)[1]] = curr[Object.keys(curr)[1]]
        } else {
          prev.push({
            name: curr.name,
            [Object.keys(curr)[1]]: curr[Object.keys(curr)[1]],
          })
        }
        return prev
      }, [])
      .sort((a, b) => a.name - b.name)
  }, [reports])

  console.log(data)

  return (
    <LineChart
      width={1200}
      height={750}
      data={data}
      margin={{ top: 20, right: 5, bottom: 50, left: 50 }}
    >
      {Object.keys(reports.metrics).map((x) => (
        <>
          <Line
            type="monotone"
            dataKey={x}
            stroke={stringToColor(x)}
            connectNulls
          />
        </>
      ))}
      <Tooltip
        itemStyle={{ height: '1px' }}
        labelFormatter={labelFormatter}
        formatter={priceFormatter}
        offset={50}
        position={{ x: 0, y: -50 }}
        allowEscapeViewBox={{ y: true }}
      />
      <XAxis dataKey={'name'} tickFormatter={labelFormatter}>
        <Label position="insideBottom" offset={-30}>
          Year and Quarter
        </Label>
      </XAxis>
      <YAxis
        scale={'sqrt'}
        label={{
          value: '$ / 100,000',
          angle: -90,
          position: 'insideLeft',
          offset: -30,
        }}
        //interval={0}
        tickFormatter={priceFormatter}
      />
      <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
    </LineChart>
  )
}
