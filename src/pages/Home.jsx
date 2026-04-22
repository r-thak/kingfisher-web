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
    <div className="Home">
      <div style={{ paddingTop: '2rem', marginBottom: '3rem' }}>
        <div className="ui huge header">
          Kingfisher
          <div className="sub header" style={{ marginTop: '0.5rem' }}>
            University of Illinois at Urbana-Champaign grade distribution visualizer.
          </div>
        </div>

        <p style={{ fontSize: '1.2em', lineHeight: '1.6', maxWidth: '800px' }}>
          Find grade distributions for UIUC courses. Easily compare cumulative course grade
          distributions to particular instructors or semesters to get insight into a course
          which you are interested in taking. Get started by searching for a course below.
        </p>

        <div style={{ marginTop: '2.5rem', maxWidth: '700px' }}>
          <form onSubmit={handleSearch} className="ui action input fluid huge">
            <input
              type="text"
              placeholder="Search for a course (e.g., CS 225, Data Structures)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="ui primary button" type="submit">Search</button>
          </form>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button className="ui secondary large button" onClick={() => navigate('/explore')}>
            Explore Catalog
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
