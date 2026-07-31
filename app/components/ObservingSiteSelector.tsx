import type { ObservingSite } from "../simulation/observing-sites";

type ObservingSiteSelectorProps = {
  sites: readonly ObservingSite[];
  selectedSite: ObservingSite;
  onChange: (siteId: string) => void;
};

export function ObservingSiteSelector({
  sites,
  selectedSite,
  onChange,
}: ObservingSiteSelectorProps) {
  return (
    <label className="observing-site-control">
      <span className="observing-site-heading">
        <span>觀測地點</span>
        <strong>{selectedSite.name["zh-TW"]}</strong>
      </span>
      <span className="observing-site-select-wrap">
        <select
          className="observing-site-select"
          value={selectedSite.id}
          onChange={(event) => onChange(event.target.value)}
          aria-label="選擇台灣觀測地點"
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name["zh-TW"]} · {site.region["zh-TW"]}
            </option>
          ))}
        </select>
        <span className="observing-site-chevron" aria-hidden="true" />
      </span>
      <span className="observing-site-coordinates">
        {selectedSite.latitude.toFixed(4)}°N ·{" "}
        {selectedSite.longitude.toFixed(4)}°E
      </span>
    </label>
  );
}
