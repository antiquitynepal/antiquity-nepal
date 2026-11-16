import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  BookOpen,
  Bus,
  Check,
  Clock,
  Compass,
  Footprints,
  Landmark,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Package,
  Plus,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import budhanilkanthaImg from '../assets/images/budhanilkantha_temple_real.jpg';
import kumariGharImg from '../assets/images/kumari_ghar_real.jpg';
import kirtipurImg from '../assets/images/kirtipur_bagh_bhairab_real.jpg';
import kopanImg from '../assets/images/kopan_monastery_real.jpg';
import { googleSignIn, initAuth, logout } from '../utils/googleAuth';
import {
  ADMIN_EMAIL,
  isVerifiedAdminEmail,
  NotablePlaceCategory,
  PublishedNotablePlace,
  publishNotablePlace,
  removeNotablePlace,
  subscribePublicNotablePlaces,
} from '../utils/notablePlacesDb';
import { useLanguage, useTranslatedTexts } from '../utils/i18n';

export type NotableCategory = NotablePlaceCategory;
export type MapQuadrant = 'central' | 'north' | 'southwest' | 'northeast';

export interface NotablePlace {
  id: string;
  name: string;
  location: string;
  category: NotableCategory;
  era: string;
  image: string;
  photoCredit?: string;
  distanceKm: number;
  distanceLabel: string;
  walkingDistance: string;
  transportation: string;
  commodities: string[];
  mapPos: { x: number; y: number };
  history: string;
  visitingNote: string;
  isDefault?: boolean;
}

const KATHMANDU_HUB = {
  x: 465,
  y: 232,
  label: 'Central Kathmandu (Thamel / Ratna Park)',
};

const QUADRANT_POSITIONS: Record<MapQuadrant, { x: number; y: number; label: string }> = {
  central: { x: 440, y: 278, label: 'Central Old City' },
  north: { x: 495, y: 74, label: 'Northern Foothills' },
  southwest: { x: 225, y: 342, label: 'Southwest Ridge' },
  northeast: { x: 760, y: 145, label: 'Northeast Valley Hills' },
};

const PRESET_IMAGES: { key: string; label: string; src: string }[] = [
  {
    key: 'preset:budhanilkantha',
    label: 'Budhanilkantha Cosmic Pond (Wikimedia CC BY-SA)',
    src: budhanilkanthaImg,
  },
  {
    key: 'preset:kumari',
    label: 'Kumari Ghar Carved Courtyard (Wikimedia CC BY-SA)',
    src: kumariGharImg,
  },
  {
    key: 'preset:kirtipur',
    label: 'Kirtipur Bagh Bhairab Temple (Wikimedia CC BY-SA)',
    src: kirtipurImg,
  },
  {
    key: 'preset:kopan',
    label: 'Kopan Monastery Rooftop & Hills (Wikimedia CC BY-SA)',
    src: kopanImg,
  },
];

