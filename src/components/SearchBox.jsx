import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function SearchBox() {
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || params.get('query') || '';
    setSearchValue(q);
  }, [location.search]);

  const performSearch = () => {
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      performSearch();
      event.target.blur();
    }
  };

  return (
    <div className="search-box SearchBox" style={{ minWidth: '250px', width: '100%' }}>
      <input
        type="text"
        placeholder="Search for 'CS 225', 'Algorithms', or 'Comp Sci'..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <span className="icon" onClick={performSearch} title="Perform Search">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </span>
    </div>
  );
}

export default SearchBox;