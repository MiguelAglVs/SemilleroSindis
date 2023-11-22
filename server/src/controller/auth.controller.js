const { createAccessToken } = require("../libs/jwt");
const BD = require("../database");
const bcrypt = require("bcrypt");

const authCtrl = {};

authCtrl.register = async (req, res) => {
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
    // Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Definir el valor predeterminado del rol (1 si no se proporciona un rol específico)
    const perfilPredeterminado = perfil || 1;

    const sql = `INSERT INTO usuarios (dni, nombre, p_apellido, s_apellido, correo, contrasenia, direccion, telefono, estado, perfil)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

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
        1,
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

authCtrl.login = async (req, res) => {
  const { nombre, contrasena } = req.body;
  try {
    const checkAdminSql = `
      SELECT u.*, p.nombre as nonbre_perfil
      FROM usuarios u
      LEFT JOIN perfiles p ON u.perfil = p.id
      WHERE (u.nombre = $1 OR u.correo = $1) AND u.estado = 1
    `;

    const checkAdminResult = await BD.executeQuery(
      checkAdminSql,
      [nombre],
      false
    );

    if (checkAdminResult.rows.length === 0) {
      return res.status(400).json({ message: "Administrador no encontrado" });
    }

    const storedPassword = checkAdminResult.rows[0].contrasenia;

    if (!storedPassword) {
      return res
        .status(400)
        .json({ message: "La contraseña almacenada es inválida" });
    }

    try {
      const isMatch = await bcrypt.compare(contrasena, storedPassword);

      if (!isMatch) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
      }

      const token = await createAccessToken({
        id: checkAdminResult.rows[0].dni,
        nombre: checkAdminResult.rows[0].nombre,
        apellido: checkAdminResult.rows[0].p_apellido,
        segundo_apellido: checkAdminResult.rows[0].s_apellido,
        correo: checkAdminResult.rows[0].correo,
        perfil: checkAdminResult.rows[0].perfil,
        nonbre_perfil: checkAdminResult.rows[0].nonbre_perfil,
      });

      res.cookie("token", token);
      res.json({ message: "Inicio de sesión exitoso", token: token });
    } catch (compareError) {
      console.error("Error al comparar contraseñas:", compareError);
      res.status(500).json({
        error: "Error interno del servidor",
        message: compareError.message,
      });
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", message: error.message });
  }
};

authCtrl.logout = async (req, res) => {
  const expirationDate = new Date();
  expirationDate.setHours(expirationDate.getHours() + 1);

  res.cookie("token", "", {
    expires: expirationDate,
  });

  return res.sendStatus(200);
};

module.exports = authCtrl;
