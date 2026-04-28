import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../context/ThemeContext';

function GpaTrendChart({ courseOfferings, selectedInstructorId, courseAverage }) {
  const { theme } = useTheme();

  const seasonOrder = { 'wi': 1, 'sp': 2, 'su': 3, 'fa': 4 };
  
  // Filter offerings based on instructor
  const filteredOfferings = courseOfferings.filter(o => {
    if (!selectedInstructorId || selectedInstructorId === 0) return true;
    return o.sections?.some(s => s.instructor?.id === selectedInstructorId);
  });

  const sortedOfferings = [...filteredOfferings].sort((a, b) => {
    const [yearA, seasonA] = a.yearTerm.split('-');
    const [yearB, seasonB] = b.yearTerm.split('-');

    if (yearA !== yearB) {
      return parseInt(yearA) - parseInt(yearB);
    }
    return (seasonOrder[seasonA] || 0) - (seasonOrder[seasonB] || 0);
  });

  const categories = sortedOfferings.map(o => o.yearTerm);
  const gpaData = sortedOfferings.map(o => {
    if (!selectedInstructorId || selectedInstructorId === 0) {
      return o.cumulative?.gpa ? parseFloat(o.cumulative.gpa.toFixed(2)) : null;
    }
    // Compute instructor's specific GPA for this term
    let qualityPoints = 0;
    let total = 0;
    const gpaMap = { aPlus: 4.0, a: 4.0, aMinus: 3.67, bPlus: 3.33, b: 3.0, bMinus: 2.67, cPlus: 2.33, c: 2.0, cMinus: 1.67, dPlus: 1.33, d: 1.0, dMinus: 0.67, f: 0.0 };
    
    o.sections?.forEach(s => {
      if (s.instructor?.id === selectedInstructorId && s.grades) {
        total += s.grades.total || 0;
        Object.keys(gpaMap).forEach(key => {
          qualityPoints += (s.grades[key] || 0) * gpaMap[key];
        });
      }
    });
    return total > 0 ? parseFloat((qualityPoints / total).toFixed(2)) : null;
  });

  const seriesObj = {
    name: 'Average GPA',
    type: 'line',
    data: gpaData,
    smooth: true,
    symbolSize: 8,
    itemStyle: { color: '#983220' },
    lineStyle: { width: 3 },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(152, 50, 32, 0.3)' },
          { offset: 1, color: 'rgba(152, 50, 32, 0)' }
        ]
      }
    }
  };

  if (courseAverage && courseAverage > 0) {
    seriesObj.markLine = {
      data: [{ yAxis: parseFloat(courseAverage.toFixed(2)), name: 'Course Avg' }],
      lineStyle: { color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', type: 'dashed', width: 2 },
      label: { formatter: 'Course Avg\n{c}', position: 'end', color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 10 },
      symbol: ['none', 'none'],
      silent: true
    };
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0];
        return `${p.name}<br/>GPA: ${p.value !== null ? p.value : 'N/A'}`;
      }
    },
    grid: { left: '3%', right: '10%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: theme === 'dark' ? '#ccc' : '#666', rotate: 45 }
    },
    yAxis: {
      type: 'value',
      min: (value) => Math.max(0, Math.floor(value.min * 10) / 10 || 0),
      max: 4.0,
      axisLabel: { color: theme === 'dark' ? '#ccc' : '#666' },
      splitLine: { lineStyle: { color: theme === 'dark' ? '#444' : '#eee' } }
    },
    series: [seriesObj],
    animation: false
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