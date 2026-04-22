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
    <div className="Explore">
      <div className="ui breadcrumb" style={{ marginBottom: '1rem' }}>
        <a className="section" onClick={() => navigate('/')}>Home</a>
        <i className="right angle icon divider"></i>
        <div className="active section">Explore</div>
      </div>

      <div className="ui large header">
        Explore Subjects
        <div className="sub header">Browse courses by subject area available at UIUC.</div>
      </div>

      {loading ? (
        <div className="ui segment" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="ui active centered inline loader large"></div>
          <p style={{ marginTop: '1rem' }}>Loading Subjects...</p>
        </div>
      ) : (
        <div className="ui four stackable cards">
          {subjects.map(sub => (
            <Link key={sub.code} to={`/search?subject=${sub.code}`} className="ui raised card">
              <div className="content">
                <div className="header">{sub.code}</div>
                <div className="description">
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
