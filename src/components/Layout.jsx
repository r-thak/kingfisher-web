import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import SearchBox from './SearchBox';

const COMMIT_HASH = 'main';
const COMMIT_SHORT = 'main';
const API_URL = 'https://github.com/r-thak/kingfisher-api';
const WEB_REPO_URL = 'https://github.com/r-thak/kingfisher-web';

function Layout({ children }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Inverted Segment + Menu — matching Madgrades SiteHeader */}
      <div className="ui inverted segment SiteHeader" style={{ padding: 0, borderRadius: 0, margin: 0 }}>
        <div className="ui inverted pointing secondary stackable menu" style={{ border: 'none', margin: 0, padding: '0.5rem 0' }}>
          <div className="ui container">
            <Link to="/" className="item header madgrades-logo" style={{ fontSize: '1.2em' }}>
              <i className="graduation cap icon" style={{ marginRight: '10px' }}></i>
              Kingfisher
            </Link>

            <div className="item" style={{ flex: 1 }}>
              <SearchBox />
            </div>

            <div className="right menu">
              <Link to="/search" className={`item ${isActive('/search') || isActive('/courses') ? 'active' : ''}`}>
                Courses
              </Link>
              <Link to="/explore" className={`item ${isActive('/explore') ? 'active' : ''}`}>
                Explore
              </Link>
              <Link to="/about" className={`item ${isActive('/about') ? 'active' : ''}`}>
                About
              </Link>
              <a className="item" onClick={toggleTheme} style={{ cursor: 'pointer' }}
                 title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <i className={`${theme === 'dark' ? 'sun' : 'moon'} icon`}></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <main style={{ flex: 1, padding: '2rem 0' }}>
        <div className="ui container">
          {children}
        </div>
      </main>

      <div className="SiteFooter" style={{
        backgroundColor: '#1b1c1d',
        padding: '1.25rem 0',
        marginTop: 'auto',
        borderTop: 'none'
      }}>
        <div className="ui container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>
            Courses updated Fall 2025.
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a
              href={API_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ui small green label"
              style={{ margin: 0 }}
            >
              <i className="code icon"></i> API
            </a>
            <a
              href={`${WEB_REPO_URL}/commit/${COMMIT_HASH}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ui small label"
              style={{ margin: 0, backgroundColor: '#6435c9', color: 'white' }}
            >
              <i className="code branch icon"></i> rev {COMMIT_SHORT}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;
