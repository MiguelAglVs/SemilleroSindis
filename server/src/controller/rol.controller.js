const BD = require("../database");

const rolCtrl = {};

rolCtrl.createRol = async (req, res) => {
  const { nombre } = req.body;
  try {
    const sql = `INSERT INTO ROLES (id, nombre)
    VALUES (seq_roles.NEXTVAL, :nombre)`;

    await BD.executeQuery(
      sql,
      {
        nombre,
      },
      true
    );

    res.json({
      message: "Rol creado correctamente",
    });
  } catch (error) {
    console.error("Error al crear el rol:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", message: error.message });
  }
};

rolCtrl.getRoles = async (req, res) => {
  try {
    const sql = `SELECT * FROM perfiles`;

    const result = await BD.executeQuery(sql, [], false);
    const perfiles = result.rows.map((perfil) => ({
      id: perfil.id,
      nombre: perfil.nombre,
    }));
    res.json(perfiles);
  } catch (error) {
    console.error("Error al obtener los perfiles:", error.message);
    res.status(500).json({ error: "Error al obtener los perfiles:" });
  }
};

module.exports = rolCtrl;
