import { useMemo } from 'react'
import { Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { EarningsMetric } from '../interfaces'
import stringToColor from 'string-to-color'

interface Props {
  reports: EarningsMetric
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
    return allData.reduce((prev, curr) => {
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
  }, [reports])

  console.log({ idk: data })

  return (
    <LineChart width={1200} height={500} data={data}>
      {Object.keys(reports.metrics).map((x) => (
        <Line type="monotone" dataKey={x} stroke={stringToColor(x)} />
      ))}
      <XAxis dataKey={'name'} />
      <YAxis />
      <Tooltip />
    </LineChart>
  )
}
