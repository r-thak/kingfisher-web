import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { getCourses, getTerms, getInstructors } from '../api';
import subjectMap from '../utils/subjectMap';
import { SECTION_DETAIL_TAGS } from '../utils/sectionDetails';

const SEASON_ORDER = { spring: 1, summer: 2, fall: 3, winter: 4 };

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

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const SUBJECT_ENTRIES = Object.entries(subjectMap).map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.code.localeCompare(b.code));

function fuzzyFilterSubjects(input) {
  if (!input) return [];
  const q = input.toLowerCase().trim();
  if (q.length === 0) return [];

  // Exact or substring matches first
  const directMatches = SUBJECT_ENTRIES.filter(({ code, name }) =>
    code.toLowerCase().includes(q) || name.toLowerCase().includes(q)
  );
  if (directMatches.length > 0) {
    return directMatches.slice(0, 10);
  }

  // Off-by-one / typo tolerance (distance <= 1 on code or prefix of name)
  return SUBJECT_ENTRIES.filter(({ code, name }) => {
    const codeLower = code.toLowerCase();
    const nameLower = name.toLowerCase();
    if (Math.abs(codeLower.length - q.length) <= 1 && levenshtein(codeLower, q) <= 1) return true;
    const namePrefix = nameLower.slice(0, Math.min(nameLower.length, q.length + 1));
    return levenshtein(namePrefix, q) <= 1;
  }).slice(0, 10);
}