function resolvePlaceImageSrc(imageRef: string): string {
  const matched = PRESET_IMAGES.find((item) => item.key === imageRef);
  if (matched) return matched.src;
  if (/^https:\/\//i.test(imageRef)) return imageRef;
  return budhanilkanthaImg;
}

const DEFAULT_NOTABLE_PLACES: NotablePlace[] = [
  {
    id: 'budhanilkantha-temple',
    name: 'Budhanilkantha Temple (Jalashayana Narayana)',
    location: 'Budhanilkantha, Shivapuri Foothills (North Valley)',
    category: 'Hindu Sanctuary',
    era: 'c. 5th–7th Century CE · Licchavi Dynasty',
    image: budhanilkanthaImg,
    photoCredit: 'Wikimedia Commons · CC BY-SA 3.0',
    distanceKm: 8.6,
    distanceLabel: '8.6 km north of Thamel',
    walkingDistance:
      '1 hr 50 min brisk uphill walk from Thamel · 15 min flat courtyard & pond perimeter walk',
    transportation:
      '25 min taxi via Lazimpat–Bansbari Road · Frequent Sajha Bus & microbuses from Ratna Park / Jamal',
    commodities: [
      'Puja marigold & brass lamp stalls',
      'Footwear & bag check counter',
      'Filtered drinking water taps & public restrooms',
      'Roadside tea houses & Shivapuri trail snack shops',
    ],
    mapPos: { x: 488, y: 72 },
    history:
      'Carved from a single five-meter block of black basalt during the Licchavi period, the reclining figure of Lord Vishnu rests atop the coils of the eleven-hooded cosmic serpent Ananta Shesha in a spring-fed stone tank. Royal chronicles recount that the monolith was uncovered by a farmer plowing the northern fields before being enshrined here. Following a prophetic dream in the 17th century, King Pratap Malla declared that no reigning monarch of Nepal should gaze directly upon the main image—a tradition honored by placing a smaller stone replica inside Balaju Water Garden.',
    visitingNote:
      'Open 05:00–19:00 daily. Non-Hindus observe the sunken cosmic pond from the carved outer stone terrace.',
    isDefault: true,
  },
  {
    id: 'kumari-ghar',
    name: 'Kumari Ghar (Palace of the Living Goddess)',
    location: 'Basantapur, Southern Edge of Kathmandu Durbar Square',
    category: 'Living Tradition',
    era: '1757 CE · Malla Dynasty (King Jaya Prakash Malla)',
    image: kumariGharImg,
    photoCredit: 'Wikimedia Commons · CC BY-SA 4.0',
    distanceKm: 1.2,
    distanceLabel: '1.2 km south of Thamel',
    walkingDistance:
      '14 min pedestrian heritage walk from Thamel via Asan Bazaar & Indra Chowk',
    transportation:
      'Pedestrian-only square · Taxi or tempo drop-off at New Road Gate (3 min walk) or Basantapur edge',
    commodities: [
      'Newari cafés & traditional yomari eateries nearby',
      'ATM & currency kiosks on Basantapur lane',
      'Monument ticket office & audio desks at Durbar edge',
      'Woodcraft ateliers, bookshops & pharmacy at New Road',
    ],
    mapPos: { x: 438, y: 274 },
    history:
      'Built in 1757 CE by Kathmandu’s last Malla ruler, Jaya Prakash Malla, this three-story red-brick courtyard bahal houses the Royal Kumari—a young girl from the Newar Buddhist Shakya clan revered as the living vessel of the Hindu goddess Taleju Bhawani. According to Kathmandu chronicles, Taleju ceased appearing in person to the king after a disrupted game of dice (tripasa), agreeing to speak through an innocent child instead. Exquisitely carved Newari wooden struts and gilded repoussé toranas frame the inner courtyard, which anchors the annual Indra Jatra chariot procession.',
    visitingNote:
      'Outer courtyard entry is open daily; photography of the Living Goddess at the upper lattice window is strictly prohibited.',
    isDefault: true,
  },
  {
    id: 'kirtipur-bagh-bhairab',
    name: 'Kirtipur Old Town & Bagh Bhairab Temple',
    location: 'Kirtipur Ridge, Southwest Kathmandu Basin',
    category: 'Historic Town',
    era: '12th Century Settlement · 16th Century Sanctuary',
    image: kirtipurImg,
    photoCredit: 'Wikimedia Commons · CC BY-SA 4.0',
    distanceKm: 7.5,
    distanceLabel: '7.5 km southwest of Thamel',
    walkingDistance:
      '1 hr 35 min walk via Kalimati & Balkhu · 45 min stone-step ridge walk linking Chilanchu & Bagh Bhairab',
    transportation:
      '25 min taxi via Balkhu Ring Road · Frequent local buses from Ratna Park to Kirtipur Naya Bazaar',
    commodities: [
      'Authentic Newari heritage kitchens (Lahana, Sasa)',
      'Handloom weaving cooperatives & spice stalls',
      'Stone spout water stations & shaded resting falchas',
      'Local craft shops & community restrooms at Naya Bazaar',
    ],
    mapPos: { x: 222, y: 334 },
    history:
      'Perched atop a steep twin-knoll ridge since the 12th century, Kirtipur preserves one of the valley’s oldest fortified Newar townscapes. At its heart stands the three-tiered Bagh Bhairab pagoda, dedicated to Bhairava in his fierce tiger manifestation. Suspended beneath its second-story eaves hang antique swords, shields, and armor captured during Kirtipur’s staunch defense against Prithvi Narayan Shah’s Gorkha unification campaigns in the 1760s, alongside medieval Chilanchu Stupa and brick-paved weavers’ alleys.',
    visitingNote:
      'Best explored on foot during late afternoon golden hour when the Kathmandu skyline and eastern peaks clear.',
    isDefault: true,
  },
  {
    id: 'kopan-monastery',
    name: 'Kopan Monastery',
    location: 'Kopan Hill, North of Boudhanath',
    category: 'Buddhist Site',
    era: '1969 CE · Contemporary Tibetan Gelugpa Tradition',
    image: kopanImg,
    photoCredit: 'Wikimedia Commons · CC BY-SA 3.0',
    distanceKm: 7.2,
    distanceLabel: '7.2 km northeast of Thamel',
    walkingDistance:
      '45 min uphill country-lane walk from Boudhanath Stupa Gate · 1 hr 40 min from central Kathmandu',
    transportation:
      '25–30 min taxi from Thamel or 12 min uphill cab/tuk-tuk from Boudhanath Kapan Chowk',
    commodities: [
      'Monastery garden café & butter-tea terrace',
      'Dharma library & Tibetan manuscript bookshop',
      'Filtered drinking water refill station & visitor restrooms',
      'Quiet garden benches & panoramic valley overlook',
    ],
    mapPos: { x: 752, y: 142 },
    history:
      'Standing on a quiet ridge once occupied by the royal astrologer to Nepal’s kings, Kopan Monastery was founded in 1969 by Lama Thubten Yeshe and Lama Zopa Rinpoche. Beginning as a modest retreat farmhouse overlooking the great dome of Boudhanath, it evolved into a major Himalayan center for Gelugpa Buddhist philosophy, monastic debate courtyards, and thangka painting, welcoming travelers seeking serene terraced gardens above the urban valley.',
    visitingNote:
      'Open to day visitors; respectful silence is requested around the main prayer hall and monastic debate courtyard.',
    isDefault: true,
  },
];

const NOTABLE_CATEGORIES: ('All' | NotableCategory)[] = [
  'All',
  'Hindu Sanctuary',
  'Living Tradition',
  'Buddhist Site',
  'Historic Town',
  'Cultural Landmark',
];

const CUSTOM_CATEGORIES: NotableCategory[] = [
  'Hindu Sanctuary',
  'Living Tradition',
  'Buddhist Site',
  'Historic Town',
  'Cultural Landmark',
];

export const NotableSitesRegistry: React.FC = () => {
  const { t, translateCategory } = useLanguage();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [adminPlaces, setAdminPlaces] = useState<PublishedNotablePlace[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'All' | NotableCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedPlaceId, setFocusedPlaceId] = useState<string>('budhanilkantha-temple');

  // Admin Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<NotableCategory>('Cultural Landmark');
  const [era, setEra] = useState('');
  const [distanceKmInput, setDistanceKmInput] = useState('4.5');
  const [walkingDistance, setWalkingDistance] = useState('');
  const [transportation, setTransportation] = useState('');
  const [commoditiesInput, setCommoditiesInput] = useState('');
  const [quadrant, setQuadrant] = useState<MapQuadrant>('central');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [presetImageKey, setPresetImageKey] = useState<string>('preset:budhanilkantha');
  const [history, setHistory] = useState('');
  const [visitingNote, setVisitingNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdminUser = isVerifiedAdminEmail(
    currentUser?.email,
    currentUser?.emailVerified
  );

  useEffect(() => {
    const unsubAuth = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );

    const unsubDb = subscribePublicNotablePlaces(
      (items) => {
        setAdminPlaces(items);
        setSyncError(null);
      },
      (err) => {
        setSyncError(err.message);
      }
    );

    return () => {
      unsubAuth();
      unsubDb();
    };
  }, []);

  const allPlaces: NotablePlace[] = useMemo(() => {
    const resolvedPublished: NotablePlace[] = adminPlaces.map((p) => ({
      ...p,
      image: resolvePlaceImageSrc(p.image),
      photoCredit: /^https:\/\//i.test(p.image)
        ? 'Verified Royalty-Free Photo'
        : 'Wikimedia Commons · CC BY-SA',
    }));
    return [...DEFAULT_NOTABLE_PLACES, ...resolvedPublished];
  }, [adminPlaces]);

  const placesTextMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of allPlaces) {
      map[`name:${p.id}`] = p.name;
      map[`loc:${p.id}`] = p.location;
      map[`era:${p.id}`] = p.era;
      map[`hist:${p.id}`] = p.history;
      map[`note:${p.id}`] = p.visitingNote;
      map[`distLbl:${p.id}`] = p.distanceLabel;
      map[`walk:${p.id}`] = p.walkingDistance;
      map[`trans:${p.id}`] = p.transportation;
      map[`cat:${p.id}`] = p.category;
      p.commodities.forEach((c, idx) => {
        map[`comm:${p.id}:${idx}`] = c;
      });
    }
    return map;
  }, [allPlaces]);

  const trPlaces = useTranslatedTexts(placesTextMap);
  const tp = (id: string, field: string, fallback: string) =>
    trPlaces[`${field}:${id}`] || fallback;

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPlaces.filter((place) => {
      const catMatch = selectedCategory === 'All' || place.category === selectedCategory;
      const queryMatch =
        !q ||
        place.name.toLowerCase().includes(q) ||
        place.location.toLowerCase().includes(q) ||
        place.era.toLowerCase().includes(q) ||
        place.history.toLowerCase().includes(q) ||
        place.transportation.toLowerCase().includes(q) ||
        place.commodities.some((c) => c.toLowerCase().includes(q));
      return catMatch && queryMatch;
    });
  }, [allPlaces, selectedCategory, searchQuery]);

  const focusedPlace = useMemo(() => {
    return (
      allPlaces.find((p) => p.id === focusedPlaceId) ??
      filteredPlaces[0] ??
      DEFAULT_NOTABLE_PLACES[0]
    );
  }, [allPlaces, filteredPlaces, focusedPlaceId]);

  const handleSelectOnMap = (placeId: string) => {
    setFocusedPlaceId(placeId);
    const el = document.getElementById(`notable-row-${placeId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleAdminSignIn = async () => {
    setFormError(null);
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAdminSignOut = async () => {
    await logout();
    setCurrentUser(null);
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!currentUser || !isAdminUser) {
      setFormError(
        `Administrator authorization required. Please sign in as ${ADMIN_EMAIL}.`
      );
      return;
    }

    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    const trimmedHistory = history.trim();
    const parsedKm = Math.max(0.2, Number.parseFloat(distanceKmInput) || 3.5);

    if (trimmedName.length < 2) {
      setFormError('Please enter the name of the temple, courtyard, or heritage site.');
      return;
    }
    if (trimmedLocation.length < 2) {
      setFormError('Please enter the neighborhood or valley location.');
      return;
    }
    if (trimmedHistory.length < 20) {
      setFormError(
        'Please write a historical background (at least 20 characters) for the History column.'
      );
      return;
    }

    const trimmedImageUrl = customImageUrl.trim();
    if (trimmedImageUrl) {
      const stockWatermarkPattern =
        /(shutterstock|gettyimages|alamy|istockphoto|dreamstime|123rf|depositphotos|vecteezy|stocksy|pond5)/i;
      if (stockWatermarkPattern.test(trimmedImageUrl)) {
        setFormError(
          'Watermarked stock image URLs are not permitted. Please use an original royalty-free URL without watermarks (e.g. Wikimedia Commons) or select an authentic HD preset photo.'
        );
        return;
      }
      if (!/^https:\/\//i.test(trimmedImageUrl)) {
        setFormError('Custom picture URLs must begin with https://.');
        return;
      }
    }

    const basePos = QUADRANT_POSITIONS[quadrant];
    const jitterX = ((adminPlaces.length * 37) % 60) - 30;
    const jitterY = ((adminPlaces.length * 29) % 40) - 20;
    const parsedCommodities = commoditiesInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const newId = await publishNotablePlace({
        authorUid: currentUser.uid,
        name: trimmedName,
        location: trimmedLocation,
        category,
        era: era.trim() || 'Kathmandu Valley Heritage',
        image: trimmedImageUrl || presetImageKey,
        distanceKm: Number(parsedKm.toFixed(1)),
        distanceLabel: `${parsedKm.toFixed(1)} km from Central Kathmandu`,
        walkingDistance:
          walkingDistance.trim() ||
          `${Math.round(parsedKm * 13)} min walk from central Kathmandu`,
        transportation:
          transportation.trim() ||
          'Local microbus / Sajha transit or short taxi ride from Ratna Park',
        commodities:
          parsedCommodities.length > 0
            ? parsedCommodities
            : ['Local tea shops', 'Drinking water access', 'Resting pavilion'],
        mapX: Math.min(910, Math.max(90, basePos.x + jitterX)),
        mapY: Math.min(365, Math.max(60, basePos.y + jitterY)),
        history: trimmedHistory,
        visitingNote:
          visitingNote.trim() ||
          'Open daily during daylight hours; check local courtyard etiquette.',
      });

      setFocusedPlaceId(newId);
      setName('');
      setLocation('');
      setCategory('Cultural Landmark');
      setEra('');
      setDistanceKmInput('4.5');
      setWalkingDistance('');
      setTransportation('');
      setCommoditiesInput('');
      setCustomImageUrl('');
      setHistory('');
      setVisitingNote('');
      setFormSuccess(
        `Published “${trimmedName}” to the Kathmandu Heritage Gazetteer for all visitors.`
      );
      setSelectedCategory('All');
      setSearchQuery('');
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Could not publish this site to Firestore.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdminPlace = async (id: string) => {
    try {
      await removeNotablePlace(id);
      if (focusedPlaceId === id) {
        setFocusedPlaceId(DEFAULT_NOTABLE_PLACES[0].id);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to remove published entry.'
      );
    }
  };

  const previewPresetSrc = resolvePlaceImageSrc(customImageUrl.trim() || presetImageKey);

  return (
    <div className="space-y-8">
      {/* Interactive Gazetteer Map + Selected Place Distance & Logistics Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch rounded-lg border border-stone-300 bg-[#EFEAE1] p-4 sm:p-5">
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                {t('notableMapEyebrow')}
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1C1917]">
                {t('notableMapTitle')}
              </h3>
            </div>
            <span className="font-mono text-xs text-stone-600 tabular-nums">
              {t('notableMappedCount', { count: allPlaces.length })}
            </span>
          </div>

          {/* Interactive SVG Map + Overlaid Markers */}
          <div className="relative aspect-[1000/420] w-full overflow-hidden rounded-md border border-stone-300 bg-[#EAE2D3]">
            <svg
              viewBox="0 0 1000 420"
              className="h-full w-full block"
              role="img"
              aria-label="Map of notable Kathmandu Valley places worth visiting and distances"
            >
              {/* Valley Basin Contours */}
              <path
                d="M 0 90 Q 250 35 500 55 T 1000 80 L 1000 0 L 0 0 Z"
                fill="#DFD5C3"
                opacity="0.7"
              />
              <path
                d="M 0 370 Q 300 405 600 385 T 1000 350 L 1000 420 L 0 420 Z"
                fill="#DFD5C3"
                opacity="0.6"
              />
              <ellipse
                cx="485"
                cy="230"
                rx="255"
                ry="120"
                fill="none"
                stroke="#C8BCAA"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
              <text
                x="485"
                y="124"
                textAnchor="middle"
                className="fill-stone-500 text-[10px] font-mono"
              >
                KATHMANDU VALLEY RING ROAD
              </text>

              {/* Rivers */}
              <path
                d="M 325 30 C 340 120, 355 200, 375 305 C 390 350, 415 385, 430 410"
                fill="none"
                stroke="#7A9BB0"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.75"
              />
              <path
                d="M 790 40 C 710 115, 650 185, 620 245 C 575 315, 460 335, 360 380"
                fill="none"
                stroke="#688DA4"
                strokeWidth="4.5"
                strokeLinecap="round"
                opacity="0.8"
              />

              {/* Radial Distance Lines from Central Hub */}
              {allPlaces.map((place) => {
                const isFocused = place.id === focusedPlace.id;
                const midX = (KATHMANDU_HUB.x + place.mapPos.x) / 2;
                const midY = (KATHMANDU_HUB.y + place.mapPos.y) / 2;
                return (
                  <g key={`ray-${place.id}`}>
                    <line
                      x1={KATHMANDU_HUB.x}
                      y1={KATHMANDU_HUB.y}
                      x2={place.mapPos.x}
                      y2={place.mapPos.y}
                      stroke={isFocused ? '#9A3412' : '#A89F91'}
                      strokeWidth={isFocused ? 3 : 1.5}
                      strokeDasharray={isFocused ? 'none' : '4 4'}
                      opacity={isFocused ? 0.9 : 0.5}
                    />
                    {isFocused && (
                      <g>
                        <rect
                          x={midX - 30}
                          y={midY - 11}
                          width={60}
                          height={20}
                          rx={4}
                          fill="#1C1917"
                        />
                        <text
                          x={midX}
                          y={midY + 3}
                          textAnchor="middle"
                          className="fill-amber-200 text-[10px] font-mono font-semibold"
                        >
                          {place.distanceKm} km
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Central Reference Hub Dot */}
              <circle
                cx={KATHMANDU_HUB.x}
                cy={KATHMANDU_HUB.y}
                r={7}
                fill="#1C1917"
                stroke="#F8F5F0"
                strokeWidth={2}
              />
            </svg>

            {/* HTML Markers Layer */}
            <div className="pointer-events-none absolute inset-0">
              <div
                style={{
                  left: `${(KATHMANDU_HUB.x / 1000) * 100}%`,
                  top: `${(KATHMANDU_HUB.y / 420) * 100}%`,
                  transform: 'translate(-50%, 10px)',
                }}
                className="absolute rounded bg-[#1C1917]/90 px-2 py-0.5 text-[10px] font-mono text-stone-100 whitespace-nowrap"
              >
                Thamel / Central Hub
              </div>

              {allPlaces.map((place) => {
                const isFocused = place.id === focusedPlace.id;
                const shortName = tp(place.id, 'name', place.name).split('(')[0].split('&')[0].trim();
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectOnMap(place.id)}
                    style={{
                      left: `${(place.mapPos.x / 1000) * 100}%`,
                      top: `${(place.mapPos.y / 420) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`pointer-events-auto absolute group flex flex-col items-center focus:outline-none ${
                      isFocused ? 'z-20' : 'z-10'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 shadow-sm transition-transform group-hover:scale-110 ${
                        isFocused
                          ? 'border-white bg-[#9A3412] text-white scale-110'
                          : 'border-white bg-[#292524] text-stone-100'
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                    </span>
                    <span
                      className={`mt-1 rounded border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium whitespace-nowrap shadow-xs transition-colors ${
                        isFocused
                          ? 'border-[#1C1917] bg-[#1C1917] text-white'
                          : 'border-stone-300 bg-[#F8F5F0]/95 text-[#1C1917] group-hover:border-[#9A3412]'
                      }`}
                    >
                      {shortName} · {place.distanceKm} km
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side of Map: Focused Site Snapshot with Real Photograph & Logistics */}
        <div className="lg:col-span-5 rounded-md border border-stone-300 bg-white overflow-hidden flex flex-col justify-between">
          <div>
            <div className="relative h-48 w-full bg-stone-200 overflow-hidden">
              <img
                src={focusedPlace.image}
                alt={tp(focusedPlace.id, 'name', focusedPlace.name)}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = budhanilkanthaImg;
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <p className="text-[11px] font-medium text-amber-200">
                  {translateCategory(focusedPlace.category)} · {tp(focusedPlace.id, 'distLbl', focusedPlace.distanceLabel)}
                </p>
                <h4 className="font-serif text-xl font-semibold leading-tight">
                  {tp(focusedPlace.id, 'name', focusedPlace.name)}
                </h4>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-start gap-2 text-stone-700">
                <Footprints className="mt-0.5 h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                <div>
                  <span className="font-semibold text-[#1C1917]">{t('notableWalkLabel')} </span>
                  <span>{tp(focusedPlace.id, 'walk', focusedPlace.walkingDistance)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-stone-700">
                <Bus className="mt-0.5 h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                <div>
                  <span className="font-semibold text-[#1C1917]">{t('notableTransitLabel')} </span>
                  <span>{tp(focusedPlace.id, 'trans', focusedPlace.transportation)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-stone-700">
                <Package className="mt-0.5 h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                <div>
                  <span className="font-semibold text-[#1C1917]">{t('notableCommoditiesLabel')} </span>
                  <span>
                    {focusedPlace.commodities
                      .map((c, idx) => trPlaces[`comm:${focusedPlace.id}:${idx}`] || c)
                      .join(' · ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 bg-[#F8F5F0] px-4 py-2.5 flex items-center justify-between gap-2 text-[11px] text-stone-600">
            <span className="inline-flex items-center gap-1.5 truncate">
              <Compass className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
              <span className="truncate">
                {focusedPlace.photoCredit || t('notableSelectPinHint')}
              </span>
            </span>
            <span className="font-mono font-semibold text-[#9A3412] tabular-nums shrink-0">
              {focusedPlace.distanceKm} km
            </span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Category Filter, Search & Quick Jump to Administrator Desk */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-stone-300/80 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {NOTABLE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-[#EFEAE1] text-stone-700 hover:bg-stone-200'
                }`}
              >
                {cat === 'All' ? t('catAllSites') : translateCategory(cat)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('notableSearchPlaceholder')}
              aria-label="Search notable places"
              className="w-full rounded-md border border-stone-300 bg-white py-2 pl-8 pr-3 text-xs text-[#1C1917] placeholder:text-stone-400"
            />
          </div>

          <a
            href="#admin-notable-desk"
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-[#EFEAE1] px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#9A3412]" />
            <span>{t('adminNotableEyebrow')}</span>
          </a>
        </div>
      </div>

      {/* Confirmation Notice */}
      {formSuccess && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{formSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Structured Columnar Ledger: Site & Picture | History Behind the Site | Distance, Transport & Commodities */}
      {filteredPlaces.length === 0 ? (
        <div className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-8 text-center">
          <p className="font-serif text-2xl font-semibold text-[#1C1917]">
            No notable sites match your filter
          </p>
          <p className="mt-1 text-xs text-stone-600">
            Clear your search or select another heritage category above.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-300 bg-white">
          {/* Desktop Column Headers */}
          <div className="hidden lg:grid lg:grid-cols-12 border-b border-stone-300 bg-[#EFEAE1] text-xs font-semibold text-stone-700">
            <div className="lg:col-span-3 px-5 py-3.5 border-r border-stone-300/70">
              {t('notableColSite')}
            </div>
            <div className="lg:col-span-5 px-5 py-3.5 border-r border-stone-300/70 flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-[#9A3412]" />
              <span>{t('notableColHistory')}</span>
            </div>
            <div className="lg:col-span-4 px-5 py-3.5 flex items-center gap-2">
              <RouteIcon className="h-3.5 w-3.5 text-[#9A3412]" />
              <span>{t('notableColLogistics')}</span>
            </div>
          </div>

          <div className="divide-y divide-stone-300/80">
            {filteredPlaces.map((place) => {
              const isFocused = place.id === focusedPlace.id;
              return (
                <div
                  key={place.id}
                  id={`notable-row-${place.id}`}
                  onClick={() => setFocusedPlaceId(place.id)}
                  className={`grid grid-cols-1 lg:grid-cols-12 transition-colors cursor-pointer ${
                    isFocused ? 'bg-[#F8F5F0]' : 'hover:bg-[#F8F5F0]/60'
                  }`}
                >
                  {/* Column 1: Genuine Picture, Site Name & Location */}
                  <div className="lg:col-span-3 p-5 lg:border-r lg:border-stone-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-md border border-stone-300 bg-stone-200">
                        <img
                          src={place.image}
                          alt={tp(place.id, 'name', place.name)}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = budhanilkanthaImg;
                          }}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute bottom-2 left-2 rounded bg-[#1C1917]/85 px-2 py-0.5 font-mono text-[10px] text-white tabular-nums">
                          {place.distanceKm} km
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#9A3412]">
                          {translateCategory(place.category)}
                        </span>
                        {!place.isDefault && (
                          <span className="font-mono text-[11px] text-stone-500">
                            {t('notableAddedBadge')}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-1 font-serif text-xl sm:text-2xl font-semibold leading-snug text-[#1C1917]">
                        {tp(place.id, 'name', place.name)}
                      </h3>

                      <p className="mt-2 flex items-start gap-1.5 text-xs text-stone-600">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                        <span>{tp(place.id, 'loc', place.location)}</span>
                      </p>

                      {place.photoCredit && (
                        <p className="mt-2 text-[10px] font-mono text-stone-500">
                          Photo: {place.photoCredit}
                        </p>
                      )}
                    </div>

                    {!place.isDefault && isAdminUser && (
                      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                        {confirmDeleteId === place.id ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-stone-600">{t('notableRemoveEntry')}?</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdminPlace(place.id)}
                              className="font-semibold text-[#9A3412] hover:underline"
                            >
                              {t('notableConfirm')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-stone-600 hover:text-[#1C1917]"
                            >
                              {t('notableCancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(place.id)}
                            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#9A3412] transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{t('notableRemoveEntry')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Column 2: Dedicated History Behind It Column */}
                  <div className="lg:col-span-5 p-5 lg:border-r lg:border-stone-200 bg-[#F8F5F0]/40 lg:bg-transparent">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9A3412] lg:hidden">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{t('notableColHistory')}</span>
                    </p>
                    <p className="mb-2.5 flex items-center gap-1.5 font-mono text-xs text-stone-600">
                      <Landmark className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                      <span>{tp(place.id, 'era', place.era)}</span>
                    </p>
                    <p className="text-sm leading-relaxed text-stone-800">
                      {tp(place.id, 'hist', place.history)}
                    </p>
                    <p className="mt-3 border-t border-stone-200 pt-3 flex items-start gap-1.5 text-xs text-stone-600 leading-relaxed">
                      <Clock className="mt-0.5 h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                      <span>{tp(place.id, 'note', place.visitingNote)}</span>
                    </p>
                  </div>

                  {/* Column 3: Distance, Walking Distance, Transportation & Commodities */}
                  <div className="lg:col-span-4 p-5 flex flex-col justify-between gap-4 bg-[#EFEAE1]/35 lg:bg-transparent text-xs">
                    <div className="space-y-3.5">
                      <div>
                        <p className="flex items-center gap-1.5 font-semibold text-stone-900">
                          <Footprints className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                          <span>{t('notableWalkLabel')}</span>
                        </p>
                        <p className="mt-1 font-mono text-[#9A3412] font-medium">
                          {tp(place.id, 'distLbl', place.distanceLabel)}
                        </p>
                        <p className="mt-0.5 text-stone-700 leading-relaxed">
                          {tp(place.id, 'walk', place.walkingDistance)}
                        </p>
                      </div>

                      <div className="border-t border-stone-200 pt-3">
                        <p className="flex items-center gap-1.5 font-semibold text-stone-900">
                          <Bus className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                          <span>{t('notableTransitLabel')}</span>
                        </p>
                        <p className="mt-1 text-stone-700 leading-relaxed">
                          {tp(place.id, 'trans', place.transportation)}
                        </p>
                      </div>

                      <div className="border-t border-stone-200 pt-3">
                        <p className="flex items-center gap-1.5 font-semibold text-stone-900">
                          <Package className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                          <span>{t('notableCommoditiesLabel')}</span>
                        </p>
                        <ul className="mt-1.5 space-y-1 text-stone-700">
                          {place.commodities.map((item, idx) => (
                            <li key={`${place.id}-comm-${idx}`} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#9A3412] shrink-0" />
                              <span>{trPlaces[`comm:${place.id}:${idx}`] || item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dedicated Administrator Section: Add & Manage Places Worth Visiting */}
      <section
        id="admin-notable-desk"
        aria-label="Administrator Curatorial Section"
        className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col gap-4 border-b border-stone-300/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
              {t('adminNotableEyebrow')}
            </p>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              {t('adminNotableTitle')}
            </h2>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-stone-700">
              {t('adminNotableDesc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isAdminUser ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{currentUser?.email}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAdminSignOut}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-500 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('adminNotableSignOut')}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleAdminSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2 rounded-md bg-[#9A3412] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap disabled:opacity-60"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{isSigningIn ? 'Signing in…' : t('adminNotableSignIn')}</span>
              </button>
            )}
          </div>
        </div>

        {syncError && (
          <div className="flex items-start gap-2 rounded-md border border-stone-300 bg-white px-4 py-3 text-xs text-stone-700">
            <AlertCircle className="mt-0.5 h-4 w-4 text-[#9A3412] shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {!isAdminUser ? (
          <div className="rounded-md border border-stone-300 bg-[#F8F5F0] p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 text-[#9A3412] shrink-0" />
              <div className="text-xs text-stone-700 space-y-1">
                {currentUser ? (
                  <>
                    <p className="font-semibold text-[#1C1917]">
                      Signed in as {currentUser.email}
                    </p>
                    <p>
                      Only the verified atlas administrator ({ADMIN_EMAIL}) can publish or remove entries in the extended valley gazetteer. Switch to the administrator Google account above to add sites.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-[#1C1917]">
                      Administrator Publishing Room ({ADMIN_EMAIL})
                    </p>
                    <p>
                      Sign in with the verified administrator Google account to add additional temples, courtyards, distances, transit notes, commodities, historical background, and watermark-free HD photographs for all visitors.
                    </p>
                  </>
                )}
              </div>
            </div>
            {currentUser && (
              <button
                type="button"
                onClick={handleAdminSignIn}
                disabled={isSigningIn}
                className="rounded-md border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0"
              >
                Switch Account
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleAddPlace} className="space-y-4">
            {formError && (
              <div className="flex items-start gap-2 rounded-md border border-[#9A3412]/40 bg-[#9A3412]/10 px-4 py-3 text-xs text-[#9A3412]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Site or Place Name *
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dakshinkali Temple or Sankhu"
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Location / District *
                </label>
                <input
                  type="text"
                  maxLength={140}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pharping, Southern Rim"
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NotableCategory)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917]"
                >
                  {CUSTOM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Era / Historical Period
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="e.g. 14th Century Malla Era"
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 items-start">
              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Distance from Central Hub (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="60"
                  value={distanceKmInput}
                  onChange={(e) => setDistanceKmInput(e.target.value)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Valley Map Quadrant
                </label>
                <select
                  value={quadrant}
                  onChange={(e) => setQuadrant(e.target.value as MapQuadrant)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917]"
                >
                  {(Object.keys(QUADRANT_POSITIONS) as MapQuadrant[]).map((key) => (
                    <option key={key} value={key}>
                      {QUADRANT_POSITIONS[key].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  HD Wikimedia Photo Preset
                </label>
                <select
                  value={presetImageKey}
                  onChange={(e) => setPresetImageKey(e.target.value)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917]"
                >
                  {PRESET_IMAGES.map((img) => (
                    <option key={img.key} value={img.key}>
                      {img.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Custom Royalty-Free Picture URL (watermark-free)
                </label>
                <input
                  type="url"
                  maxLength={500}
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://upload.wikimedia.org/..."
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Walking Distance &amp; Trail Time
                </label>
                <input
                  type="text"
                  maxLength={260}
                  value={walkingDistance}
                  onChange={(e) => setWalkingDistance(e.target.value)}
                  placeholder="e.g. 20 min pedestrian walk from old town"
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Transportation Options
                </label>
                <input
                  type="text"
                  maxLength={260}
                  value={transportation}
                  onChange={(e) => setTransportation(e.target.value)}
                  placeholder="e.g. Ratna Park microbus or 25 min taxi"
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Nearby Commodities &amp; Facilities (comma-separated)
                </label>
                <input
                  type="text"
                  value={commoditiesInput}
                  onChange={(e) => setCommoditiesInput(e.target.value)}
                  placeholder="e.g. Tea houses, Filtered water, Restrooms"
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
              <div className="lg:col-span-5">
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  History Behind the Site (History Column) *
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  placeholder="Describe when the site was founded, its royal or spiritual patrons, legends, and architectural significance..."
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs leading-relaxed text-[#1C1917] placeholder:text-stone-400"
                />
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-medium text-stone-800 mb-1">
                  Visiting Hours &amp; Courtyard Etiquette
                </label>
                <textarea
                  rows={4}
                  maxLength={400}
                  value={visitingNote}
                  onChange={(e) => setVisitingNote(e.target.value)}
                  placeholder="Opening hours, footwear rules, photography etiquette..."
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs leading-relaxed text-[#1C1917] placeholder:text-stone-400"
                />
              </div>

              <div className="lg:col-span-3">
                <p className="block text-xs font-medium text-stone-800 mb-1">
                  Selected Photo Preview
                </p>
                <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-stone-300 bg-stone-200">
                  <img
                    src={previewPresetSrc}
                    alt="Selected notable site preview"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = budhanilkanthaImg;
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-300/70">
              <span className="font-mono text-[11px] text-stone-600">
                Publishes directly to Firestore · Visible to all visitors
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9A3412] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#7C2D12] transition-colors disabled:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{submitting ? 'Publishing…' : 'Publish Place to Gazetteer'}</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
