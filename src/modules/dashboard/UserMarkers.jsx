import { useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { toast } from "react-toastify";
import { Bike, Clock3, MapPinCheck } from "lucide-react";
import { FcHighBattery } from "react-icons/fc";
import { GiNetworkBars } from "react-icons/gi";
import { makeRequest } from "../../api/httpClient";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import SmartSelectInput from "../../components/form-inputs/smartSelectInput";

const INDIA_BOUNDS = { north: 37.6, south: 6.4, west: 68.1, east: 97.4, };
const INDIA_MAX_BOUNDS = [[INDIA_BOUNDS.south, INDIA_BOUNDS.west], [INDIA_BOUNDS.north, INDIA_BOUNDS.east],];
const DEFAULT_CENTER = [18.5204, 73.8567];
const DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, });
L.Marker.prototype.options.icon = DefaultIcon;

const parseAliveData = (aliveData) => {
    if (!aliveData) return {};
    if (typeof aliveData === "object") return aliveData;

    try {
        return JSON.parse(aliveData);
    } catch {
        return {};
    }
};

const getAliveValue = (aliveData, keys) => {
    for (const key of keys) {
        const value = aliveData?.[key];
        if (value !== undefined && value !== null && value !== "") return value;
    }
    return null;
};

const formatBattery = (value) => {
    if (value === null || value === undefined || value === "") return "N/A";

    const battery = Number(value);
    if (!Number.isFinite(battery)) return value;

    return battery > 1 ? `${battery}%` : `${Math.round(battery * 100)}%`;
};

const formatDateTime = (value = "") => {
    if (!value) return "-";

    const date = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatLastSignal = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const diffInSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    return `${Math.floor(diffInHours / 24)} days ago`;
};

const openNavigation = (latitude, longitude) => { window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, "_blank", "noopener,noreferrer"); };

const normalizeVisitPoint = (visit) => {
    const latitude = Number(visit.latitude || visit.visited_latitude);
    const longitude = Number(visit.longitude || visit.visited_longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
        ...visit,
        latitude,
        longitude,
    };
};

const getVisitKey = (visit, index = 0) => String(visit.visit_id || `${visit.ticket_id || "visit"}-${index}`);

