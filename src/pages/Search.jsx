import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../api';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Search() {
  const queryParams = useQuery();
  const searchString = queryParams.get('q') || queryParams.get('query') || '';
  const subjectStr = queryParams.get('subject') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    let params = {};
    if (searchString) params.query = searchString;
    if (subjectStr) params.subject = subjectStr;

    getCourses(params)
      .then(data => {
        const items = data.results || [];
        setResults(items);
        setTotalCount(data.totalCount || items.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchString, subjectStr]);

  return (
    <div className="Search container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="large-header" style={{ margin: 0 }}>
          Search Results
          <div className="sub-header">
            Showing {totalCount} courses for: <strong>{searchString || subjectStr || 'All'}</strong>
          </div>
        </h1>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="grid">
        <div className="col" style={{ flex: '0 0 250px' }}>
          <div className="card">
            <h3 className="small-header">Filters</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
              Filtering options coming soon. Browse by subject in the Explore tab.
            </p>
          </div>
        </div>
        <div className="col">
          {loading ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="loader"></div>
              <p style={{ marginTop: '1rem' }}>Searching Courses...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="alert">
              <div className="header">No results found</div>
              <p>Try searching for a course number like &ldquo;225&rdquo; or a title like &ldquo;Algorithms&rdquo;.</p>
            </div>
          ) : (
            <div className="results-list">
              {results.map(course => (
                <Link key={course.id} to={`/courses/${course.id}`}
                      className="card" style={{ display: 'block', textDecoration: 'none' }}>
                  <h2 className="medium-header" style={{ margin: 0 }}>
                    {course.title || course.name}
                    <div className="sub-header" style={{ marginTop: '0.25rem' }}>
                      <span className="pill">
                        {course.subject?.code || course.subject} {course.number}
                      </span>
                    </div>
                  </h2>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;