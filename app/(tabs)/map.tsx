import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from '@/constants/theme';

// ── react-native-maps (native only) ──────────────────────────────────────────
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

// ── Google Directions API key (optional — enables real routing) ───────────────
const GOOGLE_MAPS_API_KEY = '';

/** Decode Google Maps encoded polyline */
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  type: 'prefeitura' | 'abrigo' | 'shopping' | 'cras' | 'igreja';
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  coordinate: { latitude: number; longitude: number };
  accepts: string[];
}

const COLLECTION_POINTS: CollectionPoint[] = [
  {
    id: '1', name: 'Sede SOS Jampa', address: 'Pça Central, s/n — Centro',
    phone: '(83) 3214-3090', hours: 'Seg–Sex 8h–17h', type: 'prefeitura',
    icon: 'account-balance', color: Colors.primary,
    coordinate: { latitude: -7.1195, longitude: -34.8450 },
    accepts: ['Alimentos', 'Roupas', 'Higiene', 'Financeiro'],
  },
  {
    id: '2', name: 'Ginásio Municipal', address: 'Av. Rui Carneiro, 650 — Miramar',
    phone: '(83) 3214-3100', hours: 'Todos os dias 7h–21h', type: 'abrigo',
    icon: 'sports-basketball', color: '#E65100',
    coordinate: { latitude: -7.1053, longitude: -34.8605 },
    accepts: ['Alimentos', 'Roupas', 'Materiais', 'Higiene'],
  },
  {
    id: '3', name: 'Ponto de Coleta Norte', address: 'R. Monsenhor Walfredo Leal — Mangabeira',
    phone: '(83) 3225-4700', hours: 'Seg–Sex 8h–16h', type: 'cras',
    icon: 'family-restroom', color: '#00838F',
    coordinate: { latitude: -7.1748, longitude: -34.8352 },
    accepts: ['Alimentos', 'Higiene', 'Roupas Infantis'],
  },
  {
    id: '4', name: 'Ponto Shopping Manaíra', address: 'Av. Flávio Ribeiro Coutinho — Manaíra (Estac. G)',
    phone: '—', hours: 'Seg–Dom 10h–22h', type: 'shopping',
    icon: 'local-mall', color: '#6A1B9A',
    coordinate: { latitude: -7.1070, longitude: -34.8390 },
    accepts: ['Alimentos', 'Roupas', 'Higiene'],
  },
  {
    id: '5', name: 'Ponto Shopping Centro', address: 'R. Treze de Maio, 200 — Centro',
    phone: '(83) 3208-4400', hours: 'Seg–Dom 9h–21h', type: 'shopping',
    icon: 'local-mall', color: '#6A1B9A',
    coordinate: { latitude: -7.1167, longitude: -34.8621 },
    accepts: ['Alimentos', 'Roupas', 'Calçados'],
  },
  {
    id: '6', name: 'CRAS Padre Zé — Distribuição', address: 'R. Dom Adauto — Padre Zé',
    phone: '(83) 3246-1230', hours: 'Seg–Sex 8h–16h', type: 'cras',
    icon: 'family-restroom', color: '#00838F',
    coordinate: { latitude: -7.0964, longitude: -34.8512 },
    accepts: ['Alimentos', 'Higiene', 'Financeiro'],
  },
  {
    id: '7', name: 'Ponto Comunitário Torre', address: 'R. Goiás, 400 — Torre',
    phone: '(83) 3222-6734', hours: 'Seg–Sáb 8h–18h', type: 'igreja',
    icon: 'place', color: Colors.accent,
    coordinate: { latitude: -7.1136, longitude: -34.8567 },
    accepts: ['Alimentos', 'Roupas', 'Materiais de Construção'],
  },
  {
    id: '8', name: 'Centro de Triagem Sul', address: 'R. João da Mata — Valentina',
    phone: '(83) 3214-3090', hours: 'Todos os dias 8h–20h', type: 'abrigo',
    icon: 'home', color: '#5D4037',
    coordinate: { latitude: -7.1634, longitude: -34.8241 },
    accepts: ['Alimentos', 'Roupas', 'Materiais', 'Higiene', 'Financeiro'],
  },
];

