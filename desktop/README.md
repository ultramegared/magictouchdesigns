# JQYDesigns Marketing para PC

Aplicación de escritorio para Windows que abre el panel de Marketing Brain
en vivo: https://www.jqydesigns.com/admin/marketing

Como el panel vive en el servidor, la app siempre muestra la versión más
reciente sin necesidad de actualizar el programa.

## Icono

El icono es el logo del negocio (JQ&YD dorado). Como el archivo `.ico` es
binario y no se guarda directo en el repo, se guarda en base64 en
`build/icon.ico.b64` y el workflow de GitHub Actions lo decodifica a
`build/icon.ico` antes de compilar.

## Compilar (en Windows)

```sh
cd desktop
npm install
npm run dist
```

El instalador queda en `dist/` (archivo `.exe`).

## Publicación

El workflow `.github/workflows/desktop-windows.yml` compila el instalador
en cada cambio a `desktop/` y lo publica en la release `desktop-latest`
de GitHub, siempre con el mismo enlace de descarga.
