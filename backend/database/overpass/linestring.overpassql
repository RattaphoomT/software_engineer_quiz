[out:json][timeout:180];
(
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"](16.35,102.72,16.55,102.92);
  way["waterway"~"^(river|stream|canal)$"](16.35,102.72,16.55,102.92);
);
out body geom 80;
