const axios = require('axios');
const api = axios.create({ baseURL: '/v1' });
console.log(api.getUri({ url: '/courses' }));
console.log(api.getUri({ url: 'courses' }));