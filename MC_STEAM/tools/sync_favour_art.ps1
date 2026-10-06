# 从 favour 同步 MC_STEAM 用到的素材（导出/无 D 盘路径时备用）
$FavourRoot = "D:\zg\design\favour\public\img"
$Dest = Join-Path $PSScriptRoot "..\assets\favour_mirror"

$Files = @(
	"game\money.png",
	"game\gold_coin.png",
	"game\gold.png",
	"game\gold2.png",
	"game\gold3.png",
	"game\circle.png",
	"game\zs.png",
	"game\score.png",
	"game\start.png",
	"game\mine.png",
	"game\wq.png",
	"game\mine2.png",
	"game\bg3.png",
	"game\data\img1.png",
	"game\data\img2.png",
	"game\data\img7.png",
	"game\data\img12.png",
	"game\data\img3.png",
	"game\data\img5.png",
	"game\data\img6.png",
	"game\data\img9.png",
	"game\data\img14.png",
	"game\data\img15.png",
	"mouse\map.png",
	"mouse\bx2.png",
	"mouse\bx3.png",
	"mouse\bx4.png",
	"gif\loading2.gif"
)

foreach ($rel in $Files) {
	$src = Join-Path $FavourRoot $rel
	$out = Join-Path $Dest $rel
	$dir = Split-Path $out -Parent
	if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
	if (Test-Path $src) {
		Copy-Item $src $out -Force
		Write-Host "OK $rel"
	} else {
		Write-Warning "Missing $src"
	}
}

Write-Host "Done -> $Dest"
