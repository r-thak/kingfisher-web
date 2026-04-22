import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../context/ThemeContext';

function GpaTrendChart({ courseOfferings }) {
  const { theme } = useTheme();

  // Sort offerings by year and term (simplified since we have yearTerm like "2025-sp")
  // For a proper sort, we'd need to map "sp", "su", "fa", "wi" to numeric values.
  // Sort offerings by year and term correctly
  const seasonOrder = { 'wi': 1, 'sp': 2, 'su': 3, 'fa': 4 };
  const sortedOfferings = [...courseOfferings].sort((a, b) => {
    const [yearA, seasonA] = a.yearTerm.split('-');
    const [yearB, seasonB] = b.yearTerm.split('-');
    
    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB);
    }
    return (seasonOrder[seasonA] || 0) - (seasonOrder[seasonB] || 0);
  });

  const categories = sortedOfferings.map(o => o.yearTerm);
  const gpaData = sortedOfferings.map(o => o.cumulative?.gpa ? parseFloat(o.cumulative.gpa.toFixed(2)) : null);

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: 'Average GPA Trend',
      left: 'center',
      textStyle: {
        color: theme === 'dark' ? '#eee' : '#333',
        fontSize: 16
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0];
        return `${p.name}<br/>GPA: ${p.value !== null ? p.value : 'N/A'}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        color: theme === 'dark' ? '#ccc' : '#666',
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      min: (value) => Math.floor(value.min * 10) / 10 || 0,
      max: 4.0,
      axisLabel: {
        color: theme === 'dark' ? '#ccc' : '#666'
      },
      splitLine: {
        lineStyle: {
          color: theme === 'dark' ? '#444' : '#eee'
        }
      }
    },
    series: [
      {
        name: 'Average GPA',
        type: 'line',
        data: gpaData,
        smooth: true,
        symbolSize: 8,
        itemStyle: {
          color: '#E84A27' // UIUC Orange
        },
        lineStyle: {
          width: 3
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(232, 74, 39, 0.3)' },
              { offset: 1, color: 'rgba(232, 74, 39, 0)' }
            ]
          }
        }
      }
    ]
  };

  return (
    <div className="GpaTrendChart">
      <ReactECharts
        option={option}
        style={{ height: '350px', width: '100%' }}
        theme={theme === 'dark' ? 'dark' : undefined}
      />
    </div>
  );
}

export default GpaTrendChart;
