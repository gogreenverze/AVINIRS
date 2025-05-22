import React from 'react';
import { Bar, Line, Pie, Doughnut, Scatter, Radar, PolarArea, Bubble } from 'react-chartjs-2';
import { Card } from 'react-bootstrap';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import '../../styles/components/Charts.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Default chart options
const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(34, 34, 34, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(212, 0, 110, 0.8)',
      borderWidth: 1,
      padding: 10,
      displayColors: true,
      usePointStyle: true,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 12
      }
    }
  }
};

/**
 * Bar Chart component
 */
export const BarChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        },
        ...(options.scales?.y || {})
      },
      x: {
        ...(options.scales?.x || {})
      }
    }
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <Bar data={data} options={chartOptions} />
    </div>
  );
};

BarChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};

/**
 * Line Chart component
 */
export const LineChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        ...(options.scales?.y || {})
      },
      x: {
        ...(options.scales?.x || {})
      }
    }
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <Line data={data} options={chartOptions} />
    </div>
  );
};

LineChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};

/**
 * Area Chart component
 */
export const AreaChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  // Create a deep copy of the data to avoid modifying the original
  const areaData = JSON.parse(JSON.stringify(data));

  // Add fill property to datasets
  if (areaData.datasets) {
    areaData.datasets = areaData.datasets.map(dataset => ({
      ...dataset,
      fill: true,
      backgroundColor: dataset.backgroundColor || 'rgba(212, 0, 110, 0.1)'
    }));
  }

  const chartOptions = {
    ...defaultOptions,
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        ...(options.scales?.y || {})
      },
      x: {
        ...(options.scales?.x || {})
      }
    }
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <Line data={areaData} options={chartOptions} />
    </div>
  );
};

AreaChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};

/**
 * Pie Chart component
 */
export const PieChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <Pie data={data} options={chartOptions} />
    </div>
  );
};

PieChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};

/**
 * Doughnut Chart component
 */
export const DoughnutChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <Doughnut data={data} options={chartOptions} />
    </div>
  );
};

DoughnutChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};

/**
 * Radar Chart component
 */
export const RadarChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options,
    scales: {
      r: {
        beginAtZero: true,
        ...(options.scales?.r || {})
      }
    }
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <Radar data={data} options={chartOptions} />
    </div>
  );
};

RadarChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};

/**
 * Scatter Chart component
 */
export const ScatterChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options,
    scales: {
      y: {
        beginAtZero: options.scales?.y?.beginAtZero !== false,
        ...(options.scales?.y || {})
      },
      x: {
        beginAtZero: options.scales?.x?.beginAtZero !== false,
        ...(options.scales?.x || {})
      }
    }
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <Scatter data={data} options={chartOptions} />
    </div>
  );
};

ScatterChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};

/**
 * Polar Area Chart component
 */
export const PolarAreaChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  const chartOptions = {
    ...defaultOptions,
    ...options
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <PolarArea data={data} options={chartOptions} />
    </div>
  );
};

PolarAreaChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};

/**
 * Chart Card component
 */
export const ChartCard = ({
  title,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = ''
}) => {
  return (
    <Card className={`chart-card ${className}`}>
      {title && (
        <Card.Header className={`chart-card-header ${headerClassName}`}>
          <h6 className="m-0 font-weight-bold">{title}</h6>
        </Card.Header>
      )}
      <Card.Body className={`chart-card-body ${bodyClassName}`}>
        {children}
      </Card.Body>
    </Card>
  );
};

ChartCard.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string
};

/**
 * Stat Card component
 */
export const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  className = ''
}) => {
  return (
    <Card className={`stat-card border-left-${color} ${className}`}>
      <Card.Body>
        <div className="row no-gutters align-items-center">
          <div className="col mr-2">
            <div className={`text-xs font-weight-bold text-${color} text-uppercase mb-1`}>
              {title}
            </div>
            <div className="h5 mb-0 font-weight-bold text-gray-800">
              {value}
            </div>
          </div>
          {icon && (
            <div className="col-auto">
              {icon}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.node
  ]).isRequired,
  icon: PropTypes.node,
  color: PropTypes.oneOf(['primary', 'success', 'info', 'warning', 'danger', 'secondary']),
  className: PropTypes.string
};

/**
 * Combo Chart component - combines bar and line charts
 */
export const ComboChart = ({
  data,
  options = {},
  title,
  height = 300,
  className = ''
}) => {
  // Ensure data is properly formatted for combo chart
  // Each dataset should have a 'type' property ('bar' or 'line')
  const comboData = {
    ...data,
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      type: dataset.type || 'bar' // Default to bar if not specified
    }))
  };

  const chartOptions = {
    ...defaultOptions,
    ...options,
    scales: {
      y: {
        beginAtZero: true,
        ...(options.scales?.y || {})
      },
      x: {
        ...(options.scales?.x || {})
      }
    }
  };

  return (
    <div className={`chart-container ${className}`} style={{ height }}>
      {title && <h6 className="chart-title">{title}</h6>}
      <Bar data={comboData} options={chartOptions} />
    </div>
  );
};

ComboChart.propTypes = {
  data: PropTypes.object.isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.number,
  className: PropTypes.string
};
