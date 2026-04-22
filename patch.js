const fs = require('fs');
let code = fs.readFileSync('src/pages/Search.jsx', 'utf8');
code = code.replace(
  'const [totalCount, setTotalCount] = useState(0);',
  'const [totalCount, setTotalCount] = useState(0); const [fetchErr, setFetchErr] = useState("");'
);
code = code.replace(
  '.catch(console.error)',
  '.catch(e => { console.error(e); setFetchErr(e.toString() + " :: " + (e.response ? JSON.stringify(e.response.data) : "No Response")); })'
);
code = code.replace(
  '<div className="ui info message">',
  '{fetchErr && <div className="ui negative message"><div className="header">Error</div><p>{fetchErr}</p></div>}' +
  '<div className="ui info message">'
);
fs.writeFileSync('src/pages/Search.jsx', code);