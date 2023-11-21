const { Pool } = require("pg");

const DbConfig = {
  user: "Miguel",
  password: "Miguel",
  host: "localhost",
  port: 5432,
  database: "Sindis_db",
};

const pool = new Pool(DbConfig);

const openConnection = async () => {
  try {
    await pool.connect();
    console.log("Conexión establecida con PostgreSQL");
  } catch (error) {
    console.error("Error al establecer la conexión:", error.message);
    throw error;
  }
};

const executeQuery = async (sql, values) => {
  try {
    const result = await pool.query(sql, values);
    console.log("Consulta ejecutada");
    return result;
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error.message);
    throw error;
  }
};

module.exports = {
  openConnection,
  executeQuery,
};
