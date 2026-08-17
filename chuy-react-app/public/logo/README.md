# Logo de ChuyMath

`chuymath.svg` es el logo oficial (cohete-lápiz con estela de notas musicales:
aprender + explorar + música, sin atarse a una sola materia). Lleva su propio
fondo redondeado para que se lea igual sobre pestañas claras y oscuras.

Los otros SVG (`A-`, `B-`, `C-`) son los candidatos que se compararon, y
`comparar.html` los muestra a 16/32/64/128/180 px sobre fondo claro y sobre los
temas oscuros. Se conservan por si algún día se quiere revisar la decisión.

## Regenerar los PNG

iOS y Android no aceptan SVG para el icono de app, así que hay PNG derivados.
No hay ImageMagick en la máquina (ojo: el `convert` de Windows es la
herramienta de sistemas de archivos, no ImageMagick), así que se rasteriza con
Chrome headless. `render.html` y `render-maskable.html` existen solo para eso.

Con `npm run dev` corriendo:

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
# Chrome no puede escribir dentro del proyecto: manda el PNG a una ruta
# absoluta de Windows fuera del repo y luego cópialo aquí.
for px in 32 180 192 512; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --virtual-time-budget=3000 \
    --window-size=$px,$px --screenshot="C:\ruta\temporal\icon-$px.png" \
    "http://localhost:5173/logo/render.html?px=$px"
done
```

El maskable usa `render-maskable.html` (mismo comando, solo 512): Android
recorta el icono con su propia forma, así que ese deja el cohete al 70% con
el fondo a sangre para que no salga mochado.
