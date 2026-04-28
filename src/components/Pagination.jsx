import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', gap: '0.25rem' }}>
      <button 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: currentPage === 1 ? 'var(--bg-secondary)' : 'var(--bg-card)',
          color: currentPage === 1 ? 'var(--text-muted)' : 'var(--color-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
        }}
      >
        Prev
      </button>

      {startPage > 1 && (
        <>
          <button 
            onClick={() => onPageChange(1)}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--color-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            1
          </button>
          {startPage > 2 && <span style={{ padding: '0.5rem' }}>...</span>}
        </>
      )}

      {pages.map(page => (
        <button 
          key={page}
          onClick={() => onPageChange(page)}
          style={{
            padding: '0.5rem 0.75rem',
            backgroundColor: page === currentPage ? 'var(--color-primary)' : 'var(--bg-card)',
            color: page === currentPage ? '#fff' : 'var(--color-primary)',
            border: '1px solid',
            borderColor: page === currentPage ? 'var(--color-primary)' : 'var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: page === currentPage ? '600' : '400'
          }}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={{ padding: '0.5rem' }}>...</span>}
          <button 
            onClick={() => onPageChange(totalPages)}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--color-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {totalPages}
          </button>
        </>
      )}

      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        style={{
          padding: '0.5rem 0.75rem',
          backgroundColor: currentPage === totalPages ? 'var(--bg-secondary)' : 'var(--bg-card)',
          color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--color-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '4px',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
        }}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
