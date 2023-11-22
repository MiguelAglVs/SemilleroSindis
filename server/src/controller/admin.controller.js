const { createAccessToken } = require("../libs/jwt");
const BD = require("../database");
const bcrypt = require("bcrypt");

const adminCtrl = {};

adminCtrl.getAdmins = async (req, res) => {
  try {
    const sql = `SELECT u.*, p.nombre as perfil_nombre
    FROM usuarios u
    LEFT JOIN perfiles p ON u.perfil = p.id
    WHERE u.estado = 1
    ORDER BY u.dni DESC`;

    const result = await BD.executeQuery(sql, [], false);
    const usuarios = result.rows.map((usuario) => ({
      dni: usuario.dni,
      nombre: usuario.nombre,
      Papellido: usuario.p_apellido,
      Sapellido: usuario.s_apellido,
      correo: usuario.correo,
      contrasena: usuario.contrasenia,
      direccion: usuario.direccion,
      telefono: usuario.telefono,
      estado: usuario.estado,
      perfil: usuario.perfil_nombre,
    }));
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error.message);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

adminCtrl.createAdmin = async (req, res) => {
  const {
    cedula,
    nombre,
    apellido,
    segundo_apellido,
    direccion,
    telefono,
    correo,
    contrasena,
    perfil,
  } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const perfilPredeterminado = perfil || 1;

    const sql = `INSERT INTO usuarios (dni, nombre, p_apellido, s_apellido, correo, contrasenia, direccion, telefono, estado, perfil)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9)`;

    await BD.executeQuery(
      sql,
      [
        cedula,
        nombre,
        apellido,
        segundo_apellido,
        correo,
        hashedPassword,
        direccion,
        telefono,
        perfilPredeterminado,
      ],
      true
    );

    const token = await createAccessToken({ id: nombre });
    res.cookie("token", token);
    res.json({
      message: "Usuario creado correctamente",
    });
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", message: error.message });
  }
};

adminCtrl.getAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const sql = `SELECT * FROM usuarios WHERE dni = :id`;
    const result = await BD.executeQuery(sql, { id: id }, false);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuarios = result.rows.map((usuario) => ({
      dni: usuario[0],
      nombre: usuario[1],
      Papellido: usuario[2],
      Sapellido: usuario[3],
      correo: usuario[4],
      contrasena: usuario[5],
      direccion: usuario[6],
      telefono: usuario[7],
      Estado: usuario[8],
      rol: usuario[9],
    }));
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener el administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

adminCtrl.deleteAdmin = async (req, res) => {
  const id = req.params.id;

  try {
    const usuario = await BD.executeQuery(
      "SELECT * FROM usuarios WHERE dni = $1",
      [id],
      true
    );

    if (!usuario.rows.length) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await BD.executeQuery(
      "UPDATE usuarios SET estado = 2 WHERE dni = $1",
      [id],
      true
    );

    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

adminCtrl.updateAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      nombre,
      apellido,
      segundo_apellido,
      direccion,
      telefono,
      correo,
      contrasena,
      perfil,
    } = req.body;

    const checkUsuarioSql = `SELECT * FROM usuarios WHERE dni = $1`;
    const checkUsuarioResult = await BD.executeQuery(
      checkUsuarioSql,
      [id],
      false
    );

    if (checkUsuarioResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let hashedPassword = null;

    if (contrasena) {
      hashedPassword = await bcrypt.hash(contrasena, 10);
    }

    const updateUsuarioSql = `
    UPDATE usuarios SET
      nombre = COALESCE($2, nombre),
      p_apellido = COALESCE($3, p_apellido),
      s_apellido = COALESCE($4, s_apellido),
      correo = COALESCE($5, correo),
      contrasenia = COALESCE($6, contrasenia),
      direccion = COALESCE($7, direccion),
      telefono = COALESCE($8, telefono),
      estado = COALESCE($9, estado),
      perfil = COALESCE($10, perfil)
    WHERE dni = $1
`;

    const result = await BD.executeQuery(
      updateUsuarioSql,
      [
        id,
        nombre,
        apellido,
        segundo_apellido,
        correo,
        hashedPassword,
        direccion,
        telefono,
        1,
        perfil,
      ],
      true
    );

    console.log("Consulta SQL:", updateUsuarioSql);

    if (result) {
      res.json({ message: "Administrador actualizado" });
    } else {
      res.status(500).json({ error: "Error al actualizar el administrador" });
    }
  } catch (error) {
    console.error("Error al actualizar el administrador:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = adminCtrl;
