# Problemas Conhecidos no Desenvolvimento

---

## 1. Espelhamento de Spritesheet — Ordem de Frames Invertida

### O problema
Ao espelhar um spritesheet inteiro horizontalmente (ex: via `RotateFlip` do PowerShell), **a ordem dos frames fica invertida**.

Isso acontece porque a imagem é tratada como uma única imagem — ao espelhar, o que era o frame 0 (esquerda) vai para o final (direita), e o frame final vai para o início.

**Resultado:** a animação toca de trás para frente. Ex: agachando toca do agachado → em pé em vez de em pé → agachado.

### Como identificar
- Animação parece tocar ao contrário
- Especialmente visível em animações direcionais (agachar, pular, atacar)
- Só ocorre nos sprites criados por espelhamento — sprites originais não têm esse problema

### A solução correta
**Espelhar frame a frame**, não o spritesheet inteiro. Cada frame é extraído individualmente, espelhado, e remontado na mesma posição.

Script PowerShell:
```powershell
Add-Type -AssemblyName System.Drawing

function Mirror-FrameByFrame {
  param([string]$srcPath, [string]$dstPath, [int]$frameW, [int]$frameH)
  $src = [System.Drawing.Image]::FromFile($srcPath)
  [int]$frameCount = [int]($src.Width / $frameW)
  $dst = New-Object System.Drawing.Bitmap([int]$src.Width, [int]$src.Height)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  for ([int]$i = 0; $i -lt $frameCount; $i++) {
    [int]$xSrc = $i * $frameW
    $frame = New-Object System.Drawing.Bitmap($frameW, $frameH)
    $fg = [System.Drawing.Graphics]::FromImage($frame)
    $srcRect = New-Object System.Drawing.Rectangle($xSrc, 0, $frameW, $frameH)
    $dstRectF = New-Object System.Drawing.RectangleF(0, 0, $frameW, $frameH)
    $fg.DrawImage($src, $dstRectF, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $fg.Dispose()
    $frame.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
    [int]$xDst = $i * $frameW
    $g.DrawImage($frame, $xDst, 0)
    $frame.Dispose()
  }
  $g.Dispose()
  $dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $src.Dispose(); $dst.Dispose()
  Write-Host "OK: $([System.IO.Path]::GetFileName($dstPath)) ($frameCount frames)"
}

# Exemplo de uso:
Mirror-FrameByFrame "crouch-left.png" "crouch-right.png" 128 128
```

### Regra geral
> Sempre que criar um sprite direcional por espelhamento, usar `Mirror-FrameByFrame`. **Nunca** usar `RotateFlip` diretamente na imagem inteira do spritesheet.

### Sprites corrigidos até agora
| Personagem | Sprite | Fonte |
|---|---|---|
| Dioupe | `crouch-right.png` | espelho de `crouch-left.png` |
| Dioupe | `jump-right.png` | espelho de `jump-left.png` |
| Dioupe | `attack-left.png` | espelho de `attack-right.png` |
| BoletasWolf | `crouch-right.png` | espelho de `crouch-left.png` |
| BoletasWolf | `attack-left.png` | espelho de `attack-right.png` |

---

## 2. Sprites hurt-left e hurt-right Trocados

### O problema
Os arquivos `hurt-left.png` e `hurt-right.png` foram entregues com os nomes invertidos — o sprite que representa o personagem levando dano vindo da esquerda estava nomeado como `hurt-right` e vice-versa.

### Como identificar
- Personagem mostra a animação de dano no lado errado
- Visualmente o sprite "lean" (inclinação do corpo) aponta na direção oposta ao atacante

### A solução
Trocar os nomes dos arquivos:
```powershell
Rename-Item "hurt-left.png"     "hurt-left-tmp.png"
Rename-Item "hurt-right.png"    "hurt-left.png"
Rename-Item "hurt-left-tmp.png" "hurt-right.png"
```

### Personagens afetados
- Dioupe: corrigido
- BoletasWolf: corrigido

---

## 3. Frames Transparentes no Início do Spritesheet

### O problema
Alguns spritesheets têm frames transparentes (vazios) no início, antes do conteúdo real começar.

### Como identificar
- Animação aparece "atrasada" ou com delay no início
- Personagem fica invisível por alguns frames antes de aparecer

### A solução
Usar o parâmetro `start` no `reg()` para pular os frames transparentes:
```typescript
// Frame 0 transparente — começa do frame 1
reg("dioupe-attack-left", "dioupe-attack-left", 4, 7, false, 1)

// Frames 0-3 transparentes — começa do frame 4
reg("bw-attack-left", "bw-attack-left", 7, 7, false, 4)
```

> **Nota:** ao recriar o sprite por espelho frame a frame, os frames transparentes somem e o registro volta ao normal (`start = 0`).