const getVisitIcon = (visit, isSelected = false) => {
    const status = String(visit.visit_status || "").toLowerCase();
    const isScheduled = status === "scheduled";
    const Icon = isScheduled ? Clock3 : MapPinCheck;
    const color = isScheduled ? "#f59e0b" : "#2563eb";
    const size = isSelected ? 34 : 28;
    const iconSize = isSelected ? 18 : 15;
    const iconSvg = renderToStaticMarkup(<Icon size={iconSize} strokeWidth={2.8} color="#ffffff" />);

    return L.divIcon({
        className: "",
        html: `
            <div style=" height:${size}px; width:${size}px; display:flex; align-items:center; justify-content:center; border-radius:999px; background:${color}; border:3px solid #ffffff; box-shadow:0 8px 20px rgba(37,99,235,.35); ${isSelected ? "outline:4px solid rgba(37,99,235,.22);" : ""} ">
                ${iconSvg}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)],
    });
};

const MovingRouteIcon = L.divIcon({
    className: "",
    html: `
        <div style=" height:28px; width:28px; display:flex; align-items:center; justify-content:center; border-radius:999px; background:#fa850f; border:1px solid #ffffff; box-shadow:0 10px 22px rgba(15,23,42,.35); ">
            ${renderToStaticMarkup(<Bike size={17} strokeWidth={2.8} color="#ffffff" />)}
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

function UserPopup({ user }) {
    const aliveData = parseAliveData(user.alive_data);
    const battery = getAliveValue(aliveData, ["battery_percent",]);
    const network = getAliveValue(aliveData, ["network_type",]);
    const charging = getAliveValue(aliveData, ["charging", "is_charging", "isCharging"]);
    const lastSignal = getAliveValue(aliveData, ["last_seen",]);
    const locationText = user.location || null;

    return (
        <div className="w-[230px] rounded-xl bg-white/95 p-3 text-slate-950 shadow-xl backdrop-blur">
            <div className="mb-2 mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[13px] font-bold leading-4">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.18)]" />
                        <span className="truncate">{user.name || "Unnamed User"}</span>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1 pr-4">
                    <span className="inline-flex h-6 items-center gap-1 rounded-md bg-white px-1.5 text-[9px] font-semibold leading-none">
                        <FcHighBattery className="shrink-0" size={12} />
                        <span>{formatBattery(battery)}</span>
                    </span>
                    <span className="inline-flex h-6 items-center gap-1 rounded-md bg-white px-1.5 text-[9px] font-semibold leading-none">
                        <GiNetworkBars className="shrink-0 text-blue-600" size={12} />
                        <span>{network || "N/A"}</span>
                    </span>
                </div>
            </div>

            {locationText && (
                <div className="border-b border-slate-200 pb-2">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Address</div>
                    <div className="mt-0.5 text-xs leading-4">{locationText}</div>
                </div>
            )}

            <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-slate-200 py-2">
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Coordinates</div>
                    <div className="mt-0.5 text-xs leading-4">
                        {user.latitude}, {user.longitude}
                    </div>
                </div>
                <button
                    type="button"
                    className="self-center rounded-md border border-blue-100 px-1.5 py-1 text-[10px] font-semibold leading-none text-blue-700 hover:bg-blue-50"
                    onClick={() => navigator.clipboard?.writeText(`${user.latitude}, ${user.longitude}`)}
                    title="Copy coordinates"
                >
                    Copy
                </button>
            </div>

            {charging !== null && (
                <div className="border-b border-slate-200 py-2 text-[11px] text-slate-600">
                    Charging: {String(charging)}
                </div>
            )}

            <div className="py-2">
                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Last Signal</div>
                <div className="mt-0.5 text-xs leading-4">{formatLastSignal(lastSignal)}</div>
            </div>

            <button
                type="button"
                className="mt-0.5 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                onClick={() => openNavigation(user.latitude, user.longitude)}
            >
                Navigate
            </button>
        </div>
    );
}

function VisitPopup({ visit, index }) {
    const visitTime = visit.visited_at || visit.visit_scheduled_at;
    const details = visit.visit_details || "Visit details not added.";
    const ticketLabel = visit.ticket_no || (visit.ticket_id ? `Ticket #${visit.ticket_id}` : "Ticket not linked");

    return (
        <div className="w-[250px] rounded-xl bg-white/95 p-3 text-slate-950 shadow-xl backdrop-blur">
            <div className="mb-2 mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[13px] font-bold leading-4">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 shadow-[0_0_0_3px_rgba(37,99,235,0.18)]" />
                        <span className="truncate">Visit #{visit.visit_id}</span>
                    </div>
                    <div className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                        {visit.employee_name || "Employee"}
                    </div>
                </div>

                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-700">
                    {visit.visit_status || "visited"}
                </span>
            </div>

            <div className="border-b border-slate-200 pb-2">
                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Ticket</div>
                <div className="mt-0.5 text-xs font-semibold leading-4">{ticketLabel}</div>
            </div>

            <div className="border-b border-slate-200 py-2">
                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Visit Time</div>
                <div className="mt-0.5 text-xs leading-4">{formatDateTime(visitTime)}</div>
            </div>

            <div className="border-b border-slate-200 py-2">
                <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Details</div>
                <div className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-4">{details}</div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-slate-200 py-2">
                <div>
                    <div className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Coordinates</div>
                    <div className="mt-0.5 text-xs leading-4">
                        {visit.latitude}, {visit.longitude}
                    </div>
                </div>
                <button
                    type="button"
                    className="self-center rounded-md border border-blue-100 px-1.5 py-1 text-[10px] font-semibold leading-none text-blue-700 hover:bg-blue-50"
                    onClick={() => navigator.clipboard?.writeText(`${visit.latitude}, ${visit.longitude}`)}
                    title="Copy coordinates"
                >
                    Copy
                </button>
            </div>

            <button
                type="button"
                className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                onClick={() => openNavigation(visit.latitude, visit.longitude)}
            >
                Navigate
            </button>
        </div>
    );
}

function MapViewport({ center, positions, zoom }) {
    const map = useMap();

    useEffect(() => {
        if (positions.length > 1) {
            map.fitBounds(positions, { padding: [40, 40], maxZoom: 14 });
            return;
        }

        map.setView(center, zoom);
    }, [center, map, positions, zoom]);

    return null;
}

function MovingRouteMarker({ positions = [] }) {
    const route = useMemo(
        () => positions
            .map(([latitude, longitude]) => [Number(latitude), Number(longitude)])
            .filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude)),
        [positions]
    );
    const [step, setStep] = useState(0);
    const stepsPerSegment = 45;

    useEffect(() => {
        setStep(0);
        if (route.length < 2) return undefined;

        const intervalId = window.setInterval(() => {
            setStep((current) => (current + 1) % ((route.length - 1) * stepsPerSegment));
        }, 120);

        return () => window.clearInterval(intervalId);
    }, [route, stepsPerSegment]);

    if (route.length < 2) return null;

    const segmentIndex = Math.min(Math.floor(step / stepsPerSegment), route.length - 2);
    const progress = (step % stepsPerSegment) / stepsPerSegment;
    const [startLatitude, startLongitude] = route[segmentIndex];
    const [endLatitude, endLongitude] = route[segmentIndex + 1];
    const position = [
        startLatitude + (endLatitude - startLatitude) * progress,
        startLongitude + (endLongitude - startLongitude) * progress,
    ];

    return (
        <Marker
            position={position}
            icon={MovingRouteIcon}
            interactive={false}
            zIndexOffset={1000}
        />
    );
}

