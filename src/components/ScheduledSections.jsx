import React, { useEffect, useMemo, useState } from 'react';
import { getTerms, getScheduledSections, refreshCourseSections, getCourseRefreshStatus } from '../api';
import { SECTION_DETAIL_TAGS, getSectionTags } from '../utils/sectionDetails';

const SEASON_ORDER = { spring: 1, summer: 2, fall: 3, winter: 4 };

const CARD_STYLE = {
  padding: '1.5rem',
  border: '1px solid var(--border-color)',
  borderRadius: '0.28571429rem',
  backgroundColor: 'var(--bg-card)',
  marginBottom: '1.5rem',
  fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif'
};

const TABLE = {
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: '0.28571429rem' },
  th: { padding: '0.78571429em', fontWeight: '700', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' },
  td: { padding: '0.71428571em 0.78571429em', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)', verticalAlign: 'top' }
};

const PILL_BASE = {
  padding: '0.3em 0.75em',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  border: '1px solid var(--border-color)',
  userSelect: 'none',
  transition: 'all 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem'
};

function simplePillStyle(active) {
  if (active) {
    return {
      ...PILL_BASE,
      backgroundColor: '#2563eb', // Blue highlight
      borderColor: '#2563eb',
      color: '#fff'
    };
  }
  return {
    ...PILL_BASE,
    backgroundColor: 'var(--bg-secondary)',
    borderColor: 'var(--border-color)',
    color: 'var(--text-secondary)'
  };
}


function formatDays(days) {
  if (!days || days === 'n.a.') return 'TBA';
  return days;
}

function formatTime(start, end) {
  if (!start || start === 'ARRANGED') return 'Arranged';
  if (!end) return start;
  return `${start} - ${end}`;
}

function formatLocation(m) {
  if (!m.buildingName || m.buildingName === 'n.a.') return m.typeCode === 'ONL' ? 'Online' : 'TBA';
  return m.roomNumber ? `${m.buildingName} ${m.roomNumber}` : m.buildingName;
}

function sectionInstructors(section) {
  const names = new Map();
  section.meetings.forEach(m => (m.instructors || []).forEach(i => names.set(i.id, i.name)));
  return Array.from(names.values());
}

function sectionTypes(section) {
  const types = new Map();
  section.meetings.forEach(m => {
    if (m.typeCode) types.set(m.typeCode, m.typeDescription || m.typeCode);
  });
  return types;
}

function sectionHasInPerson(section) {
  return section.meetings.some(m => m.typeCode !== 'ONL');
}

function formatLastRefreshed(lastRefreshedAt) {
  if (!lastRefreshedAt) return null;
  const dt = new Date(lastRefreshedAt);
  const diffSecs = Math.floor((Date.now() - dt.getTime()) / 1000);
  if (diffSecs < 60) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}


