import React, { useState, useMemo } from 'react';
import CourseChart from './CourseChart';

function CourseChartViewer({ gradesData }) {
  const [selectedTermId, setSelectedTermId] = useState(0);
  const [selectedInstructorId, setSelectedInstructorId] = useState(0);

  const cumulativeGrades = gradesData?.cumulative;
  const courseOfferings = gradesData?.courseOfferings || [];

  const instructorOptions = useMemo(() => {
    const instructorsMap = new Map();
    instructorsMap.set(0, { id: 0, name: 'All instructors' });
    courseOfferings.forEach(offering => {
      offering.sections?.forEach(section => {
        if (section.instructor) {
          instructorsMap.set(section.instructor.id, section.instructor);
        }
      });
    });
    return Array.from(instructorsMap.values());
  }, [courseOfferings]);

  const termOptions = useMemo(() => {
    const opts = [{ termId: 0, yearTerm: 'All semesters' }];
    courseOfferings.forEach(o => opts.push({ termId: o.termId, yearTerm: o.yearTerm }));
    return opts;
  }, [courseOfferings]);

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

    const agg = { aPlus: 0, a: 0, aMinus: 0, bPlus: 0, b: 0, bMinus: 0, cPlus: 0, c: 0, cMinus: 0, dPlus: 0, d: 0, dMinus: 0, f: 0, w: 0, total: 0 };
    sections.forEach(s => { Object.keys(agg).forEach(key => { agg[key] += (s[key] || 0); }); });
    return agg;
  }, [selectedTermId, selectedInstructorId, cumulativeGrades, courseOfferings]);

  return (
    <div className="grid">
      <div className="col col-5">
        <div className="form">
          <div className="form-group">
            <label>Instructors</label>
            <select
              value={selectedInstructorId}
              onChange={e => setSelectedInstructorId(Number(e.target.value))}
            >
              {instructorOptions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Semesters</label>
            <select
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
      <div className="col col-11">
        <CourseChart grades={activeGrades} />
        {activeGrades && (
          <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>
            <p>Total Grades: {activeGrades.total} | Average GPA: {activeGrades.gpa?.toFixed(2) || 'N/A'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseChartViewer;