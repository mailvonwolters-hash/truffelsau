"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Appointment = { date: string; time: string; duration: number };
type Prospect = {
  id?: string;
  tags?: string[];
  name: string;
  street: string;
  housenumber?: string;
  postcode: string;
  city: string;
  lat: number | null;
  lng: number | null;
  distance?: number;
  website?: string;
  phone?: string;
  opening_hours?: string;
  source: "lead" | "crm" | "mcdonalds";
  category?: "A" | "B" | "C";
  appointment?: Appointment;
};
type Status = "standard" | "visited" | "repeat" | "hot" | "skip";
const statusMeta: Record<Status, { label: string; color: string }> = {
  standard: { label: "Standard", color: "#10b981" },
  visited: { label: "Besucht", color: "#facc15" },
  repeat: { label: "Guter Laden (Wiederholen)", color: "#f97316" },
  hot: { label: "Heißer Shop", color: "#ef4444" },
  skip: { label: "Lohnt sich nicht", color: "#ffffff" },
};
const customerGroup = (p: Pick<Prospect, "id" | "tags" | "name">) => {
  const value =
    `${p.id ?? ""} ${p.tags?.join(" ") ?? ""} ${p.name}`.toLowerCase();
  return /(^|\s)sh-|\bsh\b|simply\s*hair/.test(value)
    ? "sh"
    : /(^|\s)gl-|\bgl\b|great\s*lengths/.test(value)
      ? "gl"
      : "standard";
};
const key = (p: Prospect) =>
  `${p.name}|${p.street}|${p.housenumber || ""}|${p.postcode}|${p.city}`;