export default function ScheduledSections({ courseId }) {
  const [terms, setTerms] = useState([]);
  const [selectedYearTerm, setSelectedYearTerm] = useState(() => {
    const saved = localStorage.getItem('selectedTerm');
    return (saved && saved !== 'all') ? saved : '';
  });
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters (combinable via AND or OR logic, supports '!' negation)
  const [typeFilters, setTypeFilters] = useState(new Set());
  const [modalityFilter, setModalityFilter] = useState('all'); // all | in-person | online
  const [detailFilters, setDetailFilters] = useState(new Set()); // Tag IDs (e.g. 'undergrad', '!coursera')
  const [detailFilterMode, setDetailFilterMode] = useState('and'); // 'and' | 'or'
  const [searchQuery, setSearchQuery] = useState('');

  // Rescrape / Refresh state
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [refreshMessage, setRefreshMessage] = useState(null);

  // Pre-calculate tags for each section
  const sectionTagMap = useMemo(() => {
    const map = new Map();
    sections.forEach(s => {
      map.set(s.id, getSectionTags(s));
    });
    return map;
  }, [sections]);

  // Load terms and select default
  useEffect(() => {
    getTerms()
      .then(data => {
        setTerms(data || []);
        if (data && data.length > 0) {
          const savedTerm = localStorage.getItem('selectedTerm');
          const isValidSaved = savedTerm && savedTerm !== 'all' && data.some(t => t.yearTerm === savedTerm);
          if (isValidSaved) {
            setSelectedYearTerm(savedTerm);
          } else if (!selectedYearTerm || !data.some(t => t.yearTerm === selectedYearTerm)) {
            const defaultTerm = data.find(t => t.isDefault) || data[0];
            setSelectedYearTerm(defaultTerm.yearTerm);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Load sections for the selected term
  useEffect(() => {
    if (!selectedYearTerm) return;
    setLoading(true);
    setError(null);
    getScheduledSections(courseId, selectedYearTerm)
      .then(data => {
        setSections(data || []);
        setTypeFilters(new Set());
        setModalityFilter('all');
        setDetailFilters(new Set());
        setSearchQuery('');
      })
      .catch(err => {
        if (err?.response?.status === 404) {
          setSections([]);
        } else {
          setError('Could not load scheduled sections.');
        }
      })
      .finally(() => setLoading(false));

    // Fetch refresh status
    getCourseRefreshStatus(courseId, selectedYearTerm)
      .then(status => {
        setRefreshStatus(status);
        setTimeRemaining(status.secondsRemaining || 0);
      })
      .catch(() => {});
  }, [courseId, selectedYearTerm]);

  // Cooldown countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleManualRefresh = async () => {
    if (timeRemaining > 0 || refreshing) return;
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const result = await refreshCourseSections(courseId, selectedYearTerm);
      setRefreshStatus(result);
      setTimeRemaining(result.secondsRemaining || 900);
      setRefreshMessage(result.message);
      // Reload sections
      const freshSections = await getScheduledSections(courseId, selectedYearTerm);
      setSections(freshSections || []);
    } catch (err) {
      setRefreshMessage('Failed to refresh sections from Course Explorer.');
    } finally {
      setRefreshing(false);
    }
  };

  // Distinct section types available in current course sections (relevant only)
  const availableTypes = useMemo(() => {
    const map = new Map();
    sections.forEach(s => sectionTypes(s).forEach((desc, code) => map.set(code, desc)));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [sections]);

  // Detail tags present in this course's sections (relevant only)
  const availableDetailTags = useMemo(() => {
    const presentTagIds = new Set();
    sections.forEach(s => {
      const tags = sectionTagMap.get(s.id) || [];
      tags.forEach(t => presentTagIds.add(t.id));
    });
    const activeBaseIds = new Set(Array.from(detailFilters).map(id => id.replace(/^!/, '')));
    return SECTION_DETAIL_TAGS.filter(t => presentTagIds.has(t.id) || activeBaseIds.has(t.id));
  }, [sections, sectionTagMap, detailFilters]);

  // Modality check (only show if mixed modalities exist)
  const hasInPerson = useMemo(() => sections.some(s => sectionHasInPerson(s)), [sections]);
  const hasOnline = useMemo(() => sections.some(s => s.meetings.some(m => m.typeCode === 'ONL')), [sections]);
  const showModalityFilter = hasInPerson && hasOnline;

  // Tag helper
  const getDetailTagState = (id) => {
    if (detailFilters.has(`!${id}`)) return 'exclude';
    if (detailFilters.has(id)) return 'include';
    return 'none';
  };

  const toggleDetailInclude = (id) => {
    setDetailFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.delete(`!${id}`);
        next.add(id);
      }
      return next;
    });
  };

  const toggleDetailExclude = (id) => {
    setDetailFilters(prev => {
      const next = new Set(prev);
      if (next.has(`!${id}`)) {
        next.delete(`!${id}`);
      } else {
        next.delete(id);
        next.add(`!${id}`);
      }
      return next;
    });
  };

  // Filtering Logic (with AND/OR support & NOT exclusion)
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const positiveDetailTags = Array.from(detailFilters).filter(id => !id.startsWith('!'));
    const negativeDetailTags = Array.from(detailFilters).filter(id => id.startsWith('!')).map(id => id.slice(1));

    return sections.filter(s => {
      // 1. Section Type
      if (typeFilters.size > 0) {
        const types = sectionTypes(s);
        const matchesType = Array.from(types.keys()).some(code => typeFilters.has(code));
        if (!matchesType) return false;
      }

      // 2. Modality
      if (modalityFilter === 'online' && !s.meetings.some(m => m.typeCode === 'ONL')) return false;
      if (modalityFilter === 'in-person' && !sectionHasInPerson(s)) return false;

      // 3. Detail Tag Filters (positive and negative NOT logic)
      if (detailFilters.size > 0) {
        const tags = sectionTagMap.get(s.id) || [];
        const tagIdSet = new Set(tags.map(t => t.id));

        // Negative check: must NOT have any negative tags
        if (negativeDetailTags.some(negId => tagIdSet.has(negId))) {
          return false;
        }

        // Positive check:
        if (positiveDetailTags.length > 0) {
          if (detailFilterMode === 'and') {
            for (const requiredTagId of positiveDetailTags) {
              if (!tagIdSet.has(requiredTagId)) return false;
            }
          } else {
            const hasAny = positiveDetailTags.some(id => tagIdSet.has(id));
            if (!hasAny) return false;
          }
        }
      }

      // 4. Free-text Search Query
      if (q) {
        const notesText = (s.notes || '').toLowerCase();
        const secNum = (s.sectionNumber || '').toLowerCase();
        const crn = (s.crn || '').toLowerCase();
        const instrs = sectionInstructors(s).join(' ').toLowerCase();
        const locs = s.meetings.map(m => `${m.buildingName || ''} ${m.roomNumber || ''}`).join(' ').toLowerCase();
        const tagLabels = (sectionTagMap.get(s.id) || []).map(t => t.label.toLowerCase()).join(' ');

        const match = notesText.includes(q) ||
          secNum.includes(q) ||
          crn.includes(q) ||
          instrs.includes(q) ||
          locs.includes(q) ||
          tagLabels.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [sections, typeFilters, modalityFilter, detailFilters, detailFilterMode, searchQuery, sectionTagMap]);

  const toggleType = (code) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const toggleDetailFilterMode = () => {
    setDetailFilterMode(prev => prev === 'and' ? 'or' : 'and');
  };

  const clearAllFilters = () => {
    setTypeFilters(new Set());
    setModalityFilter('all');
    setDetailFilters(new Set());
    setSearchQuery('');
  };

  const hasActiveFilters = typeFilters.size > 0 || modalityFilter !== 'all' || detailFilters.size > 0 || searchQuery.trim() !== '';

  const termOptions = useMemo(() => {
    const sorted = [...terms].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (SEASON_ORDER[b.season?.toLowerCase()] || 0) - (SEASON_ORDER[a.season?.toLowerCase()] || 0);
    });
    return sorted;
  }, [terms]);

  const cooldownMinutes = Math.ceil(timeRemaining / 60);

  return (
    <div style={CARD_STYLE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Scheduled Sections</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Live schedule data from the UIUC Course Explorer
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Manual Rescrape / Live Sync Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleManualRefresh}
              disabled={timeRemaining > 0 || refreshing}
              title={timeRemaining > 0 ? `Rate limited. Please wait ${cooldownMinutes}m before refreshing again.` : 'Check live Course Explorer for updated sections & open seats'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45em 0.85em',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                backgroundColor: timeRemaining > 0 ? 'var(--bg-secondary)' : 'var(--bg-card)',
                color: timeRemaining > 0 ? 'var(--text-secondary)' : 'var(--accent-red)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: timeRemaining > 0 || refreshing ? 'not-allowed' : 'pointer',
                opacity: timeRemaining > 0 ? 0.75 : 1
              }}
            >
              {refreshing ? (
                <>
                  <div className="ui active mini inline loader" style={{ margin: 0 }}></div>
                  <span>Syncing...</span>
                </>
              ) : timeRemaining > 0 ? (
                <>
                  <span>⏱ Cooldown ({cooldownMinutes}m)</span>
                </>
              ) : (
                <>
                  <span>↻ Check Live Status</span>
                </>
              )}
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {refreshStatus?.lastRefreshedAt ? `Last checked: ${formatLastRefreshed(refreshStatus.lastRefreshedAt)}` : 'Last checked: Not checked yet'}
            </span>
          </div>


          {/* Semester Selector */}
          <select
            value={selectedYearTerm}
            onChange={e => {
              const val = e.target.value;
              setSelectedYearTerm(val);
              localStorage.setItem('selectedTerm', val);
            }}
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
            {termOptions.map(t => (
              <option key={t.yearTerm} value={t.yearTerm}>
                {t.season ? `${t.season} ${t.year}` : t.yearTerm} {t.isDefault ? '(Latest)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {refreshMessage && (
        <div style={{
          padding: '0.6em 1em',
          marginBottom: '1rem',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(37, 99, 235, 0.3)',
          color: 'var(--text-primary)'
        }}>
          {refreshMessage}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loader"></div>
        </div>
      ) : error ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{error}</p>
      ) : sections.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          No scheduled section data for this term yet. Click &ldquo;Check Live Status&rdquo; above to query Course Explorer.
        </p>
      ) : (
        <>
          {/* Filter Bar Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {/* Row 1: Section Types & Modality (Unified pill styling) */}
            {(availableTypes.length > 0 || showModalityFilter) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {availableTypes.length > 0 && (
                  <>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
                      Type:
                    </span>
                    {availableTypes.map(([code, desc]) => (
                      <span
                        key={code}
                        title={desc}
                        style={simplePillStyle(typeFilters.has(code))}
                        onClick={() => toggleType(code)}
                      >
                        {desc}
                      </span>
                    ))}
                  </>
                )}

                {showModalityFilter && (
                  <>
                    <span style={{ width: '1px', height: '18px', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
                      Modality:
                    </span>
                    {['all', 'in-person', 'online'].map(m => (
                      <span
                        key={m}
                        style={simplePillStyle(modalityFilter === m)}
                        onClick={() => setModalityFilter(m)}
                      >
                        {m === 'all' ? 'All' : m === 'in-person' ? 'In-Person' : 'Online'}
                      </span>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Row 2: Detail & Restriction Filters with Blue Highlight + Thinner '!' NOT Button */}
            {availableDetailTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
                  Cohorts &amp; Details:
                </span>
                {availableDetailTags.map(tag => {
                  const state = getDetailTagState(tag.id);
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
                      onClick={() => toggleDetailInclude(tag.id)}
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
                          toggleDetailExclude(tag.id);
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

                {detailFilters.size > 1 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '0.25rem', userSelect: 'text' }}>
                    (combined with{' '}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={toggleDetailFilterMode}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleDetailFilterMode(); }}
                      title={`Click to switch to ${detailFilterMode === 'and' ? 'OR' : 'AND'} logic`}
                      style={{
                        color: '#2563eb',
                        fontWeight: '700',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: '2px',
                        userSelect: 'text'
                      }}
                    >
                      {detailFilterMode.toUpperCase()}
                    </span>{' '}
                    logic)
                  </span>
                )}


              </div>
            )}


            {/* Row 3: Live search and Clear filters */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Filter by notes, section #, CRN, room, or instructor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '0.5em 0.85em',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: '0.45em 0.85em',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--accent-red)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear filters
                </button>
              )}

              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing {filteredSections.length} of {sections.length} sections
              </span>
            </div>
          </div>

          {/* Section Table */}
          {filteredSections.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
              No sections match the current filters. Click &ldquo;Clear filters&rdquo; to see all sections.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={TABLE.table}>
                <thead>
                  <tr>
                    <th style={{ ...TABLE.th, width: '70px' }}>Section</th>
                    <th style={{ ...TABLE.th, width: '80px' }}>Status</th>
                    <th style={{ ...TABLE.th, width: '75px' }}>CRN</th>
                    <th style={{ ...TABLE.th, width: '130px' }}>Type</th>
                    <th style={{ ...TABLE.th, width: '120px' }}>Time</th>
                    <th style={{ ...TABLE.th, width: '60px' }}>Days</th>
                    <th style={{ ...TABLE.th, width: '140px' }}>Location</th>
                    <th style={{ ...TABLE.th, width: '150px' }}>Instructor</th>
                    <th style={TABLE.th}>Details &amp; Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSections.map(s => {
                    const instrs = sectionInstructors(s);
                    const tags = sectionTagMap.get(s.id) || [];
                    const secTypes = Array.from(sectionTypes(s).values());
                    const isClosed = s.statusCode === 'C';
                    const isPending = s.statusCode === 'P';

                    return (
                      <tr key={s.id}>
                        <td style={{ ...TABLE.td, fontWeight: '700', color: 'var(--text-primary)' }}>
                          {s.sectionNumber}
                        </td>
                        <td style={TABLE.td}>
                          {isClosed ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.15em 0.5em',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: 'rgba(220, 38, 38, 0.1)',
                              color: '#dc2626',
                              border: '1px solid rgba(220, 38, 38, 0.25)'
                            }}>
                              Closed
                            </span>
                          ) : isPending ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.15em 0.5em',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: 'rgba(202, 138, 4, 0.1)',
                              color: '#ca8a04',
                              border: '1px solid rgba(202, 138, 4, 0.25)'
                            }}>
                              Pending
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '0.15em 0.5em',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: 'rgba(22, 163, 74, 0.1)',
                              color: '#16a34a',
                              border: '1px solid rgba(22, 163, 74, 0.25)'
                            }}>
                              Open
                            </span>
                          )}
                        </td>

                        <td style={{ ...TABLE.td, fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {s.crn}
                        </td>
                        <td style={TABLE.td}>
                          {secTypes.length > 0 ? secTypes.join(', ') : '—'}
                        </td>
                        <td style={TABLE.td}>
                          {s.meetings.map((m, i) => (
                            <div key={i}>{formatTime(m.startTime, m.endTime)}</div>
                          ))}
                        </td>
                        <td style={TABLE.td}>
                          {s.meetings.map((m, i) => (
                            <div key={i}>{formatDays(m.daysOfWeek)}</div>
                          ))}
                        </td>
                        <td style={TABLE.td}>
                          {s.meetings.map((m, i) => (
                            <div key={i}>{formatLocation(m)}</div>
                          ))}
                        </td>
                        <td style={TABLE.td}>
                          {instrs.length > 0 ? instrs.join(', ') : 'TBA'}
                        </td>
                        <td style={TABLE.td}>

                          {/* Tags */}
                          {tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: s.notes ? '0.4rem' : 0 }}>
                              {tags.map(t => (
                                <span
                                  key={t.id}
                                  onClick={() => toggleDetailInclude(t.id)}
                                  title={`Click to filter by ${t.label}`}
                                  style={{
                                    display: 'inline-block',
                                    padding: '0.15em 0.5em',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    backgroundColor: t.bgColor,
                                    color: t.color,
                                    border: `1px solid ${t.borderColor}`,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {t.badgeText || t.label}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Section Notes text */}
                          {s.notes && (
                            <div style={{
                              fontSize: '12px',
                              lineHeight: '1.4',
                              color: 'var(--text-secondary)',
                              whiteSpace: 'pre-wrap',
                              maxHeight: '120px',
                              overflowY: 'auto'
                            }}>
                              {s.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
