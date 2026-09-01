import { useEffect, useMemo, useState } from "react";
import { Building2, Minus, Plus, RotateCcw, TowerControl } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { PROVINCE_REGION, REGION_COLORS, REGION_LABELS } from "../data/masterData";
import { useApp } from "../context/AppContext";
import { Button } from "./ui";

const MAP_URL = "/maps/thailand-provinces.topo.json";

export default function ThailandMap() {
  const { state, dispatch } = useApp();
  const [geography, setGeography] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [position, setPosition] = useState({ coordinates: [101, 13], zoom: 1 });
  const [hoveredAreaId, setHoveredAreaId] = useState(null);
  const selectedArea = state.areas.find((area) => area.id === state.selectedAreaId);
  const isTowerSelected = selectedArea?.type === "tower";
  const visibleMarkers = useMemo(() => state.areas.filter((area) => area.type === "center" || area.parentCenterId === state.selectedCenterId), [state.areas, state.selectedCenterId]);

  useEffect(() => {
    fetch(MAP_URL).then((response) => {
      if (!response.ok) throw new Error("Map unavailable");
      return response.json();
    }).then(setGeography).catch(() => setMapError(true));
  }, []);

  const setZoom = (zoom) => setPosition((current) => ({ ...current, zoom: Math.max(1, Math.min(4, zoom)) }));
  const selectArea = (areaId) => dispatch({ type: "SELECT_AREA", areaId });
  const markerKeyDown = (event, areaId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectArea(areaId);
    }
  };

  if (mapError) {
    return <div className="map-fallback"><MapPinFallback /><p>ไม่สามารถโหลดรูปทรงแผนที่ได้</p><span>ยังสามารถเลือกพื้นที่จากรายการด้านข้างได้ตามปกติ</span></div>;
  }

  return (
    <div className="map-shell">
      <div className="map-toolbar" aria-label="เครื่องมือแผนที่">
        <Button variant="secondary" size="icon" onClick={() => setZoom(position.zoom + 0.5)} aria-label="ขยายแผนที่"><Plus size={17} /></Button>
        <Button variant="secondary" size="icon" onClick={() => setZoom(position.zoom - 0.5)} aria-label="ย่อแผนที่"><Minus size={17} /></Button>
        <Button variant="secondary" size="icon" onClick={() => setPosition({ coordinates: [101, 13], zoom: 1 })} aria-label="คืนค่าแผนที่"><RotateCcw size={17} /></Button>
      </div>
      <ComposableMap projection="geoMercator" projectionConfig={{ center: [101, 13], scale: 1900 }} width={800} height={620} className="thailand-map" aria-label="แผนที่ประเทศไทยแสดงศูนย์ควบคุมการบิน">
        <ZoomableGroup center={position.coordinates} zoom={position.zoom} minZoom={1} maxZoom={4} filterZoomEvent={(event) => event.type !== "wheel"} onMoveEnd={setPosition}>
          {geography && (
            <Geographies geography={geography}>
              {({ geographies }) => geographies.map((geo) => {
                const iso = geo.properties.shapeISO;
                const region = PROVINCE_REGION[iso] || "central";
                const selected = iso === selectedArea?.provinceCode;
                return <Geography key={geo.rsmKey} geography={geo} tabIndex={-1} fill={selected ? "#0f766e" : REGION_COLORS[region]} stroke={selected ? "#083344" : "#ffffff"} strokeWidth={selected ? 1.8 : 0.7} style={{ default: { outline: "none" }, hover: { fill: selected ? "#0f766e" : "#7dd3fc", outline: "none" }, pressed: { outline: "none" } }} />;
              })}
            </Geographies>
          )}
          {visibleMarkers.map((area) => {
            const selected = area.id === state.selectedAreaId;
            const hovered = area.id === hoveredAreaId;
            const center = area.type === "center";
            const isParentOfSelectedTower = isTowerSelected && area.id === state.selectedCenterId;
            const showLabel = hovered || selected || (center && !isParentOfSelectedTower);
            return (
              <Marker key={area.id} coordinates={area.coordinates}>
                <g
                  className={`map-marker ${center ? "map-marker--center" : "map-marker--tower"} ${selected ? "is-selected" : ""} ${hovered ? "is-hovered" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`เลือก${area.name}`}
                  onClick={() => selectArea(area.id)}
                  onKeyDown={(event) => markerKeyDown(event, area.id)}
                  onMouseEnter={() => setHoveredAreaId(area.id)}
                  onMouseLeave={() => setHoveredAreaId(null)}
                  onFocus={() => setHoveredAreaId(area.id)}
                  onBlur={() => setHoveredAreaId(null)}
                >
                  <title>{area.name}</title>
                  <circle className="marker-hit" r={22 / position.zoom} />
                  {(selected || hovered) && (
                    <circle className="marker-ring" r={(center ? 12 : 9) / position.zoom} />
                  )}
                  <circle className="marker-dot" r={(center ? 6.5 : 4.5) / position.zoom} />
                  {showLabel && (
                    <text
                      className={`marker-label ${center ? "center-label" : "tower-label"} ${selected ? "selected" : ""} ${hovered && !selected ? "hovered" : ""}`}
                      textAnchor="middle"
                      y={(center ? -13 : -10) / position.zoom}
                      fontSize={(center ? 11 : 9.5) / position.zoom}
                    >
                      {area.shortName}
                    </text>
                  )}
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
      <div className="map-legends">
        <span><Building2 size={14} /> ศูนย์หลัก</span>
        <span><TowerControl size={14} /> หอลูกข่าย (ชี้/คลิกจุดเพื่อดูชื่อ)</span>
      </div>
      <div className="region-legend" aria-label="คำอธิบายสีภูมิภาค">
        {Object.entries(REGION_LABELS).map(([key, label]) => <span key={key}><i style={{ backgroundColor: REGION_COLORS[key] }} />{label.replace("ภาค", "")}</span>)}
      </div>
    </div>
  );
}

function MapPinFallback() {
  return <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true"><path d="M36 6c-13 0-23 10-23 23 0 17 23 37 23 37s23-20 23-37C59 16 49 6 36 6Z" fill="#cbd5e1"/><circle cx="36" cy="29" r="9" fill="#f8fafc"/></svg>;
}
