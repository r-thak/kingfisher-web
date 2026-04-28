import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../api';
import subjectMap from '../utils/subjectMap';

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

// Build a sorted list of subject entries for the autocomplete
const SUBJECT_ENTRIES = Object.entries(subjectMap).map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.code.localeCompare(b.code));

function fuzzyFilterSubjects(input) {
  if (!input) return [];
  const q = input.toLowerCase().trim();
  return SUBJECT_ENTRIES.filter(({ code, name }) =>
    code.toLowerCase().includes(q) ||
    name.toLowerCase().includes(q)
  ).slice(0, 10);
}

function Search() {
  const queryParams = useQuery();
  const searchString = queryParams.get('q') || queryParams.get('query') || '';
  const subjectStr = queryParams.get('subject') || '';
  const instructorStr = queryParams.get('instructor') || '';
  const sortStr = queryParams.get('sort') || '';
  const orderStr = queryParams.get('order') || 'desc';

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  // Subject autocomplete state
  const [subjectInput, setSubjectInput] = useState(
    subjectStr ? (subjectMap[subjectStr] ? `${subjectStr} — ${subjectMap[subjectStr]}` : subjectStr) : ''
  );
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectRef = useRef(null);

  // Instructor filter state
  const [localInstructor, setLocalInstructor] = useState(instructorStr);
  const debouncedInstructor = useDebounce(localInstructor, 400);

  const subjectSuggestions = useMemo(() => fuzzyFilterSubjects(subjectInput), [subjectInput]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target)) {
        setSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync subject input when URL changes externally
  useEffect(() => {
    if (subjectStr) {
      setSubjectInput(subjectMap[subjectStr] ? `${subjectStr} — ${subjectMap[subjectStr]}` : subjectStr);
    } else {
      setSubjectInput('');
    }
    setLocalInstructor(instructorStr);
  }, [subjectStr, instructorStr]);

  // Update URL when debounced instructor changes
  useEffect(() => {
    const isInstructorValid = debouncedInstructor.length === 0 || debouncedInstructor.length >= 3;
    if (isInstructorValid && debouncedInstructor !== instructorStr) {
      const q = searchString ? `&q=${encodeURIComponent(searchString)}` : '';
      const sortParams = sortStr ? `&sort=${sortStr}&order=${orderStr}` : '';
      const subjParams = subjectStr ? `&subject=${encodeURIComponent(subjectStr)}` : '';
      const instParams = debouncedInstructor ? `&instructor=${encodeURIComponent(debouncedInstructor)}` : '';
      navigate(`/search?${q}${subjParams}${instParams}${sortParams}`);
    }
  }, [debouncedInstructor, instructorStr, searchString, sortStr, orderStr, subjectStr, navigate]);

  const handleSubjectSelect = (code) => {
    setSubjectInput(subjectMap[code] ? `${code} — ${subjectMap[code]}` : code);
    setSubjectDropdownOpen(false);
    const q = searchString ? `&q=${encodeURIComponent(searchString)}` : '';
    const sortParams = sortStr ? `&sort=${sortStr}&order=${orderStr}` : '';
    const instParams = localInstructor ? `&instructor=${encodeURIComponent(localInstructor)}` : '';
    navigate(`/search?subject=${encodeURIComponent(code)}${q}${instParams}${sortParams}`);
  };

  const handleSubjectClear = () => {
    setSubjectInput('');
    setSubjectDropdownOpen(false);
    const q = searchString ? `&q=${encodeURIComponent(searchString)}` : '';
    const sortParams = sortStr ? `&sort=${sortStr}&order=${orderStr}` : '';
    const instParams = localInstructor ? `&instructor=${encodeURIComponent(localInstructor)}` : '';
    navigate(`/search?${q}${instParams}${sortParams}`);
  };

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

  const inputStyle = {
    flex: 1,
    padding: '0.6em 1em',
    borderRadius: '2px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    outline: 'none'
  };

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

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif', flexWrap: 'wrap' }}>
        {/* Subject autocomplete */}
        <div ref={subjectRef} style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Filter by subject..."
              value={subjectInput}
              onChange={e => {
                setSubjectInput(e.target.value);
                setSubjectDropdownOpen(true);
              }}
              onFocus={() => setSubjectDropdownOpen(true)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingRight: subjectStr ? '2rem' : '1em' }}
            />
            {subjectStr && (
              <button
                onClick={handleSubjectClear}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px',
                  color: 'var(--text-secondary)', lineHeight: 1, padding: '0'
                }}
                title="Clear subject filter"
              >✕</button>
            )}
          </div>
          {subjectDropdownOpen && subjectSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderTop: 'none', borderRadius: '0 0 4px 4px',
              maxHeight: '220px', overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}>
              {subjectSuggestions.map(({ code, name }) => (
                <div
                  key={code}
                  onMouseDown={() => handleSubjectSelect(code)}
                  style={{
                    padding: '0.5em 1em', cursor: 'pointer', fontSize: '13px',
                    color: 'var(--text-primary)', display: 'flex', gap: '0.5em', alignItems: 'baseline'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = ''}
                >
                  <span style={{ fontWeight: 700, color: '#983220', minWidth: '45px' }}>{code}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructor filter */}
        <input
          type="text"
          placeholder="Filter by instructor..."
          value={localInstructor}
          onChange={e => setLocalInstructor(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
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
          <option value="popularity-desc">Popularity ↓</option>
          <option value="popularity-asc">Popularity ↑</option>
          <option value="gpa-desc">GPA ↓</option>
          <option value="gpa-asc">GPA ↑</option>
          <option value="total_grades-desc">Total Grades ↓</option>
          <option value="total_grades-asc">Total Grades ↑</option>
          <option value="name-asc">Course Name A→Z</option>
          <option value="name-desc">Course Name Z→A</option>
          <option value="number-asc">Course # Low→High</option>
          <option value="number-desc">Course # High→Low</option>
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