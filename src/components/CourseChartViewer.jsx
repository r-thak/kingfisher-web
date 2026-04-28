import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../context/ThemeContext';

const GRADE_KEYS = ['aPlus', 'a', 'aMinus', 'bPlus', 'b', 'bMinus', 'cPlus', 'c', 'cMinus', 'dPlus', 'd', 'dMinus', 'f'];
const GRADE_LABELS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

const GPA_MAP = {
  aPlus: 4.0, a: 4.0, aMinus: 3.67,
  bPlus: 3.33, b: 3.0, bMinus: 2.67,
  cPlus: 2.33, c: 2.0, cMinus: 1.67,
  dPlus: 1.33, d: 1.0, dMinus: 0.67,
  f: 0.0
};

function aggregateSections(sections) {
  const agg = { total: 0, qualityPoints: 0 };
  GRADE_KEYS.forEach(k => agg[k] = 0);

  sections.forEach(s => {
    GRADE_KEYS.forEach(k => { agg[k] += (s[k] || 0); });
    agg.total += (s.total || 0);
    GRADE_KEYS.filter(k => k !== 'w').forEach(k => {
      agg.qualityPoints += (s[k] || 0) * (GPA_MAP[k] ?? 0);
    });
  });

  const nonW = agg.total - (agg.w || 0);
  agg.gpa = nonW > 0 ? agg.qualityPoints / nonW : 0;
  return agg;
}

function toPercent(grades) {
  const total = GRADE_KEYS.reduce((s, k) => s + (grades[k] || 0), 0);
  if (!total) return GRADE_KEYS.map(() => 0);
  return GRADE_KEYS.map(k => parseFloat(((grades[k] || 0) / total * 100).toFixed(1)));
}

function CourseChartViewer({ gradesData, selectedTermId, selectedInstructorId }) {
  const { theme } = useTheme();
  const cumulativeGrades = gradesData?.cumulative;
  const courseOfferings = gradesData?.courseOfferings || [];

  const isFiltered = selectedTermId !== 0 || selectedInstructorId !== 0;

  const filteredGrades = useMemo(() => {
    if (!isFiltered) return null;

    if (selectedTermId !== 0 && selectedInstructorId === 0) {
      const offering = courseOfferings.find(o => o.termId === selectedTermId);
      return offering?.cumulative ?? null;
    }

    const sections = [];
    courseOfferings.forEach(offering => {
      if (selectedTermId === 0 || offering.termId === selectedTermId) {
        offering.sections?.forEach(section => {
          if (section.instructor?.id === selectedInstructorId) {
            sections.push(section.grades);
          }
        });
      }
    });

    if (sections.length === 0) return null;
    return aggregateSections(sections);
  }, [selectedTermId, selectedInstructorId, cumulativeGrades, courseOfferings, isFiltered]);

  const axisColor = theme === 'dark' ? '#eee' : '#333';

  const series = [];

  if (isFiltered && filteredGrades) {
    // Show both: course-wide (semi-transparent) and filtered (solid)
    series.push({
      name: 'Course Overall',
      type: 'bar',
      data: cumulativeGrades ? toPercent(cumulativeGrades) : [],
      itemStyle: { color: 'rgba(152,50,32,0.25)', borderColor: 'rgba(152,50,32,0.5)', borderWidth: 1 },
      barGap: '0%',
    });
    series.push({
      name: 'Selection',
      type: 'bar',
      data: toPercent(filteredGrades),
      itemStyle: { color: '#983220' },
      barGap: '0%',
    });
  } else {
    series.push({
      name: 'Count',
      type: 'bar',
      data: cumulativeGrades ? toPercent(cumulativeGrades) : [],
      itemStyle: { color: '#983220' },
    });
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        return params.map(p => `${p.seriesName}: ${p.value}%`).join('<br/>');
      }
    },
    legend: isFiltered ? {
      data: ['Course Overall', 'Selection'],
      textStyle: { color: axisColor, fontSize: 12 },
      top: 0
    } : undefined,
    grid: {
      left: '3%', right: '4%',
      bottom: '3%', top: isFiltered ? '40px' : '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: GRADE_LABELS,
      axisLabel: { color: axisColor }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: axisColor, formatter: '{value}%' },
      max: 100
    },
    series,
    animation: false
  };

  const displayGrades = (isFiltered && filteredGrades) ? filteredGrades : cumulativeGrades;

  return (
    <div className="CourseChartViewer">
      <div className="chart-container">
        <ReactECharts
          option={option}
          style={{ height: '350px', width: '100%' }}
          theme={theme === 'dark' ? 'dark' : undefined}
        />
      </div>

      {displayGrades && (
        <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem', fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
          <span>Total Grades: <strong style={{ color: 'var(--text-primary)' }}>{displayGrades.total?.toLocaleString()}</strong></span>
          <span style={{ margin: '0 1rem' }}>|</span>
          <span>Average GPA: <strong style={{ color: '#983220' }}>{displayGrades.gpa?.toFixed(2) || 'N/A'}</strong></span>
        </div>
      )}
    </div>
  );
}

export default CourseChartViewer;