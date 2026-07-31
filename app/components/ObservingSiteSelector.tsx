"use client";

import { useState } from "react";
import type { Locale } from "../i18n/types";
import type { ObservingSite } from "../simulation/observing-sites";
import {
  isValidLatitude,
  isValidLongitude,
} from "../simulation/observing-sites";

type ObservingSiteSelectorProps = {
  sites: readonly ObservingSite[];
  selectedSite: ObservingSite;
  onChange: (siteId: string) => void;
  onSaveCustom: (name: string, latitude: number, longitude: number) => void;
  locale: Locale;
};

const COPY = {
  "zh-TW": {
    location: "觀測地點",
    selectLocation: "選擇觀測地點",
    addCustom: "新增自訂位置",
    name: "名稱",
    namePlaceholder: "例如：住家陽台",
    latitude: "緯度",
    longitude: "經度",
    locating: "定位中…",
    useCurrent: "使用目前位置",
    save: "儲存位置",
    missingCoordinates: "請輸入緯度與經度。",
    invalidCoordinates: "請輸入有效的緯度（-90～90）與經度（-180～180）。",
    defaultName: "自訂位置",
    saved: "已儲存並切換至自訂位置。",
    unsupported: "此瀏覽器不支援定位功能。",
    currentLocation: "目前位置",
    located: "已取得座標，確認後即可儲存。",
    locationFailed: "無法取得位置，請檢查定位權限或手動輸入座標。",
  },
  en: {
    location: "Observing site",
    selectLocation: "Select an observing site",
    addCustom: "Add custom location",
    name: "Name",
    namePlaceholder: "For example: Home balcony",
    latitude: "Latitude",
    longitude: "Longitude",
    locating: "Locating…",
    useCurrent: "Use current location",
    save: "Save location",
    missingCoordinates: "Enter a latitude and longitude.",
    invalidCoordinates: "Enter a latitude from -90 to 90 and longitude from -180 to 180.",
    defaultName: "Custom location",
    saved: "Custom location saved and selected.",
    unsupported: "Geolocation is not supported by this browser.",
    currentLocation: "Current location",
    located: "Coordinates received. Review and save this location.",
    locationFailed: "Could not get your location. Check permission or enter coordinates manually.",
  },
} as const;

export function ObservingSiteSelector({
  sites,
  selectedSite,
  onChange,
  onSaveCustom,
  locale,
}: ObservingSiteSelectorProps) {
  const copy = COPY[locale];
  const nameLocale = locale === "zh-TW" ? "zh-TW" : "en";
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [message, setMessage] = useState("");
  const [locating, setLocating] = useState(false);

  const saveCustomSite = () => {
    if (!latitude.trim() || !longitude.trim()) {
      setMessage(copy.missingCoordinates);
      return;
    }
    const latitudeValue = Number(latitude);
    const longitudeValue = Number(longitude);
    if (!isValidLatitude(latitudeValue) || !isValidLongitude(longitudeValue)) {
      setMessage(copy.invalidCoordinates);
      return;
    }
    onSaveCustom(name.trim() || copy.defaultName, latitudeValue, longitudeValue);
    setName("");
    setLatitude("");
    setLongitude("");
    setMessage(copy.saved);
  };

  const requestCurrentPosition = () => {
    if (!navigator.geolocation) {
      setMessage(copy.unsupported);
      return;
    }
    setLocating(true);
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setName(copy.currentLocation);
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
        setMessage(copy.located);
      },
      () => {
        setLocating(false);
        setMessage(copy.locationFailed);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <div className="observing-site-control">
      <span className="observing-site-heading">
        <span>{copy.location}</span>
        <strong>{selectedSite.name[nameLocale]}</strong>
      </span>
      <label className="observing-site-select-wrap">
        <span className="sr-only">{copy.selectLocation}</span>
        <select
          className="observing-site-select"
          value={selectedSite.id}
          onChange={(event) => onChange(event.target.value)}
          aria-label={copy.selectLocation}
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name[nameLocale]} · {site.region[nameLocale]}
            </option>
          ))}
        </select>
        <span className="observing-site-chevron" aria-hidden="true" />
      </label>
      <span className="observing-site-coordinates">
        {Math.abs(selectedSite.latitude).toFixed(4)}°
        {selectedSite.latitude >= 0 ? "N" : "S"} ·{" "}
        {Math.abs(selectedSite.longitude).toFixed(4)}°
        {selectedSite.longitude >= 0 ? "E" : "W"}
      </span>
      <details className="custom-location-details">
        <summary>{copy.addCustom}</summary>
        <div className="custom-location-form">
          <label>
            <span>{copy.name}</span>
            <input
              type="text"
              value={name}
              maxLength={40}
              placeholder={copy.namePlaceholder}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="custom-coordinate-row">
            <label>
              <span>{copy.latitude}</span>
              <input
                type="number"
                value={latitude}
                min={-90}
                max={90}
                step="any"
                inputMode="decimal"
                placeholder="25.0330"
                onChange={(event) => setLatitude(event.target.value)}
              />
            </label>
            <label>
              <span>{copy.longitude}</span>
              <input
                type="number"
                value={longitude}
                min={-180}
                max={180}
                step="any"
                inputMode="decimal"
                placeholder="121.5654"
                onChange={(event) => setLongitude(event.target.value)}
              />
            </label>
          </div>
          <div className="custom-location-actions">
            <button
              type="button"
              onClick={requestCurrentPosition}
              disabled={locating}
            >
              {locating ? copy.locating : copy.useCurrent}
            </button>
            <button type="button" onClick={saveCustomSite}>
              {copy.save}
            </button>
          </div>
          {message && <p role="status">{message}</p>}
        </div>
      </details>
    </div>
  );
}
