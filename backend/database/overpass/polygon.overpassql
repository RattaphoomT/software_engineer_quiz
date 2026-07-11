[out:json][timeout:180];
(
  way["leisure"="park"](16.35,102.72,16.55,102.92);
  way["amenity"="university"](16.35,102.72,16.55,102.92);
  way["landuse"~"^(reservoir|basin)$"](16.35,102.72,16.55,102.92);
);
out body geom 40;
