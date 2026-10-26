# JQYDesigns Marketing — software de PC (v1.1.0, andamiaje Fase 1)

Programa de escritorio **con interfaz propia empaquetada** para el Marketing
Brain de jqydesigns.com. Vive (en preparación) en
`~/workspace/desktop-software-v1/` y está pensado para ocupar el lugar de la
carpeta `desktop/` del repo `ultramegared/magictouchdesigns` cuando se apruebe
su publicación. **Todavía no está subido a GitHub ni reemplaza al instalador
actual.**

## Qué cambia frente a la v1.0.0

| | v1.0.0 (actual) | v1.1.0 (esta) |
|---|---|---|
| Interfaz | Carga la página web en una ventana | Pantallas **locales** (`ui/`) dentro del programa |
| Datos | La propia web | El programa habla con `https://api.jqydesigns.com` desde el proceso principal |
| Entrada | La del sitio web | **Solo la cuenta administradora** de la página (sin registro) |
| Actualizaciones | Reinstalar a mano | **Automáticas**: al abrir, busca versión nueva en las releases de GitHub y se actualiza solo, con registro de versiones dentro del programa |

## Seguridad de la entrada

1. `POST /api/auth/login` con `{username, password}` (usuario, **no** correo).
2. Con el token, `GET /api/user/me`. Solo se entra si `user.role === "ADMIN"`;
   si no, se muestra «Solo la cuenta administradora puede entrar» y el token se
   descarta (nunca se guarda).
3. El token se guarda en un JSON en la carpeta de datos del usuario
   (`app.getPath('userData')`). **La contraseña nunca se guarda.**
4. Todas las llamadas al API salen del proceso principal (sin cabecera
   `Origin`), porque el CORS del servidor rechaza peticiones con `Origin` y
   deja pasar las que no lo traen. El renderer no hace fetch.

## Pantallas (Fase 1)

- **Login**: logo JQ&YD, usuario y contraseña. Sin enlace de registro.
- **Inicio**: canales conectados con botón «Verificar» en vivo por canal,
  estado del Autopilot y actividad reciente, resumen de Google Analytics,
  y la sección «Versión y actualizaciones» con el registro de versiones.

## Desarrollo

```bash
npm install
npm start     # electron . — en desarrollo la auto-actualización queda inactiva
npm run dist  # instalador NSIS de Windows (electron-builder)
```

Hace falta copiar el icono real del logo a `build/icon.ico` (el mismo que usa
la carpeta `desktop/` del repo) antes de compilar el instalador.

## ⚠️ Nota para publicar (workflow de GitHub)

La actualización automática (electron-updater) necesita que la release de
GitHub incluya, junto al `.exe`, los archivos **`latest.yml`** y el
**`.blockmap`** que electron-builder genera en `desktop/dist`. El workflow
actual publica solo `desktop/dist/*.exe`; cuando esta versión se suba, el paso
de publicación debe ampliarse a esos dos archivos también (p. ej.
`files: desktop/dist/*.exe`, `desktop/dist/latest.yml`,
`desktop/dist/*.blockmap`). Esto es solo una nota: **ningún workflow fue
modificado**.