function Search() {
  const queryParams = useQuery();
  const searchString = queryParams.get('q') || queryParams.get('query') || '';
  const subjectStr = queryParams.get('subject') || '';
  const instructorStr = queryParams.get('instructor') || '';
  const sortStr = queryParams.get('sort') || '';
  const orderStr = queryParams.get('order') || 'desc';
  const termStr = queryParams.get('term') || '';
  const cohortStr = queryParams.get('cohort') || '';
  const filterModeStr = queryParams.get('filterMode') || 'and';

  const selectedCohorts = useMemo(
    () => cohortStr ? cohortStr.split(',').filter(Boolean) : [],
    [cohortStr]
  );

  const [results, setResults] = useState([]);
  const [availableCohorts, setAvailableCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [terms, setTerms] = useState([]);
  const navigate = useNavigate();

  // Subject autocomplete state
  const [subjectInput, setSubjectInput] = useState(
    subjectStr ? (subjectMap[subjectStr] ? `${subjectStr} — ${subjectMap[subjectStr]}` : subjectStr) : ''
  );
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectRef = useRef(null);

  // Instructor autocomplete state
  const [instructorInput, setInstructorInput] = useState(instructorStr);
  const [instructorSuggestions, setInstructorSuggestions] = useState([]);
  const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
  const instructorRef = useRef(null);

  const debouncedInstructorInput = useDebounce(instructorInput, 250);

  const subjectSuggestions = useMemo(() => fuzzyFilterSubjects(subjectInput), [subjectInput]);

  const buildSearchUrl = (overrides = {}) => {
    const state = {
      q: searchString,
      subject: subjectStr,
      instructor: instructorStr,
      sort: sortStr,
      order: orderStr,
      term: termStr,
      cohort: cohortStr,
      filterMode: filterModeStr,
      ...overrides
    };
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.subject) params.set('subject', state.subject);
    if (state.instructor) params.set('instructor', state.instructor);
    if (state.term) params.set('term', state.term);
    if (state.cohort) params.set('cohort', state.cohort);
    if (state.filterMode && state.filterMode !== 'and') params.set('filterMode', state.filterMode);
    if (state.sort) {
      params.set('sort', state.sort);
      params.set('order', state.order || 'desc');
    }
    return `/search?${params.toString()}`;
  };

  // Load available terms once and set dynamic default term
  useEffect(() => {
    getTerms()
      .then(data => {
        setTerms(data || []);
        if (data && data.length > 0) {
          const savedTerm = localStorage.getItem('selectedTerm');
          const isValidSaved = savedTerm && (savedTerm === 'all' || data.some(t => t.yearTerm === savedTerm));
          if (!termStr) {
            const termToUse = isValidSaved ? savedTerm : (data.find(t => t.isDefault)?.yearTerm || data[0].yearTerm);
            navigate(buildSearchUrl({ term: termToUse }), { replace: true });
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync termStr to localStorage
  useEffect(() => {
    if (termStr) {
      localStorage.setItem('selectedTerm', termStr);
    }
  }, [termStr]);

  // Fetch instructor suggestions as user types
  useEffect(() => {
    const q = debouncedInstructorInput.trim();
    if (q.length >= 2) {
      getInstructors({ query: q, perPage: 8 })
        .then(res => {
          const list = res.results || [];
          setInstructorSuggestions(list);
          if (list.length > 0 && document.activeElement === instructorRef.current?.querySelector('input')) {
            setInstructorDropdownOpen(true);
          }
        })
        .catch(() => setInstructorSuggestions([]));
    } else {
      setInstructorSuggestions([]);
      setInstructorDropdownOpen(false);
    }
  }, [debouncedInstructorInput]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handler = (e) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target)) {
        setSubjectDropdownOpen(false);
      }
      if (instructorRef.current && !instructorRef.current.contains(e.target)) {
        setInstructorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync inputs when URL changes externally
  useEffect(() => {
    if (subjectStr) {
      setSubjectInput(subjectMap[subjectStr] ? `${subjectStr} — ${subjectMap[subjectStr]}` : subjectStr);
    } else {
      setSubjectInput('');
    }
    setInstructorInput(instructorStr);
  }, [subjectStr, instructorStr]);

  const handleSubjectSelect = (code) => {
    setSubjectInput(subjectMap[code] ? `${code} — ${subjectMap[code]}` : code);
    setSubjectDropdownOpen(false);
    navigate(buildSearchUrl({ subject: code }));
  };

  const handleSubjectClear = () => {
    setSubjectInput('');
    setSubjectDropdownOpen(false);
    navigate(buildSearchUrl({ subject: '' }));
  };

  const handleInstructorSelect = (name) => {
    setInstructorInput(name);
    setInstructorDropdownOpen(false);
    navigate(buildSearchUrl({ instructor: name }));
  };

  const handleInstructorClear = () => {
    setInstructorInput('');
    setInstructorDropdownOpen(false);
    navigate(buildSearchUrl({ instructor: '' }));
  };

  const getCohortState = (id) => {
    if (selectedCohorts.includes(`!${id}`)) return 'exclude';
    if (selectedCohorts.includes(id)) return 'include';
    return 'none';
  };

  const handleToggleInclude = (id) => {
    const currentState = getCohortState(id);
    let next;
    if (currentState === 'include') {
      next = selectedCohorts.filter(c => c !== id && c !== `!${id}`);
    } else {
      next = [...selectedCohorts.filter(c => c !== id && c !== `!${id}`), id];
    }
    navigate(buildSearchUrl({ cohort: next.join(',') }));
  };

  const handleToggleExclude = (id) => {
    const currentState = getCohortState(id);
    let next;
    if (currentState === 'exclude') {
      next = selectedCohorts.filter(c => c !== id && c !== `!${id}`);
    } else {
      next = [...selectedCohorts.filter(c => c !== id && c !== `!${id}`), `!${id}`];
    }
    navigate(buildSearchUrl({ cohort: next.join(',') }));
  };

  const toggleFilterMode = () => {
    const nextMode = filterModeStr === 'or' ? 'and' : 'or';
    navigate(buildSearchUrl({ filterMode: nextMode }));
  };

  const handleTermChange = (e) => {
    const val = e.target.value;
    localStorage.setItem('selectedTerm', val);
    navigate(buildSearchUrl({ term: val }));
  };

  const clearAllFilters = () => {
    navigate(buildSearchUrl({
      subject: '',
      instructor: '',
      cohort: '',
      filterMode: 'and'
    }));
    setSubjectInput('');
    setInstructorInput('');
  };

  // Perform search
  useEffect(() => {
    setLoading(true);
    setError(null);
    let params = {};
    if (searchString) params.query = searchString;
    if (subjectStr) params.subject = subjectStr;
    if (instructorStr) params.instructor = instructorStr;
    if (termStr && termStr !== 'all') params.term = termStr;
    if (selectedCohorts.length > 0) params.cohort = selectedCohorts.join(',');
    if (filterModeStr) params.filterMode = filterModeStr;
    if (sortStr) {
      params.sort = sortStr;
      params.order = orderStr;
    }

    getCourses(params)
      .then(data => {
        const items = data.results || [];
        setResults(items);
        setTotalCount(data.totalCount || items.length);
        setAvailableCohorts(data.availableCohorts || []);
      })
      .catch(err => {
        console.error(err);
        setError('The server is currently unreachable. Please ensure the backend API is running.');
      })
      .finally(() => setLoading(false));
  }, [searchString, subjectStr, instructorStr, sortStr, orderStr, termStr, selectedCohorts, filterModeStr]);

  const handleSortChange = (e) => {
    const [newSort, newOrder] = e.target.value.split('-');
    navigate(buildSearchUrl({ sort: newSort, order: newOrder }));
  };

  const currentSortValue = sortStr ? `${sortStr}-${orderStr}` : (searchString ? 'match-desc' : 'popularity-desc');

  const termOptions = useMemo(() => {
    const sorted = [...terms].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (SEASON_ORDER[b.season?.toLowerCase()] || 0) - (SEASON_ORDER[a.season?.toLowerCase()] || 0);
    });
    return sorted;
  }, [terms]);

  // Contextual filtering: hide non-relevant pills from search view
  const availableSearchTags = useMemo(() => {
    const activeBaseIds = new Set(selectedCohorts.map(c => c.replace(/^!/, '')));
    if (availableCohorts.length === 0 && results.length === 0) {
      return SECTION_DETAIL_TAGS.filter(t => activeBaseIds.has(t.id));
    }
    if (availableCohorts.length > 0) {
      const availSet = new Set(availableCohorts);
      return SECTION_DETAIL_TAGS.filter(tag => availSet.has(tag.id) || activeBaseIds.has(tag.id));
    }
    return SECTION_DETAIL_TAGS;
  }, [availableCohorts, selectedCohorts, results.length]);

  const inputStyle = {
    flex: 1,
    padding: '0.6em 1em',
    borderRadius: '4px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    outline: 'none'
  };

  const hasAnyFilter = Boolean(subjectStr || instructorStr || termStr || cohortStr);

  return (
    <div className="Search">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="large-header" style={{ margin: 0 }}>
          Search Results
          <div className="sub-header">
            Showing {totalCount} courses for: <strong>{searchString || subjectStr || instructorStr || 'All'}</strong>
          </div>
        </h1>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Semester / Term Selector */}
          <select
            value={termStr || 'all'}
            onChange={handleTermChange}
            style={{
              padding: '0.45em 0.85em',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Semesters</option>
            {termOptions.map(t => (
              <option key={t.yearTerm} value={t.yearTerm}>
                {t.season ? `${t.season} ${t.year}` : t.yearTerm} {t.isDefault ? '(Latest)' : ''}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={currentSortValue}
            onChange={handleSortChange}
            style={{
              padding: '0.45em 0.85em',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="match-desc">Closest Match</option>
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
      </div>

      {/* Primary search filters (Subject & Instructor with Autocomplete) */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif', flexWrap: 'wrap' }}>
        {/* Subject autocomplete */}
        <div ref={subjectRef} style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Filter by subject (e.g. CS, MATH, ECE)..."
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
                  <span style={{ fontWeight: 700, color: '#e94b26', minWidth: '45px' }}>{code}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructor autocomplete */}
        <div ref={instructorRef} style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Filter by instructor (e.g. Erickson, Fleck)..."
              value={instructorInput}
              onChange={e => {
                setInstructorInput(e.target.value);
                setInstructorDropdownOpen(true);
              }}
              onFocus={() => {
                if (instructorSuggestions.length > 0) setInstructorDropdownOpen(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setInstructorDropdownOpen(false);
                  navigate(buildSearchUrl({ instructor: instructorInput.trim() }));
                }
              }}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingRight: instructorStr ? '2rem' : '1em' }}
            />
            {instructorStr && (
              <button
                onClick={handleInstructorClear}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px',
                  color: 'var(--text-secondary)', lineHeight: 1, padding: '0'
                }}
                title="Clear instructor filter"
              >✕</button>
            )}
          </div>
          {instructorDropdownOpen && instructorSuggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderTop: 'none', borderRadius: '0 0 4px 4px',
              maxHeight: '220px', overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
            }}>
              {instructorSuggestions.map(inst => (
                <div
                  key={inst.id}
                  onMouseDown={() => handleInstructorSelect(inst.name)}
                  style={{
                    padding: '0.5em 1em', cursor: 'pointer', fontSize: '13px',
                    color: 'var(--text-primary)'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = ''}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inst.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cohorts & Details Filter Pills (Unified Blue Highlight + Thinner '!' NOT button) */}
      {availableSearchTags.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem', fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginRight: '0.25em' }}>
              Cohorts &amp; Details:
            </span>
            {availableSearchTags.map(tag => {
              const state = getCohortState(tag.id);
              const isIncluded = state === 'include';
              const isExcluded = state === 'exclude';

              let bg = 'var(--bg-secondary)';
              let border = 'var(--border-color)';
              let textColor = 'var(--text-secondary)';
              let notBtnBg = 'var(--bg-card)'; // Same color as website/card background so not filled in
              let notBtnBorder = '1px solid var(--border-color)';
              let notBtnColor = 'var(--text-secondary)';

              if (isIncluded) {
                bg = '#2563eb'; // Blue highlight
                border = '#2563eb';
                textColor = '#ffffff';
                notBtnBg = 'var(--bg-card)'; // Website background so it doesn't look filled in
                notBtnBorder = '1px solid rgba(255, 255, 255, 0.4)';
                notBtnColor = '#2563eb';
              } else if (isExcluded) {
                bg = 'rgba(220, 38, 38, 0.08)';
                border = '#dc2626';
                textColor = '#dc2626';
                notBtnBg = '#dc2626'; // When it's filled in, it should be red
                notBtnBorder = '1px solid #dc2626';
                notBtnColor = '#ffffff';
              }

              return (
                <span
                  key={tag.id}
                  onClick={() => handleToggleInclude(tag.id)}
                  title={isExcluded ? `NOT ${tag.label} (excluded) - click label to include` : isIncluded ? `${tag.label} (included) - click label to remove` : `Click to include ${tag.label}`}
                  style={{
                    padding: '0.2em 0.7em 0.2em 0.35em',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: `1px solid ${border}`,
                    backgroundColor: bg,
                    color: textColor,
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleExclude(tag.id);
                    }}
                    title={isExcluded ? `Remove NOT filter for ${tag.label}` : `Exclude (NOT ${tag.label})`}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: notBtnBorder,
                      backgroundColor: notBtnBg,
                      color: notBtnColor,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '400', // Thinner '!'
                      cursor: 'pointer',
                      padding: 0,
                      lineHeight: 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    !
                  </button>
                  <span style={{ textDecoration: isExcluded ? 'line-through' : 'none' }}>
                    {isExcluded ? `NOT ${tag.label}` : tag.label}
                  </span>
                </span>
              );
            })}
          </div>

          {/* Filter Summary & AND/OR Logic Toggle */}
          {hasAnyFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', userSelect: 'text' }}>
                Active filters combined with{' '}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={toggleFilterMode}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleFilterMode(); }}
                  title={`Click to switch to ${filterModeStr === 'or' ? 'AND' : 'OR'} logic`}
                  style={{
                    color: '#2563eb',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    userSelect: 'text'
                  }}
                >
                  {filterModeStr.toUpperCase()}
                </span>{' '}
                logic. (Click to switch)
              </span>

              <button
                onClick={clearAllFilters}
                style={{
                  padding: '0.25em 0.6em',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'transparent',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear all filters
              </button>
            </div>
          )}


        </div>
      )}


      {/* Results List */}
      <div style={{ fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
            <div className="loader"></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Searching Courses...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#721c24', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>API Error</h3>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No results found</h3>
            <p>Try adjusting your search criteria or clearing some filter pills.</p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
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
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
