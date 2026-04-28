import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { exploreSubjects, exploreCourses, exploreInstructors } from '../api';
import Pagination from '../components/Pagination';
import subjectMap from '../utils/subjectMap';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const TABLE_STYLES = {
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    textAlign: 'left', 
    fontSize: '14px', 
    fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif',
    border: '1px solid rgba(34,36,38,.15)',
    borderRadius: '0.28571429rem'
  },
  th: { 
    padding: '0.92857143em 0.78571429em', 
    fontWeight: '700', 
    color: 'var(--text-primary)', 
    backgroundColor: 'var(--bg-secondary)', 
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    userSelect: 'none'
  },
  td: { 
    padding: '0.78571429em', 
    borderTop: '1px solid var(--border-color)',
    color: 'var(--text-primary)'
  },
  tdRight: { 
    padding: '0.78571429em', 
    borderTop: '1px solid var(--border-color)', 
    textAlign: 'right', 
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums'
  },
  link: { 
    textDecoration: 'none', 
    color: 'var(--text-primary)'
  },
  pill: { 
    display: 'inline-block', 
    padding: '0.2em 0.5em', 
    background: 'rgba(0, 0, 0, 0.05)', 
    borderRadius: '3px', 
    fontSize: '11px', 
    marginTop: '4px', 
    color: 'var(--text-secondary)', 
    fontWeight: '700',
    textTransform: 'uppercase'
  }
};

