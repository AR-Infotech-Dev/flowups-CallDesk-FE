import { toast } from "react-toastify";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect ,useRef} from "react";
import { makeRequest } from "../../api/httpClient";
// Fix marker issue
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import SmartSelectInput from "../../components/form-inputs/smartSelectInput";

const users = [
    {
        id: 1,
        name: "Aniket",
        city: "Pune",
        latitude: 18.5204,
        longitude: 73.8567,
    },
    {
        id: 2,
        name: "Rahul",
        city: "Mumbai",
        latitude: 19.0760,
        longitude: 72.8777,
    },
    {
        id: 3,
        name: "Sneha",
        city: "Delhi",
        latitude: 28.6139,
        longitude: 77.2090,
    },
    {
        id: 4,
        name: "Priya",
        city: "Bangalore",
        latitude: 12.9716,
        longitude: 77.5946,
    },
    {
        id: 5,
        name: "Amit",
        city: "Hyderabad",
        latitude: 17.3850,
        longitude: 78.4867,
    },
    {
        id: 6,
        name: "Neha",
        city: "Chennai",
        latitude: 13.0827,
        longitude: 80.2707,
    },
    {
        id: 7,
        name: "Vikram",
        city: "Kolkata",
        latitude: 22.5726,
        longitude: 88.3639,
    },
    {
        id: 8,
        name: "Rohan",
        city: "Ahmedabad",
        latitude: 23.0225,
        longitude: 72.5714,
    },
    {
        id: 9,
        name: "Pooja",
        city: "Jaipur",
        latitude: 26.9124,
        longitude: 75.7873,
    },
    {
        id: 10,
        name: "Karan",
        city: "Nagpur",
        latitude: 21.1458,
        longitude: 79.0882,
    },
];
const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

export function UserMarkers() {
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const markerRef = useRef(null)
    const getMarkers = async () => {
        setLoading(true);
        const res = await makeRequest('/users/get-markers', {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        setLoading(false);

        if (res.success) {
            setMarkers(res.data || []);
            return;
        }
        toast.error(res?.message || "Error while fetching markers");
    };

    useEffect(() => {
        getMarkers();
    }, [])
    const onChangeHandler = (nextValue) => {
        setSelectedUser(nextValue);
        console.log('selected user : ', nextValue);
    }

    const validUsers = markers.filter((u) => u.latitude && u.longitude);
    return (
        <div className="w-full h-full p-1">
            {/* <div className="w-full">
                <SmartSelectInput
                    id={'user_id'}
                    value={''}
                    onSelect={onChangeHandler}
                    config={{
                        type: "admin",
                        source: "admin",
                        list: "adminID,name,",
                        placeholder: "Select User",
                        multi: true,
                        getValue: (item) => item.adminID,
                        getLabel: (item) => item.name || "Unnamed User",
                    }}
                />
            </div> */}
            {
                loading
                    ? <h1 className="w-full justify-center">Loading...</h1>
                    : <MapContainer
                        className="shadow-md"
                        center={[18.5204, 73.8567]} // Pune
                        zoom={5}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {validUsers.map((user, i) => (
                            <Marker
                                ref={markerRef}
                                key={i}
                                position={[
                                    Number(user.latitude),
                                    Number(user.longitude),
                                ]}
                                eventHandlers={{
                                    mouseover: () => {
                                        markerRef.current.openPopup();
                                    },
                                    mouseout: () => {
                                        markerRef.current.closePopup();
                                    },
                                }}
                            >
                                <Popup> <b>{user.name}</b><br /> Lat: {user.latitude} <br /> Lng: {user.longitude}</Popup>
                            </Marker>
                        ))}
                    </MapContainer>
            }
        </div>
    );
}

export default UserMarkers