'use client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Link from 'next/link';
import { useEffect } from 'react';

const getIconByPurpose = (purposes: any) => {
  if (!purposes) return '☕';
  
  const purpArray = typeof purposes === 'string' ? JSON.parse(purposes) : purposes;
  if (!Array.isArray(purpArray) || purpArray.length === 0) return '☕';
  
  const firstPurpose = purpArray[0].toLowerCase();

  if (firstPurpose.includes('wfc') || firstPurpose.includes('nugas')) return '💻';
  if (firstPurpose.includes('nongkrong')) return '🛋️';
  if (firstPurpose.includes('estetik') || firstPurpose.includes('foto')) return '📸';
  if (firstPurpose.includes('meeting') || firstPurpose.includes('diskusi')) return '🤝';
  
  return '☕';
};

const createUrbandungIcon = (cafe: any) => {
  const rating = parseFloat(cafe.avgRating) || 0;
  const ratingText = rating > 0 ? rating.toFixed(1) : 'N/A';
  const purposeIcon = getIconByPurpose(cafe.purpose);

  return L.divIcon({
    className: 'urbandung-custom-pin', 
    html: `
      <div class="pin-container" style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        cursor: pointer;
        transition: all 0.2s ease-out;
      ">
        

        <div class="pin-body" style="
          background-color: #2563eb; /* Blue 600 */
          color: white;
          padding: 6px 10px;
          border-radius: 16px;
          border: 3px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.25);
          display: flex;
          items-align: center;
          gap: 6px;
          white-space: nowrap;
          position: relative;
          z-index: 2;
        ">
          <span style="font-size: 16px; line-height: 1;">${purposeIcon}</span>
          
          ${rating > 0 ? `
            <div style="
              background-color: white;
              color: #1e40af; /* Blue 800 */
              font-weight: 900;
              font-size: 11px;
              padding: 1px 6px;
              border-radius: 20px;
              display: flex;
              align-items: center;
              gap: 2px;
              letter-spacing: -0.5px;
            ">
              <span style="color: #facc15;">⭐</span> ${ratingText}
            </div>
          ` : ''}
        </div>


        <div class="pin-tip" style="
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 9px solid white; /* Warna border */
          margin-top: -1px;
          position: relative;
          z-index: 1;
        "></div>
        <div class="pin-tip-color" style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 7px solid #2563eb; /* Warna Blue 600 */
          margin-top: -11px;
          position: relative;
          z-index: 2;
        "></div>

      </div>
    `,
    iconSize: [0, 0], 
    iconAnchor: [0, 0],
    popupAnchor: [0, -45] 
  });
};
function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom()); // Memaksa peta pindah
  return null;
}
export default function CafeMap({ cafes, userLoc }: { cafes: any[], userLoc: {lat: number, lng: number} }) {

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const centerLat = userLoc?.lat || -6.914744;
  const centerLng = userLoc?.lng || 107.609810;

  return (
    <div className="w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-0 mt-6 transition-all duration-300">
      <style jsx global>{`
        .urbandung-custom-pin:hover .pin-container {
          transform: translate(-50%, -105%) scale(1.1) !important;
        }
        .urbandung-custom-pin:hover .pin-body {
          background-color: #1e40af !important; /* Blue 800 saat hover */
          box-shadow: 0 8px 25px rgba(0,0,0,0.4) !important;
        }
        .urbandung-custom-pin:hover .pin-tip-color {
          border-top-color: #1e40af !important;
        }
        
        /* Styling Popup agar rapi */
        .leaflet-popup-content-wrapper {
          border-radius: 20px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .leaflet-popup-content {
          margin: 0;
          width: 220px !important;
        }
        .leaflet-popup-tip-container {
          margin-top: -1px;
        }
      `}</style>

      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >

        <ChangeMapView center={[centerLat, centerLng]} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
        />
        
        {userLoc && (
          <Marker position={[userLoc.lat, userLoc.lng]} icon={L.divIcon({
            className: 'user-pin-container',
            html: `
              <div style="position: relative; transform: translate(-50%, -50%);">
                <div style="background: rgba(239, 68, 68, 0.2); width: 40px; height: 40px; border-radius: 50%; position: absolute; animation: pulse-ring 2s infinite;"></div>
                <div style="background: #ef4444; color: white; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); position: relative; z-index: 2;"></div>
              </div>
              <style>
                @keyframes pulse-ring { 0% { transform: scale(0.5); opacity: 1; } 80%, 100% { transform: scale(1.3); opacity: 0; } }
              </style>
            `,
            iconSize: [0, 0]
          })}>
            <Popup><span className="font-black text-red-600 text-xs uppercase tracking-widest">Kamu Di Sini</span></Popup>
          </Marker>
        )}

        {cafes.map((cafe) => {
          if (!cafe.latitude || !cafe.longitude) return null;
          return (
            <Marker 
              key={cafe.id} 
              position={[Number(cafe.latitude), Number(cafe.longitude)]}
              icon={createUrbandungIcon(cafe)} 
            >
              <Popup closeButton={false}>
                <div className="flex flex-col">
                  <img 
                    src={cafe.imageUrl || 'https://via.placeholder.com/220x120'} 
                    className="w-full h-28 object-cover rounded-t-2xl" 
                    alt={cafe.name}
                  />
                  
                  <div className="p-4 flex flex-col gap-1.5">
                    <h3 className="font-black text-gray-950 text-base uppercase italic tracking-tighter leading-none line-clamp-1">
                      {cafe.name}
                    </h3>
                    
                    <p className="text-[10px] text-gray-500 line-clamp-1 mb-1 font-medium">
                      📍 {cafe.address}
                    </p>
                    
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-sm font-black text-gray-900">⭐ {cafe.avgRating}</span>
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">({cafe.reviews?.length || 0} Ulasan)</span>
                    </div>

                    <Link href={`/cafe/${cafe.id}`}>
                      <button className="w-full bg-blue-600 text-white text-xs font-black py-2.5 rounded-xl uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-md">
                        Lihat Detail
                      </button>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}