function Explore() {
  const navigate = useNavigate();
  const queryParams = useQuery();

  const activeTab = queryParams.get('tab') || 'subjects';
  const currentPage = parseInt(queryParams.get('page') || '1', 10);
  const sort = queryParams.get('sort') || 'totalStudents';
  const order = queryParams.get('order') || 'desc';
  const filterSubject = queryParams.get('subject') || '';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // For the filter dropdown
  const [subjectsList, setSubjectsList] = useState([]);

  useEffect(() => {
    // Load subjects for filter if needed
    if (activeTab === 'courses' || activeTab === 'instructors') {
       exploreSubjects({ perPage: 200, sort: 'subjectCode', order: 'asc' })
         .then(res => setSubjectsList(res.results || []))
         .catch(console.error);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    setData([]);

    const params = { page: currentPage, perPage: 25, sort, order };
    if (filterSubject && (activeTab === 'courses' || activeTab === 'instructors')) {
      params.subject = filterSubject;
    }

    const fetcher =
      activeTab === 'subjects' ? exploreSubjects :
      activeTab === 'courses' ? exploreCourses :
      exploreInstructors;

    fetcher(params)
      .then(res => {
        setData(res.results || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab, currentPage, sort, order, filterSubject]);

  const handleTabChange = (tab) => navigate(`/explore?tab=${tab}&page=1`);
  const handlePageChange = (page) => navigate(`/explore?tab=${activeTab}&page=${page}&sort=${sort}&order=${order}${filterSubject ? `&subject=${filterSubject}` : ''}`);
  
  const handleSort = (column) => {
    const newOrder = sort === column && order === 'desc' ? 'asc' : 'desc';
    navigate(`/explore?tab=${activeTab}&page=1&sort=${column}&order=${newOrder}${filterSubject ? `&subject=${filterSubject}` : ''}`);
  };

  const handleFilterChange = (e) => {
    const newSubject = e.target.value;
    navigate(`/explore?tab=${activeTab}&page=1&sort=${sort}&order=${order}${newSubject ? `&subject=${newSubject}` : ''}`);
  };

  const renderTh = (label, column, isRight) => {
    const isSorted = sort === column;
    return (
      <th 
        onClick={() => handleSort(column)}
        style={{ 
          ...TABLE_STYLES.th, 
          textAlign: isRight ? 'right' : 'left'
        }}
      >
        {label}
        {isSorted && (
          <span style={{ marginLeft: '4px', fontSize: '0.8em' }}>
            {order === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </th>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="loader"></div>
        </div>
      );
    }

    if (data.length === 0) {
      return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No results found.</div>;
    }

    if (activeTab === 'subjects') {
      return (
        <table style={TABLE_STYLES.table}>
          <thead>
            <tr>
              {renderTh('Subject', 'subjectCode', false)}
              {renderTh('Avg. # Grades', 'avgStudents', true)}
              {renderTh('Total # Grades', 'totalStudents', true)}
              {renderTh('Avg. GPA', 'gpa', true)}
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
              const code = item.subject?.code || '';
              const fullName = subjectMap[code] || code;
              return (
                <tr key={code} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={TABLE_STYLES.td}>
                    <Link to={`/search?subject=${code}`} style={TABLE_STYLES.link}>{fullName}</Link>
                  </td>
                  <td style={TABLE_STYLES.tdRight}>{item.avgStudents != null ? Math.round(item.avgStudents).toLocaleString() : '-'}</td>
                  <td style={TABLE_STYLES.tdRight}>{item.totalStudents != null ? item.totalStudents.toLocaleString() : '-'}</td>
                  <td style={TABLE_STYLES.tdRight}>{item.gpa != null ? item.gpa.toFixed(2) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'courses') {
      return (
        <table style={TABLE_STYLES.table}>
          <thead>
            <tr>
              {renderTh('Course', 'courseNumber', false)}
              {renderTh('Avg. # Grades', 'avgStudents', true)}
              {renderTh('Total # Grades', 'totalStudents', true)}
              {renderTh('Avg. GPA', 'gpa', true)}
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
              const c = item.course;
              const courseCode = `${c?.subject?.code || ''} ${c?.number || ''}`.trim();
              return (
                <tr key={c?.id} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ ...TABLE_STYLES.td, width: '40%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Link to={`/courses/${c?.id}`} style={{ ...TABLE_STYLES.link, fontWeight: '500' }}>
                        {c?.title || '-'}
                      </Link>
                      <span style={TABLE_STYLES.pill}>{courseCode}</span>
                    </div>
                  </td>
                  <td style={TABLE_STYLES.tdRight}>{item.avgStudents != null ? Math.round(item.avgStudents).toLocaleString() : '-'}</td>
                  <td style={TABLE_STYLES.tdRight}>{item.totalStudents != null ? item.totalStudents.toLocaleString() : '-'}</td>
                  <td style={TABLE_STYLES.tdRight}>{item.gpa != null ? item.gpa.toFixed(2) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'instructors') {
      return (
        <table style={TABLE_STYLES.table}>
          <thead>
            <tr>
              {renderTh('Instructor', 'instructorName', false)}
              {renderTh('Avg. # Grades', 'avgStudents', true)}
              {renderTh('Total # Grades', 'totalStudents', true)}
              {renderTh('Avg. GPA', 'gpa', true)}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.instructor?.id || idx} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={TABLE_STYLES.td}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.instructor?.name || '-'}</span>
                </td>
                <td style={TABLE_STYLES.tdRight}>{item.avgStudents != null ? Math.round(item.avgStudents).toLocaleString() : '-'}</td>
                <td style={TABLE_STYLES.tdRight}>{item.totalStudents != null ? item.totalStudents.toLocaleString() : '-'}</td>
                <td style={TABLE_STYLES.tdRight}>{item.gpa != null ? item.gpa.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="Explore" style={{ fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            Explore
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {totalCount > 0 ? `${totalCount.toLocaleString()} results` : ''} · Sorted by {sort} {order}
          </p>
        </div>
        

      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid rgba(34,36,38,.15)', marginBottom: '1.25rem', gap: '0' }}>
        {['subjects', 'courses', 'instructors'].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #983220' : '2px solid transparent',
              padding: '0.6rem 1.25rem',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '700' : '400',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              marginBottom: '-2px',
              transition: 'color 0.15s'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        {renderTable()}
      </div>

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default Explore;