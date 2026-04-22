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
    <div className="Search">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="ui large header" style={{ margin: 0 }}>
          Search Results
          <div className="sub header">
            Showing {totalCount} courses for: <strong>{searchString || subjectStr || 'All'}</strong>
          </div>
        </div>
        <button className="ui secondary button" onClick={() => navigate(-1)}>Back</button>
      </div>

      <div className="ui stackable grid">
        <div className="four wide column">
          <div className="ui segment">
            <div className="ui small header">Filters</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>
              Filtering options coming soon. Browse by subject in the Explore tab.
            </p>
          </div>
        </div>
        <div className="twelve wide column">
          {loading ? (
            <div className="ui segment" style={{ padding: '3rem', textAlign: 'center' }}>
              <div className="ui active centered inline loader large"></div>
              <p style={{ marginTop: '1rem' }}>Searching Courses...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="ui info message">
              <div className="header">No results found</div>
              <p>Try searching for a course number like &ldquo;225&rdquo; or a title like &ldquo;Algorithms&rdquo;.</p>
            </div>
          ) : (
            <div className="ui segments">
              {results.map(course => (
                <Link key={course.id} to={`/courses/${course.id}`}
                      className="ui segment" style={{ display: 'block', cursor: 'pointer' }}>
                  <div className="ui header">
                    {course.title || course.name}
                    <div className="sub header">
                      <span className="ui label subject-pill">
                        {course.subject?.code || course.subject} {course.number}
                      </span>
                    </div>
                  </div>
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
