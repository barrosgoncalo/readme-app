// Side-effect import: fixes Leaflet's default marker icon URLs, which break
// under Vite's asset bundling unless explicitly re-pointed at the bundled files.
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Colored teardrop pins (CSS-only, no extra image assets) used to
// distinguish marker layers the way mobile's LocationPickerMap does: brown
// for the seller's pre-set locations, red for the custom draggable pin
// while proposing an alternative, blue for the original offer's location
// on counter-offers, and a highlight color for whichever pin is selected.
const iconCache = new Map();

export function createColoredIcon(hexColor) {
    if (iconCache.has(hexColor)) return iconCache.get(hexColor);

    const icon = L.divIcon({
        className: 'colored-pin-icon',
        html: `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${hexColor}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
        </svg>`,
        iconSize: [25, 41],
        iconAnchor: [12.5, 41],
        popupAnchor: [0, -34],
    });

    iconCache.set(hexColor, icon);
    return icon;
}

export const SELLER_PIN_COLOR = '#A35C37';
export const CUSTOM_PIN_COLOR = '#E53E3E';
export const ORIGINAL_PIN_COLOR = '#4A90E2';
export const SELECTED_PIN_COLOR = '#2F855A';

export const SELLER_ICON = createColoredIcon(SELLER_PIN_COLOR);
export const CUSTOM_ICON = createColoredIcon(CUSTOM_PIN_COLOR);
export const ORIGINAL_ICON = createColoredIcon(ORIGINAL_PIN_COLOR);
export const SELECTED_ICON = createColoredIcon(SELECTED_PIN_COLOR);
