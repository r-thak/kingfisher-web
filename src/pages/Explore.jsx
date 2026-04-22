import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubjects } from '../api';
import { useNavigate } from 'react-router-dom';

function Explore() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getSubjects()
      .then(data => {
        setSubjects(data.items || data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="Explore container">
      <div className="breadcrumb" style={{ marginBottom: '1rem' }}>
        <a onClick={() => navigate('/')}>Home</a>
        <span className="divider">/</span>
        <div className="active">Explore</div>
      </div>

      <h1 className="large-header">
        Explore Subjects
        <div className="sub-header">Browse courses by subject area available at UIUC.</div>
      </h1>

      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="loader"></div>
          <p style={{ marginTop: '1rem' }}>Loading Subjects...</p>
        </div>
      ) : (
        <div className="cards-grid">
          {subjects.map(sub => (
            <Link key={sub.code} to={`/search?subject=${sub.code}`} className="card" style={{ textDecoration: 'none' }}>
              <div className="content">
                <h3 className="medium-header" style={{ margin: 0 }}>{sub.code}</h3>
                <div className="description" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                  {sub.name || sub.description || 'View courses'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9em' }}>
        * Data is aggregated from historical records and may not reflect current semester offerings.
      </p>
    </div>
  );
}

export default Explore;