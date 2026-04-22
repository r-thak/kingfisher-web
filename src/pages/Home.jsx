import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="Home container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ paddingTop: '5rem', marginBottom: '4rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="huge-header" style={{ fontSize: '3.5rem' }}>
          Kingfisher
          <div className="sub-header" style={{ marginTop: '0.75rem', fontSize: '1.25rem' }}>
            University of Illinois at Urbana-Champaign grade distribution visualizer.
          </div>
        </h1>

        <p style={{ fontSize: '1.25rem', lineHeight: '1.6', maxWidth: '750px', margin: '1.5rem 0 2.5rem' }}>
          Find grade distributions for UIUC courses. Easily compare cumulative course grade
          distributions to particular instructors or semesters to get insight into a course
          which you are interested in taking.
        </p>

        <div style={{ width: '100%', maxWidth: '600px' }}>
          <form onSubmit={handleSearch} className="input-group input-huge">
            <input
              type="text"
              placeholder="Search for a course (e.g., CS 225)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ borderRadius: '12px 0 0 12px' }}
            />
            <button className="btn btn-primary" type="submit" style={{ borderRadius: '0 12px 12px 0' }}>Search</button>
          </form>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button className="btn btn-secondary btn-large" onClick={() => navigate('/explore')} style={{ borderRadius: '12px' }}>
            Explore Catalog
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;