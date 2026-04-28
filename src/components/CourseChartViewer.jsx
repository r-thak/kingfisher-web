import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '../context/ThemeContext';

function CourseChartViewer({ gradesData }) {
  const { theme } = useTheme();
  const [selectedTermId, setSelectedTermId] = useState(0);
  const [selectedInstructorId, setSelectedInstructorId] = useState(0);

  const cumulativeGrades = gradesData?.cumulative;
  const courseOfferings = gradesData?.courseOfferings || [];

  const instructorOptions = useMemo(() => {
    const instructorsMap = new Map();
    instructorsMap.set(0, { id: 0, name: 'All instructors' });
    courseOfferings.forEach(offering => {
      if (selectedTermId === 0 || offering.termId === selectedTermId) {
        offering.sections?.forEach(section => {
          if (section.instructor) {
            instructorsMap.set(section.instructor.id, section.instructor);
          }
        });
      }
    });
    return Array.from(instructorsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [courseOfferings, selectedTermId]);

  const termOptions = useMemo(() => {
    const opts = [{ termId: 0, yearTerm: 'All semesters' }];
    courseOfferings.forEach(o => {
      const taughtByInstructor = selectedInstructorId === 0 || o.sections?.some(s => s.instructor?.id === selectedInstructorId);
      if (taughtByInstructor) {
        opts.push({ termId: o.termId, yearTerm: o.yearTerm });
      }
    });
    return opts;
  }, [courseOfferings, selectedInstructorId]);

  React.useEffect(() => {
    if (selectedInstructorId !== 0 && !instructorOptions.some(i => i.id === selectedInstructorId)) {
      setSelectedInstructorId(0);
    }
  }, [instructorOptions, selectedInstructorId]);

  React.useEffect(() => {
    if (selectedTermId !== 0 && !termOptions.some(t => t.termId === selectedTermId)) {
      setSelectedTermId(0);
    }
  }, [termOptions, selectedTermId]);

  const activeGrades = useMemo(() => {
    if (selectedTermId === 0 && selectedInstructorId === 0) return cumulativeGrades;

    if (selectedTermId !== 0 && selectedInstructorId === 0) {
      const offering = courseOfferings.find(o => o.termId === selectedTermId);
      return offering?.cumulative;
    }

    let sections = [];
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

    const agg = { aPlus: 0, a: 0, aMinus: 0, bPlus: 0, b: 0, bMinus: 0, cPlus: 0, c: 0, cMinus: 0, dPlus: 0, d: 0, dMinus: 0, f: 0, w: 0, total: 0, qualityPoints: 0 };
    
    const gpaMap = {
        aPlus: 4.0, a: 4.0, aMinus: 3.67,
        bPlus: 3.33, b: 3.0, bMinus: 2.67,
        cPlus: 2.33, c: 2.0, cMinus: 1.67,
        dPlus: 1.33, d: 1.0, dMinus: 0.67,
        f: 0.0
    };

    sections.forEach(s => {
        Object.keys(agg).forEach(key => {
            if (key !== 'qualityPoints') agg[key] += (s[key] || 0);
        });
        Object.keys(gpaMap).forEach(key => {
            agg.qualityPoints += (s[key] || 0) * gpaMap[key];
        });
    });
    
    agg.gpa = agg.total > 0 ? agg.qualityPoints / (agg.total - (agg.w || 0)) : 0;
    return agg;
  }, [selectedTermId, selectedInstructorId, cumulativeGrades, courseOfferings]);

  const distributionOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'],
      axisLabel: { color: theme === 'dark' ? '#eee' : '#333' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme === 'dark' ? '#eee' : '#333' }
    },
    series: [{
      name: 'Count',
      type: 'bar',
      data: activeGrades ? [
        activeGrades.aPlus || 0, activeGrades.a || 0, activeGrades.aMinus || 0,
        activeGrades.bPlus || 0, activeGrades.b || 0, activeGrades.bMinus || 0,
        activeGrades.cPlus || 0, activeGrades.c || 0, activeGrades.cMinus || 0,
        activeGrades.dPlus || 0, activeGrades.d || 0, activeGrades.dMinus || 0,
        activeGrades.f || 0
      ] : [],
      itemStyle: { color: '#983220' }
    }],
    animation: false
  };

  return (
    <div className="CourseChartViewer">
      <div className="grid" style={{ marginBottom: '1rem' }}>
        <div className="col col-8">
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>Instructor</label>
            <select
              className="ui dropdown"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' }}
              value={selectedInstructorId}
              onChange={e => setSelectedInstructorId(Number(e.target.value))}
            >
              {instructorOptions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col col-8">
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>Semester</label>
            <select
              className="ui dropdown"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' }}
              value={selectedTermId}
              onChange={e => setSelectedTermId(Number(e.target.value))}
            >
              {termOptions.map(term => (
                <option key={term.termId} value={term.termId}>{term.yearTerm}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ReactECharts
          option={distributionOption}
          style={{ height: '350px', width: '100%' }}
          theme={theme === 'dark' ? 'dark' : undefined}
        />
      </div>

      {activeGrades && (
        <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          <span>Total Grades: <strong>{activeGrades.total?.toLocaleString()}</strong></span>
          <span style={{ margin: '0 1rem' }}>|</span>
          <span>Average GPA: <strong style={{ color: '#983220' }}>{activeGrades.gpa?.toFixed(2) || 'N/A'}</strong></span>
        </div>
      )}
    </div>
  );
}

export default CourseChartViewer;