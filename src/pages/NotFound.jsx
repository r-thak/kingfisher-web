import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
      <div className="ui huge header">404</div>
      <div className="ui large header">Page Not Found</div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We couldn't find that route.</p>
      <Link to="/" className="ui primary button">Return Home</Link>
    </div>
  );
}

export default NotFound;