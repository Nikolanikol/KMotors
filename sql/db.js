// Shared DB connection helper — fixes pg SSL breaking change in v8+
// Usage: const { getClient } = require('./db');
require('dotenv').config();
const { Client } = require('pg');

function getClient() {
  const connStr = process.env.POSTGRES_URL_NON_POOLING + '&uselibpqcompat=true';
  return new Client({ connectionString: connStr });
}

module.exports = { getClient };
