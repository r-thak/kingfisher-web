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
    <div className="ui icon input SearchBox" style={{ minWidth: '250px' }}>
      <input
        type="text"
        placeholder="Search courses..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <i className="search link icon" onClick={performSearch} title="Perform Search"></i>
    </div>
  );
}

export default SearchBox;
