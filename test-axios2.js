const { default: axios } = await import('axios');
try {
  const res = await axios.get('http://localhost:3001/v1/courses', {
    params: { query: 'CS' }
  });
  console.log("Got results:", res.data.results?.length);
} catch (e) {
  console.log("Axios error:", e.message);
}