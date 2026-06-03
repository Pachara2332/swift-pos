'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Download,
  FileSpreadsheet,
  Package,
  ReceiptText,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  Doughnut,
  Line,
} from 'react-chartjs-2'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend)

type Analytics = {
  todayRevenue: number
  todayTransactions: number
  averageTicket: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  lowStockProducts: { id: string; name: string; stock: number; lowStockAlert: number; salePrice: number }[]
  salesByHour: { hour: number; revenue: number; sales: number }[]
  revenueTrend: { date: string; revenue: number }[]
}

type ExportRow = Record<string, string | number>

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'THB',
  maximumFractionDigits: 0,
})

const chartInk = '#1f2a33'
const chartGreen = '#2f7d59'
const chartOchre = '#c58a2b'
const chartClay = '#b85c38'

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
      labels: {
        boxWidth: 10,
        color: chartInk,
      },
    },
    tooltip: {
      backgroundColor: '#1f2a33',
      titleColor: '#f7f2e8',
      bodyColor: '#f7f2e8',
      padding: 12,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6f766f', maxRotation: 0 },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(31, 42, 51, 0.08)' },
      ticks: { color: '#6f766f' },
      border: { display: false },
    },
  },
} satisfies ChartOptions<'line'>

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = window.setTimeout(() => controller.abort('analytics-timeout'), 9000)

    fetch('/api/analytics', { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Unable to load analytics')
        }
        if (!active) return
        setAnalytics(data)
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') {
          return
        }
        console.error(error)
        setError(error instanceof Error ? error.message : 'Unable to load analytics')
      })
      .finally(() => {
        window.clearTimeout(timeout)
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
      window.clearTimeout(timeout)
      if (!controller.signal.aborted) {
        controller.abort('dashboard-unmounted')
      }
    }
  }, [])

  const trendChart = useMemo(() => {
    const rows = analytics?.revenueTrend ?? []

    return {
      labels: rows.map((item) => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Revenue',
          data: rows.map((item) => item.revenue),
          borderColor: chartGreen,
          backgroundColor: 'rgba(47, 125, 89, 0.16)',
          pointBackgroundColor: chartInk,
          pointBorderWidth: 0,
          pointRadius: 3,
          borderWidth: 3,
          tension: 0.38,
          fill: true,
        },
      ],
    }
  }, [analytics])

  const hourlyChart = useMemo(() => {
    const rows = analytics?.salesByHour ?? []

    return {
      labels: rows.map((bucket) => `${bucket.hour}:00`),
      datasets: [
        {
          label: 'Revenue',
          data: rows.map((bucket) => bucket.revenue),
          backgroundColor: rows.map((_, index) => (index % 2 === 0 ? chartInk : chartGreen)),
          borderRadius: 8,
          maxBarThickness: 34,
        },
      ],
    }
  }, [analytics])

  const productChart = useMemo(() => {
    const rows = analytics?.topProducts ?? []

    return {
      labels: rows.map((product) => product.name),
      datasets: [
        {
          label: 'Units sold',
          data: rows.map((product) => product.quantity),
          backgroundColor: [chartGreen, chartOchre, chartInk, chartClay, '#7a806f'],
          borderColor: '#f7f2e8',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    }
  }, [analytics])

  const exportRows = useMemo<ExportRow[]>(() => {
    if (!analytics) return []

    return [
      { section: 'Summary', metric: 'Today Revenue', value: analytics.todayRevenue },
      { section: 'Summary', metric: 'Transactions', value: analytics.todayTransactions },
      { section: 'Summary', metric: 'Average Ticket', value: analytics.averageTicket },
      ...analytics.topProducts.map((product) => ({
        section: 'Top Products',
        metric: product.name,
        units: product.quantity,
        revenue: product.revenue,
      })),
      ...analytics.lowStockProducts.map((product) => ({
        section: 'Low Stock',
        metric: product.name,
        stock: product.stock,
        threshold: product.lowStockAlert,
        salePrice: product.salePrice,
      })),
      ...analytics.salesByHour.map((bucket) => ({
        section: 'Sales By Hour',
        metric: `${bucket.hour}:00`,
        sales: bucket.sales,
        revenue: bucket.revenue,
      })),
      ...analytics.revenueTrend.map((day) => ({
        section: 'Revenue Trend',
        metric: day.date,
        revenue: day.revenue,
      })),
    ]
  }, [analytics])

  const exportCsv = () => {
    if (!exportRows.length) return

    const headers = Array.from(new Set(exportRows.flatMap((row) => Object.keys(row))))
    const csv = [
      headers.join(','),
      ...exportRows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
    ].join('\n')

    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `swift-pos-analytics-${dateStamp()}.csv`)
  }

  const exportExcel = async () => {
    if (!analytics || !exportRows.length) return

    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(exportRows), 'Analytics')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(analytics.topProducts), 'Top Products')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(analytics.lowStockProducts), 'Low Stock')
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(analytics.salesByHour), 'Sales By Hour')
    XLSX.writeFile(workbook, `swift-pos-analytics-${dateStamp()}.xlsx`)
  }

  if (loading) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-loading">Preparing store ledger...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-error">
          <strong>Dashboard data is unavailable.</strong>
          <p>{error || 'Please try again after the database is reachable.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-kicker">Back office snapshot</p>
          <h1>Store ledger</h1>
          <p className="dashboard-subtitle">Revenue, product movement, and stock pressure for today.</p>
        </div>

        <div className="export-actions">
          <button className="btn btn-quiet" onClick={exportCsv}>
            <Download size={17} />
            CSV
          </button>
          <button className="btn btn-primary" onClick={exportExcel}>
            <FileSpreadsheet size={17} />
            Excel
          </button>
        </div>
      </header>

      <section className="metric-strip">
        <MetricCard icon={<TrendingUp size={20} />} label="Today revenue" value={money.format(analytics.todayRevenue)} tone="green" />
        <MetricCard icon={<ReceiptText size={20} />} label="Transactions" value={analytics.todayTransactions.toString()} tone="ink" />
        <MetricCard icon={<BarChart3 size={20} />} label="Average ticket" value={money.format(analytics.averageTicket)} tone="ochre" />
        <MetricCard icon={<AlertTriangle size={20} />} label="Low stock" value={analytics.lowStockProducts.length.toString()} tone="clay" />
      </section>

      <section className="dashboard-grid">
        <div className="panel panel-wide">
          <PanelHeading icon={<TrendingUp size={18} />} title="Revenue trend" note="Last 14 days" />
          <div className="chart-frame tall">
            <Line data={trendChart} options={baseChartOptions} />
          </div>
        </div>

        <div className="panel panel-narrow inventory-panel">
          <PanelHeading icon={<AlertTriangle size={18} />} title="Stock watch" note="Items needing attention" />
          <div className="stock-list">
            {analytics.lowStockProducts.length === 0 ? (
              <EmptyState text="Inventory looks healthy" />
            ) : (
              analytics.lowStockProducts.map((product) => (
                <div key={product.id} className="stock-row">
                  <div>
                    <strong>{product.name}</strong>
                    <span>Threshold {product.lowStockAlert}</span>
                  </div>
                  <em className={product.stock === 0 ? 'danger' : ''}>{product.stock} left</em>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel panel-products">
          <PanelHeading icon={<Package size={18} />} title="Top sellers" note="Units sold today" />
          <div className="chart-frame donut">
            {analytics.topProducts.length === 0 ? (
              <EmptyState text="No sales today yet" />
            ) : (
              <Doughnut
                data={productChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: chartInk, boxWidth: 10, padding: 14 },
                    },
                    tooltip: baseChartOptions.plugins.tooltip,
                  },
                  cutout: '62%',
                }}
              />
            )}
          </div>
        </div>

        <div className="panel panel-hourly">
          <PanelHeading icon={<BarChart3 size={18} />} title="Sales by hour" note="Counter rhythm" />
          <div className="chart-frame">
            {analytics.salesByHour.length === 0 ? (
              <EmptyState text="No hourly sales to show" />
            ) : (
              <Bar data={hourlyChart} options={baseChartOptions as ChartOptions<'bar'>} />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'green' | 'ink' | 'ochre' | 'clay' }) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

function PanelHeading({ icon, title, note }: { icon: React.ReactNode; title: string; note: string }) {
  return (
    <div className="panel-heading">
      <div>
        <h2>{icon}{title}</h2>
        <p>{note}</p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>
}

function csvCell(value: string | number | undefined) {
  const text = value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
