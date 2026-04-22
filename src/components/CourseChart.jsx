import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../context/ThemeContext';

function CourseChart({ grades }) {
  const { theme } = useTheme();
  
  if (!grades) return null;

  const labels = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
  const data = [
    grades.aPlus || 0, grades.a || 0, grades.aMinus || 0,
    grades.bPlus || 0, grades.b || 0, grades.bMinus || 0,
    grades.cPlus || 0, grades.c || 0, grades.cMinus || 0,
    grades.dPlus || 0, grades.d || 0, grades.dMinus || 0,
    grades.f || 0
  ];

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {
        color: theme === 'dark' ? '#eee' : '#333'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: theme === 'dark' ? '#eee' : '#333'
      }
    },
    series: [
      {
        name: 'Count',
        type: 'bar',
        data: data,
        itemStyle: {
          color: '#E84A27' // UIUC Orange
        }
      }
    ]
  };

  return (
    <div className="CourseChart">
      <ReactECharts 
        option={option} 
        style={{ height: '400px', width: '100%' }} 
        theme={theme === 'dark' ? 'dark' : undefined}
      />
    </div>
  );
}

export default CourseChart;
