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
      <header className="SiteHeader">
        <div className="container" style={{ maxWidth: 'none', padding: '0 2rem' }}>
          <nav className="nav" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', width: '100%' }}>
            <Link to="/" className="logo">
              Kingfisher
            </Link>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '700px' }}>
                <SearchBox />
              </div>
            </div>

            <div className="nav-links">
              <Link to="/search" className={isActive('/search') || isActive('/courses') ? 'active' : ''}>
                Courses
              </Link>
              <Link to="/explore" className={isActive('/explore') ? 'active' : ''}>
                Explore
              </Link>
              <a onClick={toggleTheme} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                 title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                )}
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1rem 0' }}>
        <div className="container">
          {children}
        </div>
      </main>

      <footer className="SiteFooter" style={{
        backgroundColor: 'var(--bg-header)',
        padding: '2rem 0',
        marginTop: 'auto'
      }}>
        <div className="container" style={{
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
              className="pill"
              style={{ 
                background: 'var(--accent-red)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 'bold',
                textDecoration: 'none'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              API
            </a>
            <a
              href={`${WEB_REPO_URL}/commit/${COMMIT_HASH}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pill"
              style={{ 
                backgroundColor: 'var(--bg-header)', 
                color: 'white', 
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 'bold',
                textDecoration: 'none'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
              rev {COMMIT_SHORT}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;