function markerIcon(p: Prospect, status: Status, selected: boolean) {
  const fallback =
    p.source === "mcdonalds"
      ? "#c1121f"
      : p.source === "lead"
        ? "#b8f23f"
        : customerGroup(p) === "sh"
          ? "#3b82f6"
          : customerGroup(p) === "gl"
            ? "#9333ea"
            : "#10b981";
  const color = statusMeta[status]?.color ?? fallback;
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #17191b;box-shadow:${selected ? "0 0 0 4px rgba(23,25,27,.35)" : "none"}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });
}
function Recenter({
  center,
  selected,
}: {
  center: [number, number];
  selected?: Prospect;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(
      selected?.lat != null && selected.lng != null
        ? [selected.lat, selected.lng]
        : center,
      selected ? 15 : 12,
    );
  }, [map, center, selected]);
  return null;
}
function LocationControl({
  onLocate,
}: {
  onLocate: (coords: [number, number]) => void;
}) {
  const map = useMap();
  const [message, setMessage] = useState("");
  function locate() {
    if (!navigator.geolocation) return setMessage("Standort nicht verfügbar");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        onLocate(coords);
        map.flyTo(coords, 14);
        setMessage("Standort gefunden");
      },
      () => setMessage("Standort nicht verfügbar"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }
  return (
    <div className="leaflet-top leaflet-left z-[1000] m-3 max-sm:fixed max-sm:bottom-20 max-sm:left-3 max-sm:top-auto max-sm:m-0">
      <button
        type="button"
        onClick={locate}
        className="rounded-xl border border-[#d4d8d2] bg-[#f8faf6]/95 px-3 py-2 text-xs font-semibold text-[#17191b] shadow-lg"
      >
        Mein Standort
      </button>
      {message && (
        <span className="ml-2 rounded-lg bg-[#f8faf6]/95 px-2 py-2 text-[10px] text-[#52605a] shadow">
          {message}
        </span>
      )}
    </div>
  );
}
export function ProspectMap({
  center,
  prospects,
  selected,
  onSelect,
  layers,
  setLayers,
  visited,
  visitKey,
  onToggleVisited,
  showVisited,
  setShowVisited,
  routeStops,
  onToggleRoute,
  onSchedule,
  statuses,
  onStatusChange,
  onLocate,
}: {
  center: [number, number];
  prospects: Prospect[];
  selected?: Prospect;
  onSelect: (p: Prospect) => void;
  layers: { lead: boolean; crm: boolean };
  setLayers: React.Dispatch<
    React.SetStateAction<{ lead: boolean; crm: boolean }>
  >;
  visited: Record<string, boolean>;
  visitKey: (p: Prospect) => string;
  onToggleVisited: (p: Prospect) => void;
  showVisited: boolean;
  setShowVisited: (v: boolean) => void;
  routeStops: Prospect[];
  onToggleRoute: (p: Prospect) => void;
  onSchedule: (
    p: Prospect,
    date: string,
    time: string,
    duration?: number,
  ) => void;
  statuses?: Record<string, Status>;
  onStatusChange?: (p: Prospect, status: Status) => void;
  onLocate?: (coords: [number, number]) => void;
}) {
  const route = routeStops
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => [p.lat as number, p.lng as number] as [number, number]);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, Status>>(
    {},
  );
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setLocation(coords);
        onLocate?.(coords);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [onLocate]);
  const changeStatus = (p: Prospect, value: Status) => {
    setLocalStatuses((current) => ({ ...current, [visitKey(p)]: value }));
    onStatusChange?.(p, value);
    if (value === "visited" || value === "skip") onToggleRoute(p);
  };
  const visible = useMemo(
    () =>
      prospects
        .filter((p) => (p.source === "lead" ? layers.lead : layers.crm))
        .filter((p) => showVisited || !visited[visitKey(p)]),
    [layers, prospects, showVisited, visited, visitKey],
  );
  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="relative h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} selected={selected} />
      <LocationControl
        onLocate={(coords) => {
          setLocation(coords);
          onLocate?.(coords);
        }}
      />
      {route.length > 1 && (
        <Polyline
          positions={route}
          pathOptions={{ color: "#17191b", weight: 3, dashArray: "6 8" }}
        />
      )}
      {location && (
        <Marker
          position={location}
          icon={L.divIcon({
            className: "",
            html: '<span style="position:relative;display:block;width:42px;height:42px;border-radius:50%;background:rgba(37,99,235,.16)"><span style="position:absolute;inset:9px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 1px 5px rgba(23,25,27,.55);animation:truffel-location-pulse 1.8s ease-out infinite"></span></span>',
            iconSize: [42, 42],
            iconAnchor: [21, 21],
          })}
        />
      )}
      {visible.map(
        (p) =>
          p.lat != null &&
          p.lng != null && (
            <Marker
              key={key(p)}
              position={[p.lat, p.lng]}
              icon={markerIcon(
                p,
                localStatuses[visitKey(p)] ??
                  statuses?.[visitKey(p)] ??
                  (visited[visitKey(p)] ? "visited" : "standard"),
                selected ? key(selected) === key(p) : false,
              )}
              eventHandlers={{ click: () => onSelect(p) }}
            >
              <Popup>
                <div className="min-w-48">
                  <strong className="block text-sm">{p.name}</strong>
                  <span className="block text-xs text-[#52605a]">{p.city}</span>
                  <div className="mt-3 grid gap-1">
                    {(Object.keys(statusMeta) as Status[]).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => changeStatus(p, value)}
                        className="rounded-md px-2 py-1 text-left text-xs hover:bg-[#eef1ec]"
                      >
                        <span
                          className="mr-2 inline-block size-2 rounded-full border border-[#17191b]"
                          style={{ background: statusMeta[value].color }}
                        />
                        {statusMeta[value].label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleRoute(p)}
                    className="mt-2 w-full rounded-md bg-[#17191b] px-2 py-1 text-xs text-[#f5f3ef]"
                  >
                    {routeStops.some((s) => key(s) === key(p))
                      ? "Aus Tour entfernen"
                      : "Zur Tour hinzufügen"}
                  </button>
                </div>
              </Popup>
            </Marker>
          ),
      )}
    </MapContainer>
  );
}
export { key as prospectKey };
export type { Prospect, Status };
