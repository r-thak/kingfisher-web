import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getCourseGrades } from '../api';
import { useTheme } from '../context/ThemeContext';
import GpaTrendChart from '../components/GpaTrendChart';
import CourseChartViewer from '../components/CourseChartViewer';

const FLAT_CARD_STYLE = {
  padding: '1.5rem',
  border: '1px solid var(--border-color)',
  borderRadius: '0.28571429rem',
  backgroundColor: 'var(--bg-card)',
  marginBottom: '1.5rem',
  fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif'
};

const TABLE_STYLES = {
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', border: '1px solid var(--border-color)', borderRadius: '0.28571429rem' },
  th: { padding: '0.92857143em 0.78571429em', fontWeight: '700', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', userSelect: 'none' },
  td: { padding: '0.78571429em', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)' },
  tdRight: { padding: '0.78571429em', borderTop: '1px solid var(--border-color)', textAlign: 'right', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }
};

function Course() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);

  const [instructors, setInstructors] = useState([]);
  const [sortCol, setSortCol] = useState('totalStudents');
  const [sortOrder, setSortOrder] = useState('desc');
  const [instructorFilter, setInstructorFilter] = useState('');

  // Lifted state for charts
  const [selectedTermId, setSelectedTermId] = useState(0);
  const [selectedInstructorId, setSelectedInstructorId] = useState(0);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCourse(courseId),
      getCourseGrades(courseId)
    ])
    .then(([courseData, gradesData]) => {
      setCourse(courseData);
      setGrades(gradesData);
      document.title = `${courseData.subject?.code || courseData.subject} ${courseData.number} - Kingfisher`;
      
      // Aggregate instructors
      if (gradesData?.courseOfferings) {
        const instructorMap = {};
        gradesData.courseOfferings.forEach(offering => {
          if (offering.sections) {
            offering.sections.forEach(sec => {
              const name = sec.instructor?.name || 'Unknown Instructor';
              if (!instructorMap[name]) {
                instructorMap[name] = { name, totalStudents: 0, gpaPoints: 0 };
              }
              const g = sec.grades;
              if (g && g.total) {
                instructorMap[name].totalStudents += g.total;
                instructorMap[name].gpaPoints += (g.gpa * g.total);
              }
            });
          }
        });
        const list = Object.values(instructorMap).map(inst => ({
          name: inst.name,
          totalStudents: inst.totalStudents,
          gpa: inst.totalStudents > 0 ? (inst.gpaPoints / inst.totalStudents) : null
        }));
        setInstructors(list);
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [courseId]);

  // Compute options for chart dropdowns
  const courseOfferings = grades?.courseOfferings || [];
  
  const instructorOptions = useMemo(() => {
    const map = new Map();
    map.set(0, { id: 0, name: 'Filter instructors...' });
    courseOfferings.forEach(offering => {
      if (selectedTermId === 0 || offering.termId === selectedTermId) {
        offering.sections?.forEach(section => {
          if (section.instructor) map.set(section.instructor.id, section.instructor);
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.id === 0 ? -1 : a.name.localeCompare(b.name));
  }, [courseOfferings, selectedTermId]);

  const termOptions = useMemo(() => {
    const opts = [{ termId: 0, yearTerm: 'Filter semesters...' }];
    courseOfferings.forEach(o => {
      const taughtBy = selectedInstructorId === 0 || o.sections?.some(s => s.instructor?.id === selectedInstructorId);
      if (taughtBy) opts.push({ termId: o.termId, yearTerm: o.yearTerm });
    });
    return opts;
  }, [courseOfferings, selectedInstructorId]);

  useEffect(() => {
    if (selectedInstructorId !== 0 && !instructorOptions.some(i => i.id === selectedInstructorId)) setSelectedInstructorId(0);
  }, [instructorOptions, selectedInstructorId]);

  useEffect(() => {
    if (selectedTermId !== 0 && !termOptions.some(t => t.termId === selectedTermId)) setSelectedTermId(0);
  }, [termOptions, selectedTermId]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortCol(col);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="Course">
        <div className="ui segment" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="ui active centered inline loader large"></div>
          <p style={{ marginTop: '1rem' }}>Loading Course Data...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="Course">
        <div className="ui segment" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="ui large header">Course not found</div>
          <button className="ui secondary button" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const cum = grades?.cumulative || {};
  const subjectCode = course.subject?.code || course.subject;

  const filteredInstructors = instructors.filter(i => i.name.toLowerCase().includes(instructorFilter.toLowerCase()));
  const sortedInstructors = [...filteredInstructors].sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (valA === null) valA = -1;
    if (valB === null) valB = -1;
    
    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
  });

  const renderTh = (label, column, isRight) => {
    const isSorted = sortCol === column;
    return (
      <th 
        onClick={() => handleSort(column)}
        style={{ ...TABLE_STYLES.th, textAlign: isRight ? 'right' : 'left' }}
      >
        {label}
        {isSorted && <span style={{ marginLeft: '4px', fontSize: '0.8em' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
      </th>
    );
  };

  return (
    <div className="Course">
      <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <a onClick={() => navigate('/')}>Home</a>
        <span className="divider">/</span>
        <a onClick={() => navigate(`/search?subject=${subjectCode}`)}>{subjectCode}</a>
        <span className="divider">/</span>
        <div className="active">{course.number}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em', marginBottom: '1.5rem', flexWrap: 'wrap', fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)', fontWeight: '700' }}>
          {course.title || course.name}
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '18px' }}>
            {subjectCode} {course.number}
          </div>
        </h1>
      </div>

      <div className="grid">
        <div className="col col-16" style={{ width: '100%' }}>
          {grades && (
            <>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <select
                  style={{ flex: 1, padding: '0.6em 1em', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', outline: 'none', cursor: 'pointer' }}
                  value={selectedInstructorId}
                  onChange={e => setSelectedInstructorId(Number(e.target.value))}
                >
                  {instructorOptions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                </select>
                <select
                  style={{ flex: 1, padding: '0.6em 1em', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', outline: 'none', cursor: 'pointer' }}
                  value={selectedTermId}
                  onChange={e => setSelectedTermId(Number(e.target.value))}
                >
                  {termOptions.map(term => <option key={term.termId} value={term.termId}>{term.yearTerm}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ ...FLAT_CARD_STYLE, flex: '1 1 45%', minWidth: '400px', marginBottom: 0 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem', marginTop: 0 }}>Grade Distribution</h2>
                  <CourseChartViewer 
                    gradesData={grades} 
                    selectedTermId={selectedTermId} 
                    selectedInstructorId={selectedInstructorId} 
                  />
                </div>
                <div style={{ ...FLAT_CARD_STYLE, flex: '1 1 45%', minWidth: '400px', marginBottom: 0 }}>
                  <GpaTrendChart 
                    courseOfferings={courseOfferings} 
                    selectedInstructorId={selectedInstructorId}
                    courseAverage={cum.gpa}
                  />
                </div>
              </div>
              
              <div style={FLAT_CARD_STYLE}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Instructors</h2>
                  <input 
                    type="text" 
                    placeholder="Search instructors..." 
                    value={instructorFilter}
                    onChange={(e) => setInstructorFilter(e.target.value)}
                    style={{
                      padding: '0.4em 0.8em',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
                
                {sortedInstructors.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={TABLE_STYLES.table}>
                      <thead>
                        <tr>
                          {renderTh('Instructor', 'name', false)}
                          {renderTh('Total # Grades', 'totalStudents', true)}
                          {renderTh('Avg. GPA', 'gpa', true)}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedInstructors.map((inst, idx) => (
                          <tr key={idx} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={TABLE_STYLES.td}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{inst.name}</span>
                            </td>
                            <td style={TABLE_STYLES.tdRight}>{inst.totalStudents.toLocaleString()}</td>
                            <td style={TABLE_STYLES.tdRight}>{inst.gpa !== null ? inst.gpa.toFixed(2) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No instructors found matching your filter.</p>
                )}
              </div>
            </>
          )}

          <div style={FLAT_CARD_STYLE}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', marginTop: 0 }}>Course Description</h2>
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)', margin: 0 }}>
              {course.description || 'No description available for this course.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Course;