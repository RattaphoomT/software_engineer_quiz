[out:json][timeout:180];
(
  relation["route"~"^(bus|train|railway)$"](16.35,102.72,16.55,102.92);
);
out body geom 30;