function ClusteredMapMarkers({
    users = [],
    visits = [],
    selectedVisitKey = "",
}) {
    const map = useMap();

    useEffect(() => {
        const clusterGroup = L.markerClusterGroup({
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
        });

        visits.forEach(({ visit, index }) => {
            const visitKey = getVisitKey(visit, index);
            const marker = L.marker([visit.latitude, visit.longitude], {
                icon: getVisitIcon(visit, selectedVisitKey === visitKey),
            });

            marker.bindPopup(renderToStaticMarkup(<VisitPopup visit={visit} index={index} />), {
                className: "user-location-popup",
                closeButton: true,
            });
            marker.on("mouseover", () => marker.openPopup());
            marker.on("click", () => marker.openPopup());
            clusterGroup.addLayer(marker);
        });

        users.forEach((user, index) => {
            const latitude = Number(user.latitude);
            const longitude = Number(user.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

            const marker = L.marker([latitude, longitude], {
                title: user.name || `User ${index + 1}`,
            });

            marker.bindPopup(renderToStaticMarkup(<UserPopup user={user} />), {
                className: "user-location-popup",
                closeButton: true,
            });
            marker.on("mouseover", () => marker.openPopup());
            marker.on("click", () => marker.openPopup());
            clusterGroup.addLayer(marker);
        });

        map.addLayer(clusterGroup);

        return () => {
            map.removeLayer(clusterGroup);
        };
    }, [map, selectedVisitKey, users, visits]);

    return null;
}

export function UserMarkers() {
    const [markers, setMarkers] = useState([]);
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visitsLoading, setVisitsLoading] = useState(false);
    const [selectedVisitKey, setSelectedVisitKey] = useState("");
    const default_filter = {
        'employee_id': null,
        'from_date': null,
        'to_date': null,
        'showVisits': false,
    };
    const [filter, setFilter] = useState(default_filter);

    const getMarkers = async () => {
        setLoading(true);
        if (filter.showVisits) setVisitsLoading(true);
        const res = await makeRequest("/users/get-markers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: filter,
        });
        setLoading(false);
        setVisitsLoading(false);

        if (res.success) {
            setMarkers(res.data || []);
            setVisits(filter.showVisits ? res.visits || [] : []);
            return;
        }

        setVisits([]);
        toast.error(res?.message || "Error while fetching markers");
    };

    useEffect(() => {
        getMarkers();
        setSelectedVisitKey("");
    }, [filter]);

    const validUsers = useMemo(() => markers.filter((user) => user.latitude && user.longitude),
        [markers, filter]
    );

    const visitPoints = useMemo(
        () => visits.map(normalizeVisitPoint).filter(Boolean), [visits]
    );
    const visibleVisitItems = useMemo(
        () => visitPoints
            .map((visit, index) => ({ visit, index }))
            .filter(({ visit, index }) => !selectedVisitKey || getVisitKey(visit, index) === selectedVisitKey),
        [selectedVisitKey, visitPoints]
    );
    const routePositions = visibleVisitItems.map(({ visit }) => [visit.latitude, visit.longitude]);
    const center = validUsers[0]
        ? [Number(validUsers[0].latitude), Number(validUsers[0].longitude)]
        : routePositions[0] || DEFAULT_CENTER;

    return (
        <div className="h-[90%] w-full p-1">
            <div className="grid h-full gap-3 lg:grid-cols-[300px_1fr]">
                <aside className="flex h-full flex-col overflow-hidden border-r border-slate-200 bg-white">
                    <div className="border-b border-slate-200 p-3">
                        <h2 className="text-sm font-bold text-slate-900">Map Filters</h2>
                        <p className="mt-0.5 text-[11px] text-slate-500">User wise ani date wise visits paha.</p>
                    </div>

                    <div className="space-y-3 border-b border-slate-200 p-3">
                        <div className="block">
                            <SmartSelectInput
                                id="employee_id"
                                field={{
                                    name: "employee_id",
                                    label: "Select Employee",
                                }}
                                value={filter.employee_id}
                                onSelect={(value) => {
                                    setFilter((current) => ({
                                        ...current,
                                        'employee_id': value,
                                    }));
                                }}
                                config={{
                                    apiUrl: "/system/searchAssignee",
                                    type: "assignee",
                                    source: "admin",
                                    list: "adminID,name,status",
                                    check: "name",
                                    getValue: (item) => item.adminID,
                                    getLabel: (item) => item.name || "Unnamed Assignee",
                                    countKey: "pending_tickets_count",
                                    countLabel: "pending",
                                    placeholder: "Select User",
                                    multi: false
                                }}
                            />
                        </div>
                        {filter.employee_id && 
                        <>
                            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                                <input
                                    name="showVisits"
                                    type="checkbox"
                                    checked={filter.showVisits}
                                    onChange={() => {
                                        setFilter((current) => ({
                                            ...current,
                                            ['showVisits']: !filter.showVisits,
                                        }));
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                Show Visits
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    From Date
                                </span>
                                <input
                                    type="date"
                                    value={filter.from_date}
                                    onChange={(event) => {
                                        setFilter((current) => ({
                                            ...current,
                                            ['from_date']:event.target.value,
                                        }));
                                    }}
                                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    To Date
                                </span>
                                <input
                                    type="date"
                                    value={filter.to_date}
                                    onChange={(event) => {
                                        setFilter((current) => ({
                                            ...current,
                                            ['to_date']:event.target.value,
                                        }));
                                    }}
                                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </label>
                        </>
                        }

                        <button type="button" onClick={() => { setFilter(default_filter); setSelectedVisitKey(""); }} className="h-8 w-full rounded-md border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50" >
                            Reset Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-b border-slate-200 p-3 text-xs">
                        <div className="rounded-md bg-slate-50 p-2">
                            <div className="text-[10px] uppercase text-slate-500">Users</div>
                            <div className="text-base font-bold text-slate-900">{validUsers.length}</div>
                        </div>
                        <div className="rounded-md bg-blue-50 p-2">
                            <div className="text-[10px] uppercase text-blue-600">Visits</div>
                            <div className="text-base font-bold text-blue-700">{visitPoints.length}</div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Visits
                            </span>
                            {selectedVisitKey && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedVisitKey("")}
                                    className="rounded-md border border-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"
                                >
                                    Show all
                                </button>
                            )}
                        </div>

                        {visitsLoading ? (
                            <div className="rounded-md border border-slate-200 p-3 text-center text-xs text-slate-500">
                                Loading visits...
                            </div>
                        ) : !visitPoints.length ? (
                            <div className="rounded-md border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">
                                No visits found for selected filters.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {visitPoints.map((visit, index) => (
                                    <button
                                        type="button"
                                        key={getVisitKey(visit, index)}
                                        onClick={() => setSelectedVisitKey((current) => current === getVisitKey(visit, index) ? "" : getVisitKey(visit, index))}
                                        className={`w-full rounded-md border p-2 text-left text-xs shadow-sm transition ${selectedVisitKey === getVisitKey(visit, index)
                                                ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                                                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-slate-900">
                                                Visit #{index + 1}
                                            </span>
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                                                {visit.visit_status || "visited"}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-slate-500">
                                            {formatDateTime(visit.visited_at || visit.visit_scheduled_at)}
                                        </div>
                                        <div className="mt-1 truncate text-slate-500">
                                            {visit.visit_details || visit.ticket_id ? `Ticket: ${visit.ticket_id || "-"}` : "Visit location"}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <section className="min-h-[620px] overflow-hidden bg-white shadow-sm">
                    {loading ? (
                        <h1 className="w-full p-4 text-center text-sm text-slate-500">Loading map...</h1>
                    ) : (
                        <MapContainer
                            className="shadow-md z-10"
                            center={center}
                            zoom={filter.employee_id ? 12 : 5}
                            minZoom={5}
                            maxBounds={INDIA_MAX_BOUNDS}
                            maxBoundsViscosity={1}
                            style={{ height: "100%", width: "100%" }}
                        >
                            <MapViewport
                                center={center}
                                positions={[
                                    ...routePositions,
                                    ...validUsers.map((user) => [Number(user.latitude), Number(user.longitude)]),
                                ]}
                                zoom={filter.employee_id ? 12 : 5}
                            />
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                            {routePositions.length > 1 && (
                                <>
                                    <Polyline
                                        positions={routePositions}
                                        pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.75 }}
                                    />
                                    <MovingRouteMarker positions={routePositions.reverse()} />
                                </>
                            )}

                            <ClusteredMapMarkers
                                users={validUsers}
                                visits={visibleVisitItems}
                                selectedVisitKey={selectedVisitKey}
                            />
                        </MapContainer>
                    )}
                </section>
            </div>
        </div>
    );
}

export default UserMarkers;
