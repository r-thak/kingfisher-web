import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { getCourses, exploreSubjects } from '../api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function Search() {
  const queryParams = useQuery();
  const searchString = queryParams.get('q') || queryParams.get('query') || '';
  const subjectStr = queryParams.get('subject') || '';
  const instructorStr = queryParams.get('instructor') || '';
  const sortStr = queryParams.get('sort') || '';
  const orderStr = queryParams.get('order') || 'desc'; // usually default to desc for popularity/gpa
  
  const [results, setResults] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  // Local state for debounced inputs
  const [localSubject, setLocalSubject] = useState(subjectStr);
  const [localInstructor, setLocalInstructor] = useState(instructorStr);
  const debouncedSubject = useDebounce(localSubject, 400);
  const debouncedInstructor = useDebounce(localInstructor, 400);

  useEffect(() => {
    exploreSubjects({ perPage: 200, sort: 'subjectCode', order: 'asc' })
      .then(res => setSubjectsList(res.results || []))
      .catch(console.error);
  }, []);

  // Update URL when debounced values change
  useEffect(() => {
    const isSubjectValid = debouncedSubject.length === 0 || debouncedSubject.length >= 2;
    const isInstructorValid = debouncedInstructor.length === 0 || debouncedInstructor.length >= 3;

    if (isSubjectValid && isInstructorValid) {
      if (debouncedSubject !== subjectStr || debouncedInstructor !== instructorStr) {
        const q = searchString ? `&q=${encodeURIComponent(searchString)}` : '';
        const sortParams = sortStr ? `&sort=${sortStr}&order=${orderStr}` : '';
        const subjParams = debouncedSubject ? `&subject=${encodeURIComponent(debouncedSubject)}` : '';
        const instParams = debouncedInstructor ? `&instructor=${encodeURIComponent(debouncedInstructor)}` : '';
        navigate(`/search?${q}${subjParams}${instParams}${sortParams}`);
      }
    }
  }, [debouncedSubject, debouncedInstructor, subjectStr, instructorStr, searchString, sortStr, orderStr, navigate]);

  useEffect(() => {
    setLocalSubject(subjectStr);
    setLocalInstructor(instructorStr);
  }, [subjectStr, instructorStr]);

  useEffect(() => {
    setLoading(true);
    let params = {};
    if (searchString) params.query = searchString;
    if (subjectStr) params.subject = subjectStr;
    if (instructorStr) params.instructor = instructorStr;
    if (sortStr) {
      params.sort = sortStr;
      params.order = orderStr;
    }

    getCourses(params)
      .then(data => {
        const items = data.results || [];
        setResults(items);
        setTotalCount(data.totalCount || items.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchString, subjectStr, instructorStr, sortStr, orderStr]);

  const handleSortChange = (e) => {
    const val = e.target.value;
    const q = searchString ? `&q=${encodeURIComponent(searchString)}` : '';
    const subj = subjectStr ? `&subject=${encodeURIComponent(subjectStr)}` : '';
    const inst = instructorStr ? `&instructor=${encodeURIComponent(instructorStr)}` : '';
    
    const [newSort, newOrder] = val.split('-');
    navigate(`/search?sort=${newSort}&order=${newOrder}${q}${subj}${inst}`);
  };

  const currentSortValue = sortStr ? `${sortStr}-${orderStr}` : 'popularity-desc';

  return (
    <div className="Search">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="large-header" style={{ margin: 0 }}>
          Search Results
          <div className="sub-header">
            Showing {totalCount} courses for: <strong>{searchString || subjectStr || instructorStr || 'All'}</strong>
          </div>
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
        <input 
          type="text"
          placeholder="Filter subjects..."
          value={localSubject} 
          onChange={e => setLocalSubject(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6em 1em',
            borderRadius: '2px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />

        <input 
          type="text"
          placeholder="Filter instructor..."
          value={localInstructor} 
          onChange={e => setLocalInstructor(e.target.value)}
          style={{
            flex: 1,
            padding: '0.6em 1em',
            borderRadius: '2px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <select 
          value={currentSortValue} 
          onChange={handleSortChange}
          style={{
            padding: '0.4em 0.8em',
            borderRadius: '2px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card)',
            fontSize: '13px',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="popularity-desc">Sort by Popularity</option>
          <option value="gpa-desc">Sort by GPA</option>
          <option value="total_grades-desc">Sort by Total Grades</option>
          <option value="name-asc">Course Name (A-Z)</option>
          <option value="name-desc">Course Name (Z-A)</option>
          <option value="number-asc">Course Number (Low to High)</option>
          <option value="number-desc">Course Number (High to Low)</option>
        </select>
      </div>

      <div style={{ fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
            <div className="loader"></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Searching Courses...</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '2px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No results found</h3>
            <p>Try searching for a course number like &ldquo;225&rdquo; or a title like &ldquo;Algorithms&rdquo;.</p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map((course, idx) => (
                <Link key={course.id} to={`/courses/${course.id}`}
                      style={{ 
                        display: 'block', 
                        textDecoration: 'none',
                        padding: '1rem',
                        borderTop: idx > 0 ? '1px solid var(--border-color)' : 'none',
                        backgroundColor: 'var(--bg-card)',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.15rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {course.title || course.name}
                    </span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '0.2em 0.5em', 
                        background: 'var(--bg-secondary)', 
                        borderRadius: '3px', 
                        fontSize: '11px', 
                        color: 'var(--text-secondary)', 
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {course.subject?.code || course.subject} {course.number}
                      </span>
                      {course.gpa != null && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Avg GPA: <strong>{course.gpa.toFixed(2)}</strong></span>
                      )}
                      {course.totalStudents != null && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Grades: <strong>{course.totalStudents.toLocaleString()}</strong></span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;