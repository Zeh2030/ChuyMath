# ============================================================================
# Generador de SVGs para dibujo-guiado (ChuyMath, modulo Arte)
# ----------------------------------------------------------------------------
# Genera, por cada figura, un SVG por paso del tutorial (pasoN) + el modelo
# final. Cada paso muestra las capas acumuladas; el trazo NUEVO de ese paso
# se pinta en ROJO y lo anterior en negro (asi el nino ve que agregar).
#
# Asi se creo toda la biblioteca D0-D2. Para D3 o las 3 actividades pendientes
# de D2: duplicar el patron de $figuras, ejecutar, rasterizar/revisar, crear
# JSON, push, migrar (ver PROGRAMA_DIBUJO.md > "Flujo de produccion SVG").
#
# USO:  pwsh (o PowerShell) -> ejecutar este archivo. Escribe los .svg en
#       chuy-react-app/public/dibujo/guiado/
#
# COMO DEFINIR UNA FIGURA:
#   - prefix: nombre base del archivo (ej 'D2-05_tortuga' -> D2-05_tortuga_paso1.svg)
#   - steps:  cuantos pasos tiene el tutorial
#   - groups: lista de piezas. Cada pieza:
#       step = en que paso aparece (1..steps)
#       z    = orden de dibujo (menor se dibuja primero = queda detras)
#       xml  = fragmento SVG; usar {C} donde va el color del trazo
#              (fill de relleno = "#ffffff" para que se pueda colorear encima)
# ============================================================================

$outDir = Join-Path $PSScriptRoot '..\chuy-react-app\public\dibujo\guiado'
$outDir = [System.IO.Path]::GetFullPath($outDir)
$ROJO  = '#e74c3c'
$NEGRO = '#2b2b2b'
$HEADER = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">' + "`n" + '  <rect width="800" height="800" fill="#ffffff"/>'
$FOOTER = '</svg>'

# --- Figura de EJEMPLO (una cara feliz en 3 pasos). Reemplazar/duplicar. ---
$figuras = @(
  @{
    prefix = 'EJEMPLO_cara'; steps = 3
    groups = @(
      @{ step = 1; z = 1; xml = '<circle cx="400" cy="400" r="260" fill="#ffffff" stroke="{C}" stroke-width="12"/>' }
      @{ step = 2; z = 2; xml = '<g fill="{C}"><circle cx="310" cy="340" r="24"/><circle cx="490" cy="340" r="24"/></g>' }
      @{ step = 3; z = 3; xml = '<path d="M 290 490 Q 400 580 510 490" fill="none" stroke="{C}" stroke-width="14" stroke-linecap="round"/>' }
    )
  }
)

$total = 0
foreach ($fig in $figuras) {
  # Emite paso1..pasoN (acumulativo, el paso actual en rojo) + final (todo negro).
  for ($k = 1; $k -le ($fig.steps + 1); $k++) {
    $esFinal = ($k -eq $fig.steps + 1)
    $visibles = $fig.groups | Where-Object { $_.step -le [Math]::Min($k, $fig.steps) } | Sort-Object { $_.z }
    $lineas = foreach ($g in $visibles) {
      $color = if (-not $esFinal -and $g.step -eq $k) { $ROJO } else { $NEGRO }
      '  ' + $g.xml.Replace('{C}', $color)
    }
    $nombre = if ($esFinal) { "$($fig.prefix)_final.svg" } else { "$($fig.prefix)_paso$k.svg" }
    $contenido = $HEADER + "`n" + ($lineas -join "`n") + "`n" + $FOOTER + "`n"
    [System.IO.File]::WriteAllText((Join-Path $outDir $nombre), $contenido, (New-Object System.Text.UTF8Encoding $false))
    $total++
  }
}
Write-Output "Generados $total archivos en $outDir"

# --- Rasterizar para revisar (opcional; descomentar y ajustar) ---
# $edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
# $svg  = Join-Path $outDir 'EJEMPLO_cara_final.svg'
# $png  = Join-Path $env:TEMP 'EJEMPLO_cara_final.png'
# & $edge --headless --disable-gpu --screenshot="$png" --window-size=800,800 `
#     --default-background-color=FFFFFFFF ("file:///" + $svg.Replace('\','/'))