const TYPE_FILTERS = [
  { key: 'todos', label: 'Todos', icon: 'place' as const },
  { key: 'abrigo', label: 'Abrigos', icon: 'home' as const },
  { key: 'cras', label: 'CRAS', icon: 'family-restroom' as const },
  { key: 'shopping', label: 'Shoppings', icon: 'local-mall' as const },
  { key: 'prefeitura', label: 'Sede', icon: 'account-balance' as const },
  { key: 'igreja', label: 'Comunitário', icon: 'place' as const },
];

const JOAO_PESSOA_REGION = {
  latitude: -7.1200,
  longitude: -34.8500,
  latitudeDelta: 0.12,
  longitudeDelta: 0.10,
};

function openGoogleMapsNavigation(point: CollectionPoint) {
  const { latitude, longitude } = point.coordinate;
  const label = encodeURIComponent(point.name);
  const googleMapsApp = Platform.select({
    ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  const googleMapsBrowser = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}&travelmode=driving`;
  if (googleMapsApp) {
    Linking.canOpenURL(googleMapsApp)
      .then((s) => Linking.openURL(s ? googleMapsApp : googleMapsBrowser))
      .catch(() => Linking.openURL(googleMapsBrowser));
  } else {
    Linking.openURL(googleMapsBrowser);
  }
}

// ── Web: react-leaflet map ────────────────────────────────────────────────────
function WebLeafletMap({
  points,
  activeFilter,
  onFilter,
  filtered,
}: {
  points: CollectionPoint[];
  activeFilter: string;
  onFilter: (key: string) => void;
  filtered: CollectionPoint[];
}) {
  const [leafletReady, setLeafletReady] = useState(false);
  const [RL, setRL] = useState<any>(null);
  const [L, setL] = useState<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(null);

  useEffect(() => {
    // Inject leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamic imports
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, l]) => {
      setRL(rl);
      setL(l.default ?? l);
      setLeafletReady(true);
    }).catch(() => {});
  }, []);

  if (!leafletReady || !RL || !L) {
    return (
      <View style={styles.webMapLoading}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.webMapLoadingText}>Carregando mapa…</Text>
      </View>
    );
  }

  const { MapContainer, TileLayer, Marker: LeafletMarker, Popup, useMap } = RL;

  // Custom icon factory
  const makeIcon = (color: string, selected: boolean) => {
    const size = selected ? 44 : 36;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="18" fill="${color}" stroke="white" stroke-width="${selected ? 3.5 : 2.5}"/>
      <circle cx="22" cy="22" r="7" fill="white" opacity="0.9"/>
    </svg>`;
    return L.divIcon({
      html: svg,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2)],
    });
  };

  return (
    <View style={styles.webMapOuter}>
      {/* Filter chips */}
      <View style={styles.webFilterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => onFilter(f.key)}
            >
              <MaterialIcons name={f.icon} size={13} color={activeFilter === f.key ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.webPointCount}>{filtered.length} pontos</Text>
      </View>

      {/* Leaflet map */}
      <View style={styles.webMapContainer}>
        <MapContainer
          center={[JOAO_PESSOA_REGION.latitude, JOAO_PESSOA_REGION.longitude]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {filtered.map((point) => (
            <LeafletMarker
              key={point.id}
              position={[point.coordinate.latitude, point.coordinate.longitude]}
              icon={makeIcon(point.color, selectedPoint?.id === point.id)}
              eventHandlers={{ click: () => setSelectedPoint(point) }}
            >
              <Popup>
                <View style={{ minWidth: 200, maxWidth: 260 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: Colors.textPrimary, marginBottom: 4 }}>
                    {point.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textSubtle, marginBottom: 2 }}>
                    {point.address}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.textSubtle, marginBottom: 8 }}>
                    {point.hours}
                  </Text>
                  <Pressable
                    onPress={() => openGoogleMapsNavigation(point)}
                    style={{
                      backgroundColor: point.color,
                      borderRadius: 20,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <MaterialIcons name="navigation" size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Como Chegar</Text>
                  </Pressable>
                </View>
              </Popup>
            </LeafletMarker>
          ))}
        </MapContainer>
      </View>

      {/* Selected point card */}
      {selectedPoint ? (
        <View style={[styles.webDetailCard, { borderTopColor: selectedPoint.color }]}>
          <View style={styles.webDetailHeader}>
            <View style={[styles.webDetailIcon, { backgroundColor: selectedPoint.color + '22' }]}>
              <MaterialIcons name={selectedPoint.icon} size={20} color={selectedPoint.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.webDetailName} numberOfLines={1}>{selectedPoint.name}</Text>
              <Text style={styles.webDetailAddr} numberOfLines={1}>{selectedPoint.address}</Text>
            </View>
            <Pressable onPress={() => setSelectedPoint(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={20} color={Colors.textSubtle} />
            </Pressable>
          </View>
          <View style={styles.webDetailAccepts}>
            {selectedPoint.accepts.map((a) => (
              <View key={a} style={[styles.acceptChip, { borderColor: selectedPoint.color }]}>
                <Text style={[styles.acceptText, { color: selectedPoint.color }]}>{a}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={[styles.webNavBtn, { backgroundColor: selectedPoint.color }]}
            onPress={() => openGoogleMapsNavigation(selectedPoint)}
          >
            <MaterialIcons name="navigation" size={16} color="#fff" />
            <Text style={styles.webNavBtnText}>Como Chegar no Google Maps</Text>
          </Pressable>
        </View>
      ) : (
        // Horizontal card list at bottom
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.webBottomList}
          contentContainerStyle={styles.webBottomListContent}
        >
          {filtered.map((point) => (
            <Pressable
              key={point.id}
              style={({ pressed }) => [styles.webBottomCard, pressed && { opacity: 0.88 }]}
              onPress={() => setSelectedPoint(point)}
            >
              <View style={[styles.webBottomCardIcon, { backgroundColor: point.color + '22' }]}>
                <MaterialIcons name={point.icon} size={18} color={point.color} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.webBottomCardName} numberOfLines={1}>{point.name}</Text>
                <Text style={styles.webBottomCardAddr} numberOfLines={1}>{point.address}</Text>
              </View>
              <Pressable
                style={[styles.navMiniBtn, { backgroundColor: point.color }]}
                onPress={() => openGoogleMapsNavigation(point)}
              >
                <MaterialIcons name="navigation" size={13} color="#fff" />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── Route Info Banner (native) ────────────────────────────────────────────────
function RouteInfoBanner({ info, isStraightLine, onClear }: {
  info: { distance: string; duration: string } | null;
  isStraightLine: boolean;
  onClear: () => void;
}) {
  return (
    <View style={routeBannerStyles.container}>
      {info && !isStraightLine ? (
        <>
          <View style={routeBannerStyles.stat}>
            <MaterialIcons name="directions-car" size={16} color={Colors.primary} />
            <Text style={routeBannerStyles.value}>{info.duration}</Text>
            <Text style={routeBannerStyles.label}>tempo</Text>
          </View>
          <View style={routeBannerStyles.divider} />
          <View style={routeBannerStyles.stat}>
            <MaterialIcons name="straighten" size={16} color={Colors.primary} />
            <Text style={routeBannerStyles.value}>{info.distance}</Text>
            <Text style={routeBannerStyles.label}>distância</Text>
          </View>
        </>
      ) : (
        <View style={routeBannerStyles.stat}>
          <MaterialIcons name="timeline" size={16} color={Colors.accent} />
          <Text style={[routeBannerStyles.label, { color: Colors.accent, flex: 1 }]}>
            Rota direta (adicione API key para roteamento real)
          </Text>
        </View>
      )}
      <Pressable style={routeBannerStyles.clearBtn} onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialIcons name="close" size={16} color={Colors.textSubtle} />
      </Pressable>
    </View>
  );
}

const routeBannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm,
    ...Shadow.md,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  value: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  label: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false },
  divider: { width: 1, height: 28, backgroundColor: Colors.border },
  clearBtn: {
    width: 28, height: 28, borderRadius: Radii.full,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
});

// ── Point detail sheet (native) ───────────────────────────────────────────────
function PointDetailSheet({ point, onClose, onNavigate, onCall, onDrawRoute, loadingRoute, hasRoute }: {
  point: CollectionPoint; onClose: () => void; onNavigate: () => void; onCall: () => void;
  onDrawRoute: () => void; loadingRoute: boolean; hasRoute: boolean;
}) {
  return (
    <View style={[sheetStyles.container, { borderTopColor: point.color }]}>
      <View style={sheetStyles.handle} />
      <View style={sheetStyles.header}>
        <View style={[sheetStyles.iconWrap, { backgroundColor: point.color + '22' }]}>
          <MaterialIcons name={point.icon} size={24} color={point.color} />
        </View>
        <View style={sheetStyles.headerText}>
          <Text style={sheetStyles.name} numberOfLines={2}>{point.name}</Text>
          <View style={sheetStyles.addressRow}>
            <MaterialIcons name="location-on" size={12} color={Colors.textSubtle} />
            <Text style={sheetStyles.address} numberOfLines={1}>{point.address}</Text>
          </View>
        </View>
        <Pressable style={sheetStyles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={20} color={Colors.textSubtle} />
        </Pressable>
      </View>
      <View style={sheetStyles.infoRow}>
        <View style={sheetStyles.infoItem}><MaterialIcons name="schedule" size={14} color={Colors.primary} /><Text style={sheetStyles.infoText}>{point.hours}</Text></View>
        {point.phone !== '—' ? (<View style={sheetStyles.infoItem}><MaterialIcons name="phone" size={14} color={Colors.primary} /><Text style={sheetStyles.infoText}>{point.phone}</Text></View>) : null}
      </View>
      <View style={sheetStyles.acceptsWrap}>
        <Text style={sheetStyles.acceptsLabel}>Aceita:</Text>
        <View style={sheetStyles.acceptsRow}>
          {point.accepts.map((a) => (
            <View key={a} style={[sheetStyles.acceptChip, { borderColor: point.color }]}>
              <Text style={[sheetStyles.acceptText, { color: point.color }]}>{a}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={sheetStyles.actions}>
        <Pressable
          style={({ pressed }) => [sheetStyles.routeBtn, { borderColor: point.color, backgroundColor: hasRoute ? point.color + '18' : Colors.surface }, pressed && { opacity: 0.85 }]}
          onPress={onDrawRoute} disabled={loadingRoute}
        >
          {loadingRoute ? <ActivityIndicator size="small" color={point.color} /> : <MaterialIcons name={hasRoute ? 'route' : 'alt-route'} size={18} color={point.color} />}
          <Text style={[sheetStyles.routeBtnText, { color: point.color }]}>{loadingRoute ? 'Calculando…' : hasRoute ? 'Rota ativa' : 'Ver Rota'}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [sheetStyles.navBtn, { backgroundColor: point.color }, pressed && { opacity: 0.85 }]} onPress={onNavigate}>
          <MaterialIcons name="navigation" size={18} color="#fff" />
          <Text style={sheetStyles.navBtnText}>Como Chegar</Text>
        </Pressable>
        {point.phone !== '—' ? (
          <Pressable style={({ pressed }) => [sheetStyles.callBtn, pressed && { opacity: 0.85 }]} onPress={onCall}>
            <MaterialIcons name="phone" size={18} color={Colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('todos');
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [isStraightLine, setIsStraightLine] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const mapRef = useRef<any>(null);

  const filtered = COLLECTION_POINTS.filter((p) => activeFilter === 'todos' ? true : p.type === activeFilter);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationGranted(status === 'granted');
      })();
    }
  }, []);

  const clearRoute = useCallback(() => { setRouteCoords([]); setRouteInfo(null); setIsStraightLine(false); }, []);

  const handleCall = (phone: string, name: string) => {
    if (phone === '—') { Alert.alert(name, 'Telefone não disponível.'); return; }
    const raw = phone.replace(/\D/g, '');
    Linking.openURL(`tel:${raw}`).catch(() => Alert.alert('Ligar', `${name}: ${phone}`));
  };

  const handleNavigate = (point: CollectionPoint) => {
    Alert.alert('Como Chegar', `Abrir o Google Maps para:\n\n${point.name}\n${point.address}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir Maps', onPress: () => openGoogleMapsNavigation(point) },
    ]);
  };

  const handleDrawRoute = async (destination: CollectionPoint) => {
    if (!locationGranted) { Alert.alert('Localização necessária', 'Ative o GPS para traçar a rota.'); return; }
    setLoadingRoute(true); clearRoute();
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const origin = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(origin);
      let routePoints: { latitude: number; longitude: number }[] = [];
      let fetchedInfo: { distance: string; duration: string } | null = null;
      let usedStraightLine = false;
      if (GOOGLE_MAPS_API_KEY) {
        try {
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.coordinate.latitude},${destination.coordinate.longitude}&mode=driving&language=pt-BR&key=${GOOGLE_MAPS_API_KEY}`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.status === 'OK' && json.routes.length > 0) {
            const route = json.routes[0];
            routePoints = decodePolyline(route.overview_polyline.points);
            const leg = route.legs[0];
            fetchedInfo = { distance: leg.distance.text, duration: leg.duration.text };
          }
        } catch { }
      }
      if (routePoints.length === 0) { routePoints = [origin, destination.coordinate]; usedStraightLine = true; }
      setRouteCoords(routePoints); setRouteInfo(fetchedInfo); setIsStraightLine(usedStraightLine);
      mapRef.current?.fitToCoordinates(routePoints, { edgePadding: { top: 180, right: 50, bottom: 320, left: 50 }, animated: true });
    } catch {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    } finally { setLoadingRoute(false); }
  };

  const goToMyLocation = async () => {
    if (!locationGranted) { Alert.alert('Localização', 'Permissão não concedida.'); return; }
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const pos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(pos);
      mapRef.current?.animateToRegion({ ...pos, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 600);
    } catch { Alert.alert('Erro', 'Não foi possível obter localização.'); }
    finally { setLocating(false); }
  };

  const focusMarker = (point: CollectionPoint) => {
    if (selectedPoint?.id !== point.id) clearRoute();
    setSelectedPoint(point);
    mapRef.current?.animateToRegion({ ...point.coordinate, latitudeDelta: 0.022, longitudeDelta: 0.022 }, 500);
  };

  // ── WEB ──────────────────────────────────────────────────────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.webHeader}>
          <MaterialIcons name="location-on" size={20} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.webHeaderTitle}>Pontos de Distribuição</Text>
            <Text style={styles.webHeaderSub}>SOS Jampa — Mapa interativo</Text>
          </View>
        </View>
        <WebLeafletMap
          points={COLLECTION_POINTS}
          activeFilter={activeFilter}
          onFilter={setActiveFilter}
          filtered={filtered}
        />
      </View>
    );
  }

  // ── NATIVE ───────────────────────────────────────────────────────────────
  const hasRoute = routeCoords.length > 0;
  const routeColor = selectedPoint?.color ?? Colors.primary;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={JOAO_PESSOA_REGION}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        showsCompass={false}
        mapType="standard"
        onPress={() => { setSelectedPoint(null); clearRoute(); }}
      >
        {hasRoute ? (
          <Polyline coordinates={routeCoords} strokeColor={routeColor} strokeWidth={4}
            lineDashPattern={isStraightLine ? [8, 6] : undefined} lineJoin="round" lineCap="round" />
        ) : null}
        {hasRoute && userLocation ? (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.originDot}><View style={styles.originDotInner} /></View>
          </Marker>
        ) : null}
        {filtered.map((point) => (
          <Marker key={point.id} coordinate={point.coordinate} onPress={() => focusMarker(point)} tracksViewChanges={false}>
            <View style={[styles.markerPin, { backgroundColor: point.color }, selectedPoint?.id === point.id && styles.markerPinSelected]}>
              <MaterialIcons name={point.icon} size={selectedPoint?.id === point.id ? 20 : 16} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.headerOverlay, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerCard}>
          <MaterialIcons name="map" size={18} color={Colors.primary} />
          <View style={styles.headerCardText}>
            <Text style={styles.headerCardTitle}>Pontos de Distribuição</Text>
            <Text style={styles.headerCardSub}>{filtered.length} pontos · SOS Jampa</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.myLocBtn, pressed && { opacity: 0.8 }]} onPress={goToMyLocation}>
            {locating ? <ActivityIndicator size="small" color={Colors.primary} /> : <MaterialIcons name="my-location" size={20} color={Colors.primary} />}
          </Pressable>
        </View>
        {hasRoute ? <RouteInfoBanner info={routeInfo} isStraightLine={isStraightLine} onClear={clearRoute} /> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {TYPE_FILTERS.map((f) => (
            <Pressable key={f.key} style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]} onPress={() => setActiveFilter(f.key)}>
              <MaterialIcons name={f.icon} size={13} color={activeFilter === f.key ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {selectedPoint ? (
        <View style={[styles.detailSheet, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <PointDetailSheet
            point={selectedPoint}
            onClose={() => { setSelectedPoint(null); clearRoute(); }}
            onNavigate={() => handleNavigate(selectedPoint)}
            onCall={() => handleCall(selectedPoint.phone, selectedPoint.name)}
            onDrawRoute={() => handleDrawRoute(selectedPoint)}
            loadingRoute={loadingRoute}
            hasRoute={hasRoute}
          />
        </View>
      ) : (
        <View style={[styles.bottomList, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomListContent}>
            {filtered.map((point) => (
              <Pressable key={point.id} style={({ pressed }) => [styles.bottomCard, pressed && { opacity: 0.88 }]} onPress={() => focusMarker(point)}>
                <View style={[styles.bottomCardIcon, { backgroundColor: point.color + '22' }]}>
                  <MaterialIcons name={point.icon} size={20} color={point.color} />
                </View>
                <View style={styles.bottomCardBody}>
                  <Text style={styles.bottomCardName} numberOfLines={1}>{point.name}</Text>
                  <Text style={styles.bottomCardAddress} numberOfLines={1}>{point.address}</Text>
                  <View style={styles.bottomCardFooter}>
                    <MaterialIcons name="schedule" size={11} color={Colors.textSubtle} />
                    <Text style={styles.bottomCardHours}>{point.hours}</Text>
                  </View>
                </View>
                <Pressable style={[styles.navMiniBtn, { backgroundColor: point.color }]} onPress={() => handleNavigate(point)}>
                  <MaterialIcons name="navigation" size={15} color="#fff" />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ── Sheet styles ──────────────────────────────────────────────────────────────
const sheetStyles = StyleSheet.create({
  container: { backgroundColor: Colors.surface, borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, borderTopWidth: 3, paddingTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, ...Shadow.lg },
  handle: { width: 40, height: 4, borderRadius: Radii.full, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerText: { flex: 1 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false, lineHeight: 22 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  address: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false, flex: 1 },
  closeBtn: { padding: 4 },
  infoRow: { gap: 5, marginBottom: Spacing.sm },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, includeFontPadding: false },
  acceptsWrap: { marginBottom: Spacing.md },
  acceptsLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSubtle, marginBottom: 6, includeFontPadding: false },
  acceptsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  acceptChip: { borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  acceptText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, includeFontPadding: false },
  actions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  routeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: Radii.full, paddingVertical: 12, paddingHorizontal: Spacing.md, borderWidth: 1.5, minHeight: 48, minWidth: 110 },
  routeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, includeFontPadding: false },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radii.full, paddingVertical: 13, minHeight: 48, ...Shadow.sm },
  navBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff', includeFontPadding: false },
  callBtn: { width: 48, height: 48, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.primary, flexShrink: 0 },
});

// ── Main styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },

  // Web header
  webHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, ...Shadow.sm,
  },
  webHeaderTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  webHeaderSub: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false },

  // Web map layout
  webMapOuter: { flex: 1, flexDirection: 'column' },
  webFilterBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, paddingVertical: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  webPointCount: { fontSize: FontSize.xs, color: Colors.textSubtle, paddingRight: Spacing.md, flexShrink: 0 },
  webMapContainer: { flex: 1, minHeight: 340 },
  webMapLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, backgroundColor: Colors.surfaceTinted },
  webMapLoadingText: { fontSize: FontSize.sm, color: Colors.textSubtle },

  webDetailCard: {
    backgroundColor: Colors.surface, borderTopWidth: 3,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    ...Shadow.lg,
  },
  webDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  webDetailIcon: { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  webDetailName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  webDetailAddr: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false, marginTop: 2 },
  webDetailAccepts: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: Spacing.sm },
  webNavBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: Radii.full, paddingVertical: 12, minHeight: 48 },
  webNavBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff', includeFontPadding: false },

  webBottomList: { maxHeight: 100, backgroundColor: Colors.background },
  webBottomListContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center' },
  webBottomCard: {
    width: 220, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radii.lg,
    paddingHorizontal: Spacing.sm, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  webBottomCardIcon: { width: 36, height: 36, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  webBottomCardName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  webBottomCardAddr: { fontSize: 10, color: Colors.textSubtle, includeFontPadding: false },

  // Shared chips
  acceptChip: { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  acceptText: { fontSize: 10, fontWeight: FontWeight.semibold, includeFontPadding: false },

  // Marker
  markerPin: { width: 38, height: 38, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff', ...Shadow.md },
  markerPinSelected: { width: 46, height: 46, borderWidth: 3 },
  originDot: { width: 22, height: 22, borderRadius: Radii.full, backgroundColor: 'rgba(183,28,28,0.20)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary },
  originDotInner: { width: 10, height: 10, borderRadius: Radii.full, backgroundColor: Colors.primary },

  // Native header overlay
  headerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  headerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, ...Shadow.md },
  headerCardText: { flex: 1 },
  headerCardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  headerCardSub: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false },
  myLocBtn: { width: 36, height: 36, borderRadius: Radii.full, backgroundColor: Colors.surfaceTinted, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  filterContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, gap: Spacing.sm, flexDirection: 'row', alignItems: 'center' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radii.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, minHeight: 36, ...Shadow.sm },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, includeFontPadding: false },
  filterChipTextActive: { color: '#fff' },

  detailSheet: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bottomList: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: Spacing.sm },
  bottomListContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm, alignItems: 'center' },
  bottomCard: { width: 230, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.sm, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  bottomCardIcon: { width: 40, height: 40, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bottomCardBody: { flex: 1, minWidth: 0 },
  bottomCardName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, includeFontPadding: false },
  bottomCardAddress: { fontSize: FontSize.xs, color: Colors.textSubtle, includeFontPadding: false, marginTop: 1 },
  bottomCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  bottomCardHours: { fontSize: 10, color: Colors.textSubtle, includeFontPadding: false },
  navMiniBtn: { width: 36, height: 36, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
