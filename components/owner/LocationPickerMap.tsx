"use client";

import {
  divIcon,
  type LeafletMouseEvent,
} from "leaflet";

import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { useEffect } from "react";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationPickerMapProps = {
  position: Coordinates;

  onSelect: (
    latitude: number,
    longitude: number,
  ) => void;
};

const pinIcon =
  divIcon({
    className: "",

    html: `
      <div
        style="
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          background: #18181b;
          border: 4px solid white;
          box-shadow: 0 4px 14px rgba(0,0,0,.28);
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <div
          style="
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: #f59e0b;
          "
        ></div>
      </div>
    `,

    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

function MapClickHandler({
  onSelect,
}: {
  onSelect:
    LocationPickerMapProps["onSelect"];
}) {
  useMapEvents({
    click(
      event:
        LeafletMouseEvent,
    ) {
      onSelect(
        event.latlng.lat,
        event.latlng.lng,
      );
    },
  });

  return null;
}

function MapController({
  position,
}: {
  position: Coordinates;
}) {
  const map =
    useMap();

  useEffect(() => {
    map.flyTo(
      [
        position.latitude,
        position.longitude,
      ],
      map.getZoom(),
      {
        duration: 0.7,
      },
    );
  }, [
    map,
    position.latitude,
    position.longitude,
  ]);

  return null;
}

export default function LocationPickerMap({
  position,
  onSelect,
}: LocationPickerMapProps) {
  return (
    <MapContainer
      center={[
        position.latitude,
        position.longitude,
      ]}
      zoom={14}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController
        position={position}
      />

      <MapClickHandler
        onSelect={onSelect}
      />

      <Marker
        position={[
          position.latitude,
          position.longitude,
        ]}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend(event) {
            const marker =
              event.target;

            const latLng =
              marker.getLatLng();

            onSelect(
              latLng.lat,
              latLng.lng,
            );
          },
        }}
      />
    </MapContainer>
  );
}