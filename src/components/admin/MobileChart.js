import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';

/**
 * Mobile-optimized chart component
 * Automatically adjusts chart size and options based on screen size
 */
const MobileChart = ({
  type = 'bar', // 'bar', 'doughnut', 'line'
  data,
  title,
  subtitle,
  className = '',
  height = 300,
  mobileHeight = 200,
  options = {}
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [chartHeight, setChartHeight] = useState(height);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setChartHeight(mobile ? mobileHeight : height);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [height, mobileHeight]);

  // Mobile-optimized chart options
  const getMobileOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: isMobile ? 'bottom' : 'top',
          labels: {
            font: {
              size: isMobile ? 10 : 12
            },
            padding: isMobile ? 10 : 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(34, 34, 34, 0.9)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(212, 0, 110, 0.8)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          titleFont: {
            size: isMobile ? 12 : 14
          },
          bodyFont: {
            size: isMobile ? 11 : 13
          }
        }
      },
      ...options
    };

    // Type-specific options
    if (type === 'bar') {
      baseOptions.scales = {
        x: {
          ticks: {
            font: {
              size: isMobile ? 9 : 11
            },
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 45 : 0
          },
          grid: {
            display: !isMobile
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: isMobile ? 9 : 11
            },
            precision: 0
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        ...options.scales
      };
    }

    if (type === 'doughnut') {
      baseOptions.cutout = isMobile ? '60%' : '50%';
      baseOptions.plugins.legend.position = 'bottom';
      baseOptions.plugins.legend.labels.padding = isMobile ? 15 : 20;
    }

    return baseOptions;
  };

  const renderChart = () => {
    const chartOptions = getMobileOptions();
    
    switch (type) {
      case 'doughnut':
        return <Doughnut data={data} options={chartOptions} height={chartHeight} />;
      case 'bar':
      default:
        return <Bar data={data} options={chartOptions} height={chartHeight} />;
    }
  };

  return (
    <Card className={`shadow mb-4 mobile-chart-card ${className}`}>
      {(title || subtitle) && (
        <Card.Header className="py-3">
          {title && (
            <h6 className="m-0 font-weight-bold text-primary">
              {title}
            </h6>
          )}
          {subtitle && (
            <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.875rem' }}>
              {subtitle}
            </p>
          )}
        </Card.Header>
      )}
      <Card.Body className="p-3">
        <div 
          className="chart-container" 
          style={{ 
            height: `${chartHeight}px`,
            position: 'relative'
          }}
        >
          {renderChart()}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MobileChart;
