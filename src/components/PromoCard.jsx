import React from "react";

const PromoCard = React.forwardRef(({ title, description, link, dateAdded }, ref) => {
  const isNew = dateAdded
    ? (() => {
        const addedDate = new Date(dateAdded);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return addedDate > sixMonthsAgo;
      })()
    : false;

  return (
    <div ref={ref} className="card PromoCard" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1 }}>
        <h3 className="medium-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {title}
          {isNew && (
            <span className="pill" style={{ background: 'var(--accent-red)', color: 'white', fontSize: '0.7em' }}>
              New!
            </span>
          )}
        </h3>
        <p className="sub-header" style={{ marginTop: '0.5rem' }}>{description}</p>
      </div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary"
        style={{ marginTop: '1.5rem', width: '100%' }}
      >
        Visit {title}
      </a>
    </div>
  );
});

export default PromoCard;