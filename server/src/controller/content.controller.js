const BD = require("../database");

const contentCtrl = {};

contentCtrl.createContent = async (req, res) => {
  const { ruta, usuario } = req.body;

  try {
    const sql = `INSERT INTO imagenes (ruta, usuario) VALUES ($1, $2) RETURNING id`;

    const result = await BD.executeQuery(sql, [ruta, usuario], true);

    const nuevoId = result.rows[0].id;

    res.json({
      message: "Imagen subida correctamente",
      id: nuevoId,
    });
  } catch (error) {
    console.error("Error al crear el contenido:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      message: error.message,
    });
  }
};

contentCtrl.getContents = async (req, res) => {
  try {
    const sql = `
    SELECT i.*, u.nombre, u.p_apellido as apellido
    FROM imagenes i
    INNER JOIN usuarios u ON i.usuario = u.dni
    ORDER BY i.id DESC
    `;

    const result = await BD.executeQuery(sql, [], false);

    const imagenes = result.rows.map((imagen) => ({
      id: imagen.id,
      ruta: imagen.ruta,
      nombre: imagen.nombre,
    }));

    res.json(imagenes);
  } catch (error) {
    console.error("Error al obtener las imágenes:", error.message);
    res.status(500).json({ error: "Error al obtener las imágenes:" });
  }
};

contentCtrl.deleteContent = async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `DELETE FROM imagenes WHERE id = $1`;

    await BD.executeQuery(sql, [id], true);

    res.json({
      message: "Imagen eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar la imagen:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      message: error.message,
    });
  }
};

module.exports = contentCtrl;
