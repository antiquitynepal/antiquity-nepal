import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type LanguageCode = 'en' | 'fr' | 'es' | 'ja' | 'zh' | 'pt';
export type TargetLanguageCode = Exclude<LanguageCode, 'en'>;

export interface LanguageOption {
  code: LanguageCode;
  shortLabel: string;
  nativeName: string;
  englishName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', shortLabel: 'EN', nativeName: 'English', englishName: 'English' },
  { code: 'fr', shortLabel: 'FR', nativeName: 'Français', englishName: 'French' },
  { code: 'es', shortLabel: 'ES', nativeName: 'Español', englishName: 'Spanish' },
  { code: 'ja', shortLabel: 'JA', nativeName: '日本語', englishName: 'Japanese' },
  { code: 'zh', shortLabel: 'ZH', nativeName: '中文', englishName: 'Chinese' },
  { code: 'pt', shortLabel: 'PT', nativeName: 'Português', englishName: 'Portuguese' },
];

const LANG_STORAGE_KEY = 'kathmandu_atlas_language_v1';
const TRANSLATION_CACHE_STORAGE_KEY = 'kathmandu_atlas_translations_v1';

const EN_UI = {
  // Header & Nav
  brandTitle: "Suraj Giri’s Kathmandu Heritage Atlas",
  navHeritageSites: 'Heritage Sites',
  navTours360: '360° Tours',
  navValleyRoutes: 'Valley Routes',
  navWorthVisiting: 'Worth Visiting',
  navCompanionsMail: 'Companions & Mail',
  ctaPlanTrail: 'Plan Heritage Trail',
  tabDirectory: 'Valley Directory (7)',

  // Weather Widget
  weatherShortName: 'Kathmandu',
  weatherLoading: 'Kathmandu Weather…',
  weatherTitle: 'Live Heritage Visit Weather',
  weatherSubTitle: 'Kathmandu Basin · 1,400m',
  weatherRetry: 'Retry Live Lookup',
  weatherHumidity: 'Humidity',
  weatherWind: 'Wind',
  weatherWalkPlanning: 'Heritage Walk Planning',
  weatherBestWindow: 'Best Window:',
  weatherGrounded: 'Grounded via Google Search',

  // Language Bar
  langBarLabel: 'Translate',
  langTranslating: 'Translating…',

  // Hero & Stats
  heroEyebrow: 'Kathmandu Valley · 7 UNESCO Heritage Zones',
  heroHeadline: 'Explore Kathmandu’s Sacred Heritage in 360°',
  heroDescription:
    'Tour royal plazas, hilltop stupas, and riverside sanctuaries with interactive 360° panoramas, arrival routes, and audio guides.',
  btnBrowseSites: 'Explore All 7 Sites',
  btnLaunchPreview: '360° Preview',
  btnQrShare: 'QR & Share',
  featuredBadge: 'Featured Monument',
  featuredSub:
    '3 viewpoints · Walking trail from Thamel · 3 audio chapters',
  btnOpenSiteTab: 'Open Site',
  statZones: 'Heritage Zones',
  statZonesVal: '07 Sites',
  statViews: '360° Views',
  statViewsVal: '21 Panoramas',
  statRoutes: 'Arrival Routes',
  statRoutesVal: '21 Trails',
  statAudio: 'Audio Guides',
  statAudioVal: '21 Chapters',

  // Section 1: Directory
  dirEyebrow: '01. Monument Directory',
  dirTitle: 'Kathmandu Valley Heritage Zones',
  dirDescription:
    'Select any monument for full 360° hotspots, arrival routes, timelines, and audio guides.',
  dirFilterPlaceholder: 'Search site, district, era…',
  dirTripStatus: 'Trip Itinerary',
  dirStopSingular: 'stop',
  dirStopPlural: 'stops',
  dirBuilderLink: 'PDF Builder ↓',
  dirNoMatchTitle: 'No matching heritage sites',
  dirNoMatchDesc: 'Clear your search filter or select “All Sites”.',
  dirResetFilters: 'Reset Filters',
  cardTourBadge: '360° Tour',
  cardExploreTab: 'Explore Site',
  cardAddTrip: 'Add to Trip',
  cardStopPrefix: 'Stop',
  cardQrShare: 'QR',
  cardNewTab: 'Tab',
  cardAudioHotspots: '{chapters} Audio Chapters · {hotspots} Hotspots',

  // Categories
  catAllSites: 'All Sites',
  catRoyalPlaza: 'Royal Plaza',
  catBuddhistStupa: 'Buddhist Stupa',
  catHinduSanctuary: 'Hindu Sanctuary',
  catHilltopShrine: 'Hilltop Shrine',
  catLivingTradition: 'Living Tradition',
  catBuddhistSite: 'Buddhist Site',
  catHistoricTown: 'Historic Town',
  catCulturalLandmark: 'Cultural Landmark',

  // Section 2: 360 Stage
  stageEyebrow: '02. 360° Panorama Stage',
  stageTitle: 'Interactive 360° Horizon Preview',
  stageDescription:
    'Select a monument below to pan in 360°, zoom into architectural details, and inspect landmarks.',
  stageOpenBtn: 'Open {site}',

  // Section 3: Routes & Trip Itinerary Builder
  routesEyebrow: '03. Valley Routes & Trip Planner',
  routesTitle: 'Routes Across the Kathmandu Basin',
  routesDescription:
    'Compare walking trails and transit links across the valley, arrange stops, and export a printable PDF.',
  mapEyebrow: 'Topographic Basin Cartography',
  mapTitle: 'Kathmandu Valley Heritage Network',
  mapLegendActive: 'Active Trail Stop',
  mapLegendMonument: 'Valley Monument',
  mapHint: 'Click any overlaid marker to open its site tab · Hover to inspect corridors',
  mapClickMarkerHint: 'Click marker to open site tab',
  mapAddTrail: 'Add to Trail',
  mapInTrail: 'In Trail',
  mapDirectConnections: 'Direct Heritage Connections',
  mapOpenTourTab: 'Open Site Tour Tab',
  mapNewBrowserTab: 'New Browser Tab',
  mapCustomTrailTitle: 'Custom Trail Summary',
  mapClear: 'Clear',
  mapStops: 'Stops',
  mapDistance: 'Distance',
  mapEstTransit: 'Est. Transit',
  mapRemove: 'Remove',
  mapTrailFooter1: 'Select any site on the map and click “Add to Trail” to customize your Kathmandu route.',
  mapTrailFooter2: 'Best lighting windows: 06:00–09:00 and 16:00–18:00 local Nepal time.',

  // Trip Itinerary Builder
  itineraryEyebrow: 'Multi-Site Planner & PDF Export',
  itineraryTitle: 'Trip Itinerary Builder',
  itineraryDesc:
    'Pick monuments, set your stop order, view distance and travel time, and download a printable PDF.',
  itineraryStep1: '1. Select Heritage Sites',
  itinerarySelectAll: 'Select All',
  itineraryClear: 'Clear',
  itineraryStep2: '2. Travel Mode & Schedule Details',
  itineraryTitleInput: 'Itinerary Title (on PDF)',
  itineraryDate: 'Trip Date',
  itineraryStartTime: 'Start Time (NPT)',
  itineraryTraveler: 'Traveler / Group Name (optional)',
  itineraryOverviewEyebrow: 'Active Itinerary Overview',
  itineraryStarts: 'Starts',
  itineraryReverse: 'Reverse',
  itineraryPrint: 'Print Sheet',
  itineraryDownloadPdf: 'Download Printable PDF',
  itinerarySelectedStops: 'Selected Stops',
  itineraryTotalDist: 'Total Distance',
  itineraryEstTravel: 'Est. Travel Time',
  itineraryEstDay: 'Est. Day Duration',
  itineraryEmptyTitle: 'No heritage sites selected yet',
  itineraryEmptyDesc:
    'Select two or more monuments on the left (or load a preset circuit) to arrange stops and generate your PDF itinerary.',
  itineraryLoadLoop: 'Load Sacred Valley Day Loop',
  itineraryArrive: 'Arrive',
  itineraryHours: 'Hours',
  itineraryTo: 'To',
  itineraryModeBalanced: 'Walk + Transit',
  itineraryModeBalancedSub: 'Walk short old-city hops (<= 3.5 km); use local bus/taxi across river corridors',
  itineraryModeWalk: 'On Foot (Walking)',
  itineraryModeWalkSub: 'Full pedestrian pace (~4.3 km/h) linking sacred alleys and hill trails',
  itineraryModeTaxi: 'Taxi / Private Car',
  itineraryModeTaxiSub: 'Point-to-point vehicle transfer accounting for Kathmandu basin traffic',
  presetSacredLoop: 'Sacred Valley Day Loop (4 Stops)',
  presetMalla: 'Three Malla Royal Squares (4 Stops)',
  presetAll7: 'Complete 7-Monument Circuit',

  // Section 4: Audio Archive
  audioEyebrow: 'Spoken Archive & Acoustic Soundscapes',
  audioTitle: 'Curated Site Audio Guides',
  audioDesc:
    'Every destination includes three field-narrated audio chapters paired with synchronized transcripts and singing-bowl or temple-bell soundscapes.',
  audioColSite: 'Heritage Site',
  audioColEra: 'Era & Location',
  audioColChapter: 'Featured Chapter',
  audioColDuration: 'Duration',
  audioColAction: 'Action',
  audioBtnOpen: 'Open Audio & Tab',

  // Section 5: Other Sites & Places Worth Visiting
  otherEyebrow: 'Extended Valley Gazetteer',
  otherTitle: 'Other Sites & Places Worth Visiting',
  otherDesc:
    'Beyond the seven monumental zones—explore Budhanilkantha Temple, Kumari Ghar, Kirtipur, and Kopan Monastery with site photography, interactive basin distances, transit and walking guidance, nearby commodities, and the history behind each site, or add notable places of your own.',
  notableMapEyebrow: 'Interactive Distance & Transit Map',
  notableMapTitle: 'Distance from Central Kathmandu (Thamel / Basantapur)',
  notableMappedCount: '{count} Notable Locations Mapped',
  notableWalkLabel: 'Walking Distance:',
  notableTransitLabel: 'Transportation:',
  notableCommoditiesLabel: 'Nearby Commodities:',
  notableSelectPinHint: 'Select any pin on the map to update',
  notableSearchPlaceholder: 'Search sites, commodities, history…',
  notableBtnAdd: 'Add Site Worth Visiting',
  notableBtnCloseForm: 'Close Form',
  notableColSite: 'Site, Picture & Location',
  notableColHistory: 'History Behind the Site',
  notableColLogistics: 'Distance, Transit & Commodities',
  notableAddedBadge: 'Added Entry',
  notableRemoveEntry: 'Remove entry',
  notableConfirm: 'Confirm',
  notableCancel: 'Cancel',
  adminNotableEyebrow: 'Administrator Curatorial Desk',
  adminNotableTitle: 'Administrator Room · Add More Sites & Places',
  adminNotableDesc:
    'Reserved for the atlas administrator to publish additional Kathmandu Valley temples, courtyards, and heritage landmarks with genuine photography.',
  adminNotableSignIn: 'Sign in as Administrator',
  adminNotableSignOut: 'Sign Out',
  adminBtn: 'Admin',
  adminSitesEyebrow: 'Restricted Curatorial Console',
  adminSitesTitle: 'Heritage Sites Administrator',
  adminSitesDesc: 'Authorized personnel only. Add new heritage monuments or remove existing entries from the live HERITAGE_SITES directory.',
  adminSitesRestrictedTitle: 'Restricted Administrator Access',
  adminSitesRestrictedDesc: 'Sign in with the verified Antiquity Nepal administrator account ({email}) to add or remove heritage sites.',
  adminSitesWrongEmail: 'Signed in as {email}. Access to modify HERITAGE_SITES is restricted strictly to {admin}.',
  adminSitesAddHeading: 'Add Heritage Site to HERITAGE_SITES',
  adminSitesManageHeading: 'Active HERITAGE_SITES Directory ({count})',

  // Section 6: Companions & Gmail
  compEyebrow: '04. Travel Companions & Mail',
  compTitle: 'Share Trails via Contacts & Gmail',
  compDesc:
    'Coordinate valley walks with Google Contacts or send heritage site dossiers directly via Gmail.',
  compTabContacts: 'Google Contacts & Guides',
  compTabGmail: 'Gmail Dispatch & Inbox',

  // Site Detail View & Breadcrumb
  breadcrumbHome: 'Heritage Atlas',
  breadcrumbDirectory: 'Valley Directory',
  breadcrumbSiteDetails: 'Site Details',
  detailBack: 'Back to Valley Directory',
  detailStartAudio: 'Start Audio Guide',
  detailStandaloneTab: 'Open in Standalone Browser Tab',
  detailVisitingHours: 'Visiting Hours',
  detailEntryFee: 'Monument Entry Fee',
  detailArchEra: 'Architectural Era',
  detailForeign: 'Foreign',
  detailSaarc: 'SAARC',
  detailLocal: 'Local',
  detailTourHeading: 'Interactive 360° Virtual Tour',
  detailTourHelp:
    'Drag horizontally or vertically to look around, scroll to zoom, or click spatial markers to inspect monuments.',
  detailTabRoutes: 'Routes & Directions',
  detailTabAudio: 'Audio Guide',
  detailTabHistory: 'Historical Context & Timeline',
  detailTabArch: 'Architecture & Etiquette',
  detailTabCompanions: 'Companions & Share',
  detailTabGmail: 'Gmail Dispatch',
  detailRoutesToTake: 'Routes to Take',
  detailRoutesHelp: 'Choose your preferred arrival method from central Kathmandu hubs or nearby heritage zones.',
  detailFrom: 'From',
  detailDifficulty: 'Difficulty',
  detailClimb: 'climb',
  detailRecWindow: 'Recommended Window:',
  detailFieldTip: 'Field Tip:',
  detailChronology: 'Historical Chronology',
  detailAnatomy: 'Architectural Anatomy & Craft',
  detailEtiquetteTitle: 'Visitor Etiquette & Festivals',
  detailDress: 'Dress & Footwear',
  detailRitual: 'Ritual Etiquette',
  detailPhoto: 'Photography Policy',
  detailFestival: 'Signature Festival',
  detailShareEyebrow: 'Instant Share',
  detailShareTitle: 'Scan QR or Send to WhatsApp, Facebook, Messenger, Viber & Mail',
  detailContinueTitle: 'Continue Across Kathmandu Valley',
  detailContinueDesc:
    'Open another monument in its own tab to compare routes, architecture, and 360° panoramas.',

  // QR & Social Share & Footer
  footerShareEyebrow: 'Scan QR Pass or Share Without Typing the Address',
  footerShareTitle: 'Share {target} via Social Apps',
  footerManagedBy: 'Designed and managed by Suraj Giri as Antiquity Nepal',
  footerTagline:
    '360° virtual tours, heritage arrival routes, and historical audio guides across Kathmandu, Patan, and Bhaktapur.',
  newsletterEyebrow: 'Heritage Dispatches',
  newsletterTitle: 'Heritage Site Updates',
  newsletterDesc:
    'Receive seasonal trail notices, restoration updates, and new 360° monument captures.',
  newsletterPlaceholder: 'Enter your email address',
  newsletterSubscribe: 'Subscribe',
  newsletterSubscribing: 'Saving…',
  newsletterInvalidEmail: 'Please enter a valid email address.',
  newsletterSuccess: 'Subscribed — {email} will receive Kathmandu heritage updates.',
  newsletterError: 'Unable to save subscription right now. Please try again.',
  backToTop: 'Back to Top',
  shareOtherApps: 'Other Apps',
  shareQrCard: 'QR Card',
  qrModalEyebrow: 'Antiquity Nepal · Heritage QR Pass & Social Share',
  qrModalTitle: 'Scan QR or Share to Social Apps',
  qrModalFullAtlas: 'Full Valley Atlas',
  qrModalScanLabel: 'Scan to launch 360° tour & routes',
  qrModalSelectLabel: 'Choose Monument or Atlas Destination',
  qrModalFullOption: 'Full Kathmandu Heritage Atlas (All 7 Sites)',
  qrModalLinkLabel: 'Encoded Destination Link',
  qrModalDownload: 'Download Shareable QR Card (PNG)',
  qrModalCopyImg: 'Copy QR Image',
  qrModalImgCopied: 'QR Copied',
  qrModalCopyUrl: 'Copy URL',
  qrModalUrlCopied: 'Link Copied',
  qrModalSocialTitle: 'Share Directly to Messaging & Social Apps',
  qrModalFooterNote: 'High-contrast Level-H QR · Instant scan & 1-click social sharing',

  // Three Major Buttons Below Language Selector
  navMajorAudioGuides: 'Curated Site Audio Guides',
  navMajorOtherSites: 'Other Sites & Places Worth Visiting',
  navMajorTestimonials: 'First-Time Visitor Testimonies',

  // Dedicated Audio Guides Page
  audioPageCatalogEyebrow: 'Complete 7-Monument Sound Archive',
  audioPageCatalogTitle: 'All 21 Narrated Heritage Chapters',
  audioListenNow: 'Listen Now',

  // Dedicated First-Time Testimonials Page
  testimonialsEyebrow: 'Visitor Chronicle · First-Time & Shared Perspectives',
  testimonialsTitle: 'First-Time Visitor Testimonies & Stories',
  testimonialsDesc:
    'Read genuine impressions from travelers experiencing Kathmandu Valley’s sacred squares, stupas, and hidden courtyards for the very first time—alongside reflections from returning explorers—or share your own visit.',
  testimonialsStatTotal: 'Published Stories',
  testimonialsStatFirst: 'First-Time Visitors',
  testimonialsStatRating: 'Average Rating',
  testimonialsFilterAll: 'All Testimonies',
  testimonialsFilterFirst: 'First-Time Visitor',
  testimonialsFilterReturn: 'Returning Explorer',
  testimonialsFilterSiteLabel: 'Filter by Site:',
  testimonialsVisitedLabel: 'Visited',
  testimonialsTipHeading: 'Tip for Future First-Time Visitors',
  testimonialsEmptyTitle: 'No testimonies match this filter',
  testimonialsEmptyDesc: 'Switch filters above or share the first reflection for this heritage site.',
  testimonialsSyncNotice: 'Showing curated field testimonies. Sign in with Google to publish a new reflection.',
  testimonialsFormEyebrow: 'Contribute Your Story',
  testimonialsFormTitle: 'Share Your First-Time Experience',
  testimonialsFormDesc:
    'Help future travelers prepare by describing how the courtyard atmosphere, arrival walk, and monument stories felt to you.',
  testimonialsSignInNotice:
    'Sign in with Google to publish your verified first-time or returning visitor testimony to the shared valley chronicle.',
  testimonialsSignInBtn: 'Sign in with Google to Publish',
  testimonialsSignInRequired: 'Please sign in with Google before publishing your testimony.',
  testimonialsSignedInAs: 'Publishing as',
  testimonialsFieldName: 'Your Name *',
  testimonialsFieldOrigin: 'City / Country *',
  testimonialsFieldVisitType: 'Visit Type',
  testimonialsFieldSite: 'Heritage Site Visited',
  testimonialsFieldDate: 'Month & Year',
  testimonialsFieldRating: 'Experience Rating',
  testimonialsFieldHeadline: 'Experience Headline *',
  testimonialsFieldStory: 'Your Experience Story *',
  testimonialsFieldTip: 'Best Tip for First-Time Visitors (optional)',
  testimonialsSubmitBtn: 'Publish Testimony to Chronicle',
  testimonialsPublishSuccess: 'Thank you! Your visitor testimony is now live in the Kathmandu chronicle.',
};

export type UIStringKey = keyof typeof EN_UI;

const UI_TRANSLATIONS: Record<LanguageCode, Record<UIStringKey, string>> = {
  en: EN_UI,
  fr: {
    brandTitle: 'Atlas du Patrimoine de Katmandou de Suraj Giri',
    navHeritageSites: 'Sites Patrimoniaux',
    navTours360: 'Visites 360°',
    navValleyRoutes: 'Itinéraires',
    navWorthVisiting: 'À Visiter',
    navCompanionsMail: 'Compagnons & Mail',
    ctaPlanTrail: 'Planifier un Circuit',
    tabDirectory: 'Répertoire (7)',

    weatherShortName: 'Katmandou',
    weatherLoading: 'Météo Katmandou…',
    weatherTitle: 'Météo en direct pour la visite',
    weatherSubTitle: 'Bassin de Katmandou · 1 400 m',
    weatherRetry: 'Réessayer',
    weatherHumidity: 'Humidité',
    weatherWind: 'Vent',
    weatherWalkPlanning: 'Conseils de promenade',
    weatherBestWindow: 'Meilleur créneau :',
    weatherGrounded: 'Vérifié via Google Search',

    langBarLabel: 'Langue',
    langTranslating: 'Traduction…',

    heroEyebrow: 'Patrimoine mondial UNESCO de la vallée de Katmandou · 7 zones',
    heroHeadline: 'Explorez le patrimoine sacré de Katmandou à 360°',
    heroDescription:
      'Entrez dans les places royales Newar, les stupas bouddhistes perchés et les sanctuaires hindous au bord de la rivière. Sélectionnez un site pour ouvrir son onglet dédié avec panoramas 360°, itinéraires, archives historiques et guides audio.',
    btnBrowseSites: 'Explorer les 7 Sites',
    btnLaunchPreview: 'Aperçu 360°',
    btnQrShare: 'QR & Partage',
    featuredBadge: 'Monument à la une',
    featuredSub:
      'Trois points de vue 360° · Sentier pédestre depuis Thamel · Trois chapitres audio',
    btnOpenSiteTab: 'Ouvrir l’onglet',
    statZones: 'Zones Patrimoniales',
    statZonesVal: '07 Sites',
    statViews: 'Vues Interactives 360°',
    statViewsVal: '21 Panoramas',
    statRoutes: 'Itinéraires Détaillés',
    statRoutesVal: '21 Parcours',
    statAudio: 'Guides Audio Curatés',
    statAudioVal: '21 Chapitres',

    dirEyebrow: '01. Répertoire Curatorial',
    dirTitle: 'Zones Monumentales de la Vallée de Katmandou',
    dirDescription:
      'Cliquez sur un monument pour ouvrir son onglet avec points d’intérêt 360°, itinéraires, chronologies historiques et narration audio, ou ouvrez-le dans un nouvel onglet.',
    dirFilterPlaceholder: 'Filtrer par site, quartier, époque…',
    dirTripStatus: 'Itinéraire du Voyage',
    dirStopSingular: 'étape',
    dirStopPlural: 'étapes',
    dirBuilderLink: 'Créateur & PDF ↓',
    dirNoMatchTitle: 'Aucun site patrimonial correspondant',
    dirNoMatchDesc: 'Effacez votre recherche ou sélectionnez « Tous les sites ».',
    dirResetFilters: 'Réinitialiser',
    cardTourBadge: 'Visite Interactive 360°',
    cardExploreTab: 'Explorer l’Onglet',
    cardAddTrip: 'Ajouter au Trajet',
    cardStopPrefix: 'Étape',
    cardQrShare: 'QR / Partager',
    cardNewTab: 'Nouvel Onglet',
    cardAudioHotspots: '{chapters} chapitres audio · {hotspots} points repères',

    catAllSites: 'Tous les sites',
    catRoyalPlaza: 'Place Royale',
    catBuddhistStupa: 'Stupa Bouddhiste',
    catHinduSanctuary: 'Sanctuaire Hindou',
    catHilltopShrine: 'Sanctuaire de Colline',
    catLivingTradition: 'Tradition Vivante',
    catBuddhistSite: 'Site Bouddhiste',
    catHistoricTown: 'Cité Historique',
    catCulturalLandmark: 'Monument Culturel',

    stageEyebrow: '02. Bureau Panoramique Spatial',
    stageTitle: 'Scène d’Aperçu Interactif 360°',
    stageDescription:
      'Basculez entre les sept zones monumentales pour explorer les horizons à 360° et inspecter les repères, puis ouvrez l’onglet d’un site pour les trajets et l’audio.',
    stageOpenBtn: 'Ouvrir l’onglet {site}',

    routesEyebrow: '03. Cartographie & Corridors d’Accès',
    routesTitle: 'Itinéraires à travers le bassin de Katmandou',
    routesDescription:
      'Tracez les sentiers pédestres et transports entre Bishnumati, Bagmati et Manohara, ou composez un itinéraire sur mesure et exportez un PDF imprimable.',
    mapEyebrow: 'Cartographie Topographique du Bassin',
    mapTitle: 'Réseau Patrimonial de la Vallée de Katmandou',
    mapLegendActive: 'Étape active',
    mapLegendMonument: 'Monument',
    mapHint: 'Cliquez sur un marqueur pour ouvrir l’onglet · Survolez pour voir les trajets',
    mapClickMarkerHint: 'Cliquer pour ouvrir l’onglet',
    mapAddTrail: 'Ajouter au circuit',
    mapInTrail: 'Dans le circuit',
    mapDirectConnections: 'Liaisons directes',
    mapOpenTourTab: 'Ouvrir l’onglet Visite',
    mapNewBrowserTab: 'Nouvel onglet',
    mapCustomTrailTitle: 'Résumé du circuit',
    mapClear: 'Effacer',
    mapStops: 'Étapes',
    mapDistance: 'Distance',
    mapEstTransit: 'Durée est.',
    mapRemove: 'Retirer',
    mapTrailFooter1: 'Sélectionnez un site sur la carte et cliquez sur « Ajouter au circuit ».',
    mapTrailFooter2: 'Meilleure lumière : 06h00–09h00 et 16h00–18h00 heure du Népal.',

    itineraryEyebrow: 'Planificateur multi-sites & Export imprimable',
    itineraryTitle: 'Créateur d’Itinéraire',
    itineraryDesc:
      'Sélectionnez des sites patrimoniaux, organisez votre ordre de visite, comparez marche et transport et téléchargez un itinéraire PDF imprimable.',
    itineraryStep1: '1. Sélectionner les sites',
    itinerarySelectAll: 'Tout choisir',
    itineraryClear: 'Effacer',
    itineraryStep2: '2. Mode de transport & horaires',
    itineraryTitleInput: 'Titre de l’itinéraire (PDF)',
    itineraryDate: 'Date du voyage',
    itineraryStartTime: 'Heure de départ (NPT)',
    itineraryTraveler: 'Nom du voyageur / groupe (optionnel)',
    itineraryOverviewEyebrow: 'Aperçu de l’itinéraire actif',
    itineraryStarts: 'Départ',
    itineraryReverse: 'Inverser',
    itineraryPrint: 'Imprimer',
    itineraryDownloadPdf: 'Télécharger PDF imprimable',
    itinerarySelectedStops: 'Étapes choisies',
    itineraryTotalDist: 'Distance totale',
    itineraryEstTravel: 'Temps de trajet est.',
    itineraryEstDay: 'Durée totale est.',
    itineraryEmptyTitle: 'Aucun site sélectionné',
    itineraryEmptyDesc:
      'Sélectionnez au moins deux monuments à gauche ou chargez un circuit prédéfini.',
    itineraryLoadLoop: 'Charger la boucle sacrée',
    itineraryArrive: 'Arrivée',
    itineraryHours: 'Horaires',
    itineraryTo: 'Vers',
    itineraryModeBalanced: 'Marche + Transport',
    itineraryModeBalancedSub: 'Marche pour courts trajets (<= 3,5 km) ; bus ou taxi au-delà',
    itineraryModeWalk: 'À pied (Marche)',
    itineraryModeWalkSub: 'Allure pédestre (~4,3 km/h) à travers ruelles et collines',
    itineraryModeTaxi: 'Taxi / Voiture privée',
    itineraryModeTaxiSub: 'Transfert porte-à-porte tenant compte du trafic de Katmandou',
    presetSacredLoop: 'Boucle sacrée (4 étapes)',
    presetMalla: 'Trois royaumes Malla (4 étapes)',
    presetAll7: 'Circuit complet des 7 monuments',

    audioEyebrow: 'Archives Orales & Paysages Sonores',
    audioTitle: 'Guides Audio des Sites',
    audioDesc:
      'Chaque destination inclut trois chapitres audio narrés sur le terrain avec transcriptions synchronisées et sons de bols chantants ou cloches de temples.',
    audioColSite: 'Site Patrimonial',
    audioColEra: 'Époque & Lieu',
    audioColChapter: 'Chapitre vedette',
    audioColDuration: 'Durée',
    audioColAction: 'Action',
    audioBtnOpen: 'Ouvrir Audio & Onglet',

    otherEyebrow: 'Répertoire Étendu de la Vallée',
    otherTitle: 'Autres Sites & Lieux à Visiter',
    otherDesc:
      'Au-delà des sept zones principales : explorez le temple de Budhanilkantha, Kumari Ghar, Kirtipur et le monastère de Kopan avec photos, distances, transports, commodités et histoire, ou ajoutez vos propres lieux.',
    notableMapEyebrow: 'Carte interactive des distances & accès',
    notableMapTitle: 'Distance depuis le centre de Katmandou (Thamel / Basantapur)',
    notableMappedCount: '{count} lieux cartographiés',
    notableWalkLabel: 'À pied :',
    notableTransitLabel: 'Transports :',
    notableCommoditiesLabel: 'Commodités à proximité :',
    notableSelectPinHint: 'Sélectionnez un repère sur la carte',
    notableSearchPlaceholder: 'Rechercher sites, commodités, histoire…',
    notableBtnAdd: 'Ajouter un lieu à visiter',
    notableBtnCloseForm: 'Fermer',
    notableColSite: 'Site, Photo & Lieu',
    notableColHistory: 'Histoire du site',
    notableColLogistics: 'Distance, Accès & Commodités',
    notableAddedBadge: 'Ajouté',
    notableRemoveEntry: 'Supprimer',
    notableConfirm: 'Confirmer',
    notableCancel: 'Annuler',
    adminNotableEyebrow: 'Bureau Curatorial de l’Administrateur',
    adminNotableTitle: 'Espace Administrateur · Ajouter des Sites & Lieux',
    adminNotableDesc:
      'Réservé à l’administrateur de l’atlas pour publier d’autres temples, cours et monuments de la vallée de Katmandou.',
    adminNotableSignIn: 'Connexion Administrateur',
    adminNotableSignOut: 'Déconnexion',
    adminBtn: 'Admin',
    adminSitesEyebrow: 'Console Curatoriale Restreinte',
    adminSitesTitle: 'Administration des Sites Patrimoniaux',
    adminSitesDesc: 'Personnel autorisé uniquement. Ajoutez ou retirez des sites du répertoire actif HERITAGE_SITES.',
    adminSitesRestrictedTitle: 'Accès Administrateur Restreint',
    adminSitesRestrictedDesc: 'Connectez-vous avec le compte administrateur vérifié ({email}) pour ajouter ou retirer des sites.',
    adminSitesWrongEmail: 'Connecté en tant que {email}. L’accès est réservé strictement à {admin}.',
    adminSitesAddHeading: 'Ajouter un Site à HERITAGE_SITES',
    adminSitesManageHeading: 'Répertoire Actif HERITAGE_SITES ({count})',

    compEyebrow: '04. Compagnons de voyage, Contacts & Gmail',
    compTitle: 'Partager via Google Contacts & Gmail',
    compDesc:
      'Connectez Google Contacts pour coordonner vos visites avec vos compagnons ou utilisez Gmail pour envoyer des fiches et consulter votre boîte.',
    compTabContacts: 'Google Contacts & Guides',
    compTabGmail: 'Gmail Envoi & Boîte',

    breadcrumbHome: 'Atlas du Patrimoine',
    breadcrumbDirectory: 'Répertoire de la Vallée',
    breadcrumbSiteDetails: 'Détails du Site',
    detailBack: 'Retour au répertoire',
    detailStartAudio: 'Lancer le guide audio',
    detailStandaloneTab: 'Ouvrir dans un nouvel onglet',
    detailVisitingHours: 'Horaires d’ouverture',
    detailEntryFee: 'Tarif d’entrée',
    detailArchEra: 'Époque architecturale',
    detailForeign: 'Étrangers',
    detailSaarc: 'SAARC',
    detailLocal: 'Locaux',
    detailTourHeading: 'Visite Virtuelle Interactive 360°',
    detailTourHelp:
      'Faites glisser pour regarder autour, zoomez ou cliquez sur les repères spatiaux.',
    detailTabRoutes: 'Itinéraires & Accès',
    detailTabAudio: 'Guide Audio',
    detailTabHistory: 'Histoire & Chronologie',
    detailTabArch: 'Architecture & Étiquette',
    detailTabCompanions: 'Compagnons & Partage',
    detailTabGmail: 'Envoi Gmail',
    detailRoutesToTake: 'Itinéraires d’accès',
    detailRoutesHelp: 'Choisissez votre mode d’arrivée depuis le centre de Katmandou.',
    detailFrom: 'Depuis',
    detailDifficulty: 'Difficulté',
    detailClimb: 'dénivelé',
    detailRecWindow: 'Créneau conseillé :',
    detailFieldTip: 'Conseil terrain :',
    detailChronology: 'Chronologie historique',
    detailAnatomy: 'Anatomie architecturale & Savoir-faire',
    detailEtiquetteTitle: 'Étiquette & Festivals',
    detailDress: 'Tenue & Chaussures',
    detailRitual: 'Étiquette rituelle',
    detailPhoto: 'Politique photo',
    detailFestival: 'Festival majeur',
    detailShareEyebrow: 'Partage instantané',
    detailShareTitle: 'Scanner le QR ou partager sur WhatsApp, Facebook, Messenger, Viber & Mail',
    detailContinueTitle: 'Continuer dans la vallée de Katmandou',
    detailContinueDesc: 'Ouvrez un autre monument pour comparer itinéraires et vues 360°.',

    footerShareEyebrow: 'Scanner le QR ou partager sans saisir l’adresse',
    footerShareTitle: 'Partager {target} sur vos applications sociales',
    footerManagedBy: 'Conçu et géré par Suraj Giri en tant qu’Antiquity Nepal',
    footerTagline:
      'Visites virtuelles 360°, itinéraires patrimoniaux et guides audio à Katmandou, Patan et Bhaktapur.',
    newsletterEyebrow: 'Bulletin Patrimonial',
    newsletterTitle: 'Mises à jour des Sites',
    newsletterDesc:
      'Recevez les avis de sentiers saisonniers, nouvelles restaurations et vues 360°.',
    newsletterPlaceholder: 'Entrez votre adresse e-mail',
    newsletterSubscribe: 'S’abonner',
    newsletterSubscribing: 'Envoi…',
    newsletterInvalidEmail: 'Veuillez saisir une adresse e-mail valide.',
    newsletterSuccess: 'Abonné — {email} recevra les mises à jour de Katmandou.',
    newsletterError: 'Impossible d’enregistrer l’abonnement. Veuillez réessayer.',
    backToTop: 'Haut de page',
    shareOtherApps: 'Autres Apps',
    shareQrCard: 'Carte QR',
    qrModalEyebrow: 'Antiquity Nepal · Passe QR & Partage Social',
    qrModalTitle: 'Scanner le QR ou partager sur les réseaux',
    qrModalFullAtlas: 'Atlas complet de la vallée',
    qrModalScanLabel: 'Scanner pour lancer la visite 360°',
    qrModalSelectLabel: 'Choisir un monument ou l’Atlas',
    qrModalFullOption: 'Atlas complet du patrimoine de Katmandou (7 sites)',
    qrModalLinkLabel: 'Lien encodé',
    qrModalDownload: 'Télécharger la carte QR (PNG)',
    qrModalCopyImg: 'Copier l’image QR',
    qrModalImgCopied: 'QR copié',
    qrModalCopyUrl: 'Copier l’URL',
    qrModalUrlCopied: 'Lien copié',
    qrModalSocialTitle: 'Partager directement vers vos applications',
    qrModalFooterNote: 'QR haute précision Niveau-H · Scan instantané & partage en 1 clic',

    navMajorAudioGuides: 'Guides Audio des Sites',
    navMajorOtherSites: 'Autres Lieux à Visiter',
    navMajorTestimonials: 'Témoignages de Visiteurs',

    audioPageCatalogEyebrow: 'Archives Sonores Complètes · 7 Monuments',
    audioPageCatalogTitle: 'Les 21 Chapitres Audio Patrimoniaux',
    audioListenNow: 'Écouter',

    testimonialsEyebrow: 'Chronique des Voyageurs · Premières Visites',
    testimonialsTitle: 'Témoignages de Premières Visites & Récits',
    testimonialsDesc:
      'Découvrez les impressions authentiques de voyageurs découvrant Katmandou pour la toute première fois ainsi que les retours d’explorateurs habitués, ou partagez votre propre expérience.',
    testimonialsStatTotal: 'Récits Publiés',
    testimonialsStatFirst: 'Premières Visites',
    testimonialsStatRating: 'Note Moyenne',
    testimonialsFilterAll: 'Tous les Récits',
    testimonialsFilterFirst: 'Première Visite',
    testimonialsFilterReturn: 'Visiteur Habitué',
    testimonialsFilterSiteLabel: 'Filtrer par site :',
    testimonialsVisitedLabel: 'A visité',
    testimonialsTipHeading: 'Conseil pour les Premiers Visiteurs',
    testimonialsEmptyTitle: 'Aucun témoignage pour ce filtre',
    testimonialsEmptyDesc: 'Modifiez les filtres ci-dessus ou partagez votre récit.',
    testimonialsSyncNotice: 'Affichage des récits sélectionnés. Connectez-vous avec Google pour publier.',
    testimonialsFormEyebrow: 'Contribuer à l’Archive',
    testimonialsFormTitle: 'Partagez Votre Première Expérience',
    testimonialsFormDesc:
      'Aidez les futurs voyageurs en décrivant l’atmosphère des cours, le trajet et vos découvertes.',
    testimonialsSignInNotice:
      'Connectez-vous avec Google pour publier votre témoignage dans la chronique partagée de Katmandou.',
    testimonialsSignInBtn: 'Se connecter avec Google',
    testimonialsSignInRequired: 'Veuillez vous connecter avec Google pour publier.',
    testimonialsSignedInAs: 'Publication en tant que',
    testimonialsFieldName: 'Votre Nom *',
    testimonialsFieldOrigin: 'Ville / Pays *',
    testimonialsFieldVisitType: 'Type de Visite',
    testimonialsFieldSite: 'Site Visité',
    testimonialsFieldDate: 'Mois & Année',
    testimonialsFieldRating: 'Note de l’Expérience',
    testimonialsFieldHeadline: 'Titre du Témoignage *',
    testimonialsFieldStory: 'Votre Récit *',
    testimonialsFieldTip: 'Meilleur Conseil (optionnel)',
    testimonialsSubmitBtn: 'Publier le Témoignage',
    testimonialsPublishSuccess: 'Merci ! Votre témoignage est maintenant publié dans la chronique.',
  },
  es: {
    brandTitle: 'Atlas del Patrimonio de Katmandú de Suraj Giri',
    navHeritageSites: 'Sitios Patrimoniales',
    navTours360: 'Tours 360°',
    navValleyRoutes: 'Rutas del Valle',
    navWorthVisiting: 'Lugares de Interés',
    navCompanionsMail: 'Contactos y Correo',
    ctaPlanTrail: 'Planificar Ruta',
    tabDirectory: 'Directorio (7)',

    weatherShortName: 'Katmandú',
    weatherLoading: 'Clima en Katmandú…',
    weatherTitle: 'Clima en vivo para visitar monumentos',
    weatherSubTitle: 'Valle de Katmandú · 1.400 m',
    weatherRetry: 'Reintentar',
    weatherHumidity: 'Humedad',
    weatherWind: 'Viento',
    weatherWalkPlanning: 'Planificación de caminata',
    weatherBestWindow: 'Mejor horario:',
    weatherGrounded: 'Verificado con Google Search',

    langBarLabel: 'Idioma',
    langTranslating: 'Traduciendo…',

    heroEyebrow: 'Patrimonio Mundial UNESCO del Valle de Katmandú · 7 Zonas',
    heroHeadline: 'Explora el patrimonio sagrado de Katmandú en 360°',
    heroDescription:
      'Recorre antiguas plazas reales Newar, estupas budistas en las colinas y santuarios hindúes junto al río. Elige cualquier sitio para abrir su pestaña dedicada con panoramas 360°, rutas de acceso, archivos históricos y audioguías.',
    btnBrowseSites: 'Ver los 7 Sitios',
    btnLaunchPreview: 'Vista Previa 360°',
    btnQrShare: 'QR y Compartir',
    featuredBadge: 'Monumento Destacado',
    featuredSub:
      'Tres vistas 360° · Sendero peatonal desde Thamel · Tres capítulos narrados',
    btnOpenSiteTab: 'Abrir Pestaña',
    statZones: 'Zonas Patrimoniales',
    statZonesVal: '07 Sitios',
    statViews: 'Vistas Interactivas 360°',
    statViewsVal: '21 Panoramas',
    statRoutes: 'Rutas Paso a Paso',
    statRoutesVal: '21 Rutas',
    statAudio: 'Audioguías Curadas',
    statAudioVal: '21 Capítulos',

    dirEyebrow: '01. Directorio Curatorial',
    dirTitle: 'Zonas Monumentales del Valle de Katmandú',
    dirDescription:
      'Haz clic en cualquier monumento para abrir su pestaña con puntos 360°, rutas, líneas de tiempo y narración en audio, o ábrelo en una nueva pestaña del navegador.',
    dirFilterPlaceholder: 'Filtrar por sitio, distrito, época…',
    dirTripStatus: 'Itinerario de Viaje',
    dirStopSingular: 'parada',
    dirStopPlural: 'paradas',
    dirBuilderLink: 'Creador y PDF ↓',
    dirNoMatchTitle: 'No hay sitios que coincidan',
    dirNoMatchDesc: 'Borra tu filtro de búsqueda o selecciona «Todos los Sitios».',
    dirResetFilters: 'Restablecer Filtros',
    cardTourBadge: 'Tour Interactivo 360°',
    cardExploreTab: 'Explorar Pestaña',
    cardAddTrip: 'Añadir al Viaje',
    cardStopPrefix: 'Parada',
    cardQrShare: 'QR / Compartir',
    cardNewTab: 'Nueva Pestaña',
    cardAudioHotspots: '{chapters} capítulos de audio · {hotspots} puntos clave',

    catAllSites: 'Todos los Sitios',
    catRoyalPlaza: 'Plaza Real',
    catBuddhistStupa: 'Estupa Budista',
    catHinduSanctuary: 'Santuario Hindú',
    catHilltopShrine: 'Templo en Colina',
    catLivingTradition: 'Tradición Viva',
    catBuddhistSite: 'Sitio Budista',
    catHistoricTown: 'Ciudad Histórica',
    catCulturalLandmark: 'Hito Cultural',

    stageEyebrow: '02. Mesa Panorámica Espacial',
    stageTitle: 'Escenario Interactivo 360°',
    stageDescription:
      'Cambia entre las siete zonas monumentales para explorar horizontes en 360° y puntos de referencia, luego abre la pestaña de cada sitio para rutas y audio.',
    stageOpenBtn: 'Abrir Pestaña de {site}',

    routesEyebrow: '03. Cartografía y Corredores de Llegada',
    routesTitle: 'Rutas por la Cuenca de Katmandú',
    routesDescription:
      'Traza senderos peatonales y transporte público entre los ríos Bishnumati, Bagmati y Manohara, o arma un itinerario personalizado y descarga un PDF imprimible.',
    mapEyebrow: 'Cartografía Topográfica del Valle',
    mapTitle: 'Red Patrimonial del Valle de Katmandú',
    mapLegendActive: 'Parada activa',
    mapLegendMonument: 'Monumento del valle',
    mapHint: 'Haz clic en cualquier marcador para abrir su pestaña · Pasa el cursor para ver corredores',
    mapClickMarkerHint: 'Clic para abrir pestaña',
    mapAddTrail: 'Añadir a Ruta',
    mapInTrail: 'En Ruta',
    mapDirectConnections: 'Conexiones Directas',
    mapOpenTourTab: 'Abrir Pestaña del Tour',
    mapNewBrowserTab: 'Nueva Pestaña',
    mapCustomTrailTitle: 'Resumen de Ruta Personalizada',
    mapClear: 'Limpiar',
    mapStops: 'Paradas',
    mapDistance: 'Distancia',
    mapEstTransit: 'Tránsito est.',
    mapRemove: 'Quitar',
    mapTrailFooter1: 'Selecciona cualquier sitio en el mapa y pulsa «Añadir a Ruta».',
    mapTrailFooter2: 'Mejor luz: 06:00–09:00 y 16:00–18:00 hora local de Nepal.',

    itineraryEyebrow: 'Planificador Multi-Sitio y Exportación Imprimible',
    itineraryTitle: 'Constructor de Itinerarios',
    itineraryDesc:
      'Elige sitios patrimoniales del directorio, ordena tus visitas, compara tiempos a pie o en transporte y descarga un itinerario en PDF imprimible.',
    itineraryStep1: '1. Seleccionar Sitios',
    itinerarySelectAll: 'Elegir Todos',
    itineraryClear: 'Limpiar',
    itineraryStep2: '2. Modo de Viaje y Horario',
    itineraryTitleInput: 'Título del Itinerario (en PDF)',
    itineraryDate: 'Fecha del Viaje',
    itineraryStartTime: 'Hora de Inicio (NPT)',
    itineraryTraveler: 'Nombre del Viajero / Grupo (opcional)',
    itineraryOverviewEyebrow: 'Resumen del Itinerario Activo',
    itineraryStarts: 'Comienza',
    itineraryReverse: 'Invertir',
    itineraryPrint: 'Imprimir Hoja',
    itineraryDownloadPdf: 'Descargar PDF Imprimible',
    itinerarySelectedStops: 'Paradas Elegidas',
    itineraryTotalDist: 'Distancia Total',
    itineraryEstTravel: 'Tiempo de Viaje Est.',
    itineraryEstDay: 'Duración Total Est.',
    itineraryEmptyTitle: 'Aún no hay sitios seleccionados',
    itineraryEmptyDesc:
      'Elige dos o más monumentos a la izquierda o carga un circuito predefinido.',
    itineraryLoadLoop: 'Cargar Circuito Sagrado',
    itineraryArrive: 'Llegada',
    itineraryHours: 'Horario',
    itineraryTo: 'Hacia',
    itineraryModeBalanced: 'Caminata + Transporte',
    itineraryModeBalancedSub: 'Camina tramos cortos (<= 3.5 km); usa bus o taxi entre ríos',
    itineraryModeWalk: 'A Pie (Caminando)',
    itineraryModeWalkSub: 'Ritmo peatonal (~4.3 km/h) por callejuelas y senderos sagrados',
    itineraryModeTaxi: 'Taxi / Auto Privado',
    itineraryModeTaxiSub: 'Traslado directo considerando el tráfico de Katmandú',
    presetSacredLoop: 'Circuito Sagrado (4 Paradas)',
    presetMalla: 'Tres Reinos Malla (4 Paradas)',
    presetAll7: 'Circuito Completo (7 Monumentos)',

    audioEyebrow: 'Archivo Hablado y Paisajes Sonoros',
    audioTitle: 'Audioguías Curadas',
    audioDesc:
      'Cada destino incluye tres capítulos narrados en campo con transcripciones sincronizadas y sonidos de cuencos tibetanos o campanas.',
    audioColSite: 'Sitio Patrimonial',
    audioColEra: 'Época y Ubicación',
    audioColChapter: 'Capítulo Destacado',
    audioColDuration: 'Duración',
    audioColAction: 'Acción',
    audioBtnOpen: 'Abrir Audio y Pestaña',

    otherEyebrow: 'Gaceta Ampliada del Valle',
    otherTitle: 'Otros Sitios y Lugares que Vale la Pena Visitar',
    otherDesc:
      'Más allá de las siete zonas: explora el Templo Budhanilkantha, Kumari Ghar, Kirtipur y el Monasterio Kopan con fotos, distancias, transporte, servicios e historia de cada lugar, o añade tus propios sitios.',
    notableMapEyebrow: 'Mapa Interactivo de Distancias y Tránsito',
    notableMapTitle: 'Distancia desde el Centro de Katmandú (Thamel / Basantapur)',
    notableMappedCount: '{count} lugares mapeados',
    notableWalkLabel: 'A pie:',
    notableTransitLabel: 'Transporte:',
    notableCommoditiesLabel: 'Servicios cercanos:',
    notableSelectPinHint: 'Selecciona un pin en el mapa para actualizar',
    notableSearchPlaceholder: 'Buscar sitios, servicios, historia…',
    notableBtnAdd: 'Añadir Lugar de Interés',
    notableBtnCloseForm: 'Cerrar',
    notableColSite: 'Sitio, Foto y Ubicación',
    notableColHistory: 'Historia del Sitio',
    notableColLogistics: 'Distancia, Tránsito y Servicios',
    notableAddedBadge: 'Añadido',
    notableRemoveEntry: 'Eliminar',
    notableConfirm: 'Confirmar',
    notableCancel: 'Cancelar',
    adminNotableEyebrow: 'Mesa Curatorial del Administrador',
    adminNotableTitle: 'Sección del Administrador · Añadir Más Sitios',
    adminNotableDesc:
      'Reservado para que el administrador del atlas publique nuevos templos, patios y lugares patrimoniales del valle.',
    adminNotableSignIn: 'Iniciar sesión como Administrador',
    adminNotableSignOut: 'Cerrar sesión',
    adminBtn: 'Admin',
    adminSitesEyebrow: 'Consola Curatorial Restringida',
    adminSitesTitle: 'Administrador de Sitios Patrimoniales',
    adminSitesDesc: 'Solo personal autorizado. Añade o elimina monumentos del directorio activo HERITAGE_SITES.',
    adminSitesRestrictedTitle: 'Acceso Restringido de Administrador',
    adminSitesRestrictedDesc: 'Inicia sesión con la cuenta verificada ({email}) para añadir o eliminar sitios patrimoniales.',
    adminSitesWrongEmail: 'Sesión iniciada como {email}. El acceso está restringido estrictamente a {admin}.',
    adminSitesAddHeading: 'Añadir Sitio a HERITAGE_SITES',
    adminSitesManageHeading: 'Directorio Activo HERITAGE_SITES ({count})',

    compEyebrow: '04. Compañeros de Viaje, Contactos y Gmail',
    compTitle: 'Comparte Rutas vía Contactos y Gmail',
    compDesc:
      'Conecta Google Contacts para coordinar recorridos con acompañantes, o usa Gmail para enviar dosieres y revisar mensajes.',
    compTabContacts: 'Google Contacts y Guías',
    compTabGmail: 'Gmail Envío y Bandeja',

    breadcrumbHome: 'Atlas del Patrimonio',
    breadcrumbDirectory: 'Directorio del Valle',
    breadcrumbSiteDetails: 'Detalles del Sitio',
    detailBack: 'Volver al Directorio',
    detailStartAudio: 'Iniciar Audioguía',
    detailStandaloneTab: 'Abrir en Nueva Pestaña',
    detailVisitingHours: 'Horario de Visita',
    detailEntryFee: 'Tarifa de Entrada',
    detailArchEra: 'Época Arquitectónica',
    detailForeign: 'Extranjeros',
    detailSaarc: 'SAARC',
    detailLocal: 'Locales',
    detailTourHeading: 'Tour Virtual Interactivo 360°',
    detailTourHelp:
      'Arrastra horizontal o verticalmente para mirar, haz zoom o pulsa los marcadores espaciales.',
    detailTabRoutes: 'Rutas e Indicaciones',
    detailTabAudio: 'Audioguía',
    detailTabHistory: 'Contexto Histórico y Cronología',
    detailTabArch: 'Arquitectura y Etiqueta',
    detailTabCompanions: 'Compañeros y Compartir',
    detailTabGmail: 'Envío Gmail',
    detailRoutesToTake: 'Rutas de Llegada',
    detailRoutesHelp: 'Elige tu método preferido desde el centro de Katmandú.',
    detailFrom: 'Desde',
    detailDifficulty: 'Dificultad',
    detailClimb: 'desnivel',
    detailRecWindow: 'Horario recomendado:',
    detailFieldTip: 'Consejo:',
    detailChronology: 'Cronología Histórica',
    detailAnatomy: 'Anatomía Arquitectónica',
    detailEtiquetteTitle: 'Etiqueta del Visitante y Festivales',
    detailDress: 'Vestimenta y Calzado',
    detailRitual: 'Etiqueta Ritual',
    detailPhoto: 'Política de Fotografía',
    detailFestival: 'Festival Principal',
    detailShareEyebrow: 'Compartir al Instante',
    detailShareTitle: 'Escanea el QR o envía a WhatsApp, Facebook, Messenger, Viber y Correo',
    detailContinueTitle: 'Seguir Explorando el Valle',
    detailContinueDesc: 'Abre otro monumento para comparar rutas, arquitectura y vistas 360°.',

    footerShareEyebrow: 'Escanea el Pase QR o Comparte sin Escribir la Dirección',
    footerShareTitle: 'Compartir {target} en Redes Sociales',
    footerManagedBy: 'Diseñado y gestionado por Suraj Giri como Antiquity Nepal',
    footerTagline:
      'Tours virtuales 360°, rutas patrimoniales y audioguías históricas en Katmandú, Patan y Bhaktapur.',
    newsletterEyebrow: 'Boletín Patrimonial',
    newsletterTitle: 'Actualizaciones de Sitios Patrimoniales',
    newsletterDesc:
      'Reciba avisos de rutas de temporada, restauraciones y nuevas vistas 360°.',
    newsletterPlaceholder: 'Ingrese su correo electrónico',
    newsletterSubscribe: 'Suscribirse',
    newsletterSubscribing: 'Guardando…',
    newsletterInvalidEmail: 'Por favor, ingrese un correo electrónico válido.',
    newsletterSuccess: 'Suscrito — {email} recibirá novedades del patrimonio de Katmandú.',
    newsletterError: 'No se pudo guardar su suscripción en este momento. Inténtelo de nuevo.',
    backToTop: 'Volver arriba',
    shareOtherApps: 'Otras Apps',
    shareQrCard: 'Tarjeta QR',
    qrModalEyebrow: 'Antiquity Nepal · Pase QR y Compartir',
    qrModalTitle: 'Escanear QR o Compartir en Apps Sociales',
    qrModalFullAtlas: 'Atlas Completo del Valle',
    qrModalScanLabel: 'Escanea para abrir el tour 360° y rutas',
    qrModalSelectLabel: 'Elegir Monumento o Destino del Atlas',
    qrModalFullOption: 'Atlas Completo del Patrimonio de Katmandú (7 Sitios)',
    qrModalLinkLabel: 'Enlace Codificado',
    qrModalDownload: 'Descargar Tarjeta QR (PNG)',
    qrModalCopyImg: 'Copiar Imagen QR',
    qrModalImgCopied: 'QR Copiado',
    qrModalCopyUrl: 'Copiar URL',
    qrModalUrlCopied: 'Enlace Copiado',
    qrModalSocialTitle: 'Compartir Directamente en Apps de Mensajería y Redes',
    qrModalFooterNote: 'QR Nivel-H de alto contraste · Escaneo instantáneo y 1 clic para compartir',

    navMajorAudioGuides: 'Audioguías de los Sitios',
    navMajorOtherSites: 'Otros Lugares de Interés',
    navMajorTestimonials: 'Testimonios de Visitantes',

    audioPageCatalogEyebrow: 'Archivo Sonoro Completo · 7 Monumentos',
    audioPageCatalogTitle: 'Los 21 Capítulos de Audio Patrimonial',
    audioListenNow: 'Escuchar',

    testimonialsEyebrow: 'Crónica de Viajeros · Primeras Experiencias',
    testimonialsTitle: 'Testimonios de Primeras Visitas y Relatos',
    testimonialsDesc:
      'Lee impresiones reales de viajeros que visitaron el Valle de Katmandú por primera vez junto con relatos de exploradores recurrentes, o comparte tu propia vivencia.',
    testimonialsStatTotal: 'Relatos Publicados',
    testimonialsStatFirst: 'Primeras Visitas',
    testimonialsStatRating: 'Valoración Media',
    testimonialsFilterAll: 'Todos los Relatos',
    testimonialsFilterFirst: 'Primera Visita',
    testimonialsFilterReturn: 'Visitante Recurrente',
    testimonialsFilterSiteLabel: 'Filtrar por sitio:',
    testimonialsVisitedLabel: 'Visitó',
    testimonialsTipHeading: 'Consejo para Primerizos',
    testimonialsEmptyTitle: 'No hay testimonios que coincidan',
    testimonialsEmptyDesc: 'Cambia los filtros o sé el primero en compartir este sitio.',
    testimonialsSyncNotice: 'Mostrando crónicas curadas. Inicia sesión con Google para publicar.',
    testimonialsFormEyebrow: 'Comparte tu Vivencia',
    testimonialsFormTitle: 'Cuenta tu Primera Experiencia',
    testimonialsFormDesc:
      'Ayuda a próximos viajeros contando cómo viviste la caminata, el ambiente y la historia del lugar.',
    testimonialsSignInNotice:
      'Inicia sesión con Google para publicar tu testimonio verificado en la crónica compartida.',
    testimonialsSignInBtn: 'Iniciar sesión con Google',
    testimonialsSignInRequired: 'Inicia sesión con Google antes de publicar tu testimonio.',
    testimonialsSignedInAs: 'Publicando como',
    testimonialsFieldName: 'Tu Nombre *',
    testimonialsFieldOrigin: 'Ciudad / País *',
    testimonialsFieldVisitType: 'Tipo de Visita',
    testimonialsFieldSite: 'Sitio Visitado',
    testimonialsFieldDate: 'Mes y Año',
    testimonialsFieldRating: 'Calificación',
    testimonialsFieldHeadline: 'Título de tu Experiencia *',
    testimonialsFieldStory: 'Tu Relato *',
    testimonialsFieldTip: 'Consejo para Primerizos (opcional)',
    testimonialsSubmitBtn: 'Publicar Testimonio',
    testimonialsPublishSuccess: '¡Gracias! Tu testimonio ya está publicado en la crónica.',
  },
  ja: {
    brandTitle: 'Suraj Giri のカトマンズ遺産アトラス',
    navHeritageSites: '遺産スポット',
    navTours360: '360°ツアー',
    navValleyRoutes: '渓谷ルート',
    navWorthVisiting: 'おすすめ名所',
    navCompanionsMail: '仲間とGmail',
    ctaPlanTrail: 'ルートを計画',
    tabDirectory: '渓谷ディレクトリ (7)',

    weatherShortName: 'カトマンズ',
    weatherLoading: 'カトマンズの天気…',
    weatherTitle: '現在の遺産観光天気',
    weatherSubTitle: 'カトマンズ盆地 · 標高1,400m',
    weatherRetry: '再試行',
    weatherHumidity: '湿度',
    weatherWind: '風速',
    weatherWalkPlanning: '散策アドバイス',
    weatherBestWindow: 'おすすめ時間帯：',
    weatherGrounded: 'Google検索による最新情報',

    langBarLabel: '翻訳',
    langTranslating: '翻訳中…',

    heroEyebrow: 'カトマンズ盆地 ユネスコ世界遺産 · 7つの歴史地区',
    heroHeadline: 'カトマンズの聖なる遺産を360°で巡る',
    heroDescription:
      'ネワール王朝の古都広場、丘の上の仏教ストゥーパ、聖河沿いのヒンドゥー寺院を体感しましょう。各遺産を選ぶと、360°パノラマ、アクセスルート、歴史解説、音声ガイド専用タブが開きます。',
    btnBrowseSites: '7大遺産を見る',
    btnLaunchPreview: '360°プレビュー',
    btnQrShare: 'QR・共有',
    featuredBadge: '注目の遺産',
    featuredSub: '3か所の360°視点 · タメルからの徒歩ルート · 3章の音声ガイド',
    btnOpenSiteTab: 'タブを開く',
    statZones: '遺産エリア',
    statZonesVal: '07 か所',
    statViews: '360°パノラマ',
    statViewsVal: '21 視点',
    statRoutes: 'アクセス案内',
    statRoutesVal: '21 ルート',
    statAudio: '音声ガイド',
    statAudioVal: '21 章',

    dirEyebrow: '01. キュレーション・ディレクトリ',
    dirTitle: 'カトマンズ盆地 7大遺産ゾーン',
    dirDescription:
      '各遺産をクリックすると、360°ホットスポット、行き方、歴史年表、音声ガイドを備えた専用タブが開きます。',
    dirFilterPlaceholder: '遺跡名・地区・時代で絞り込み…',
    dirTripStatus: '旅程プラン',
    dirStopSingular: 'か所',
    dirStopPlural: 'か所',
    dirBuilderLink: '作成・PDF出力 ↓',
    dirNoMatchTitle: '一致する遺産が見つかりません',
    dirNoMatchDesc: '検索条件をクリアするか「すべての遺産」を選んでください。',
    dirResetFilters: 'フィルター解除',
    cardTourBadge: '360°インタラクティブツアー',
    cardExploreTab: '詳細タブを開く',
    cardAddTrip: '旅程に追加',
    cardStopPrefix: '経由',
    cardQrShare: 'QR・共有',
    cardNewTab: '別タブ',
    cardAudioHotspots: '音声ガイド {chapters}章 · 見どころ {hotspots}か所',

    catAllSites: 'すべて',
    catRoyalPlaza: '王宮広場',
    catBuddhistStupa: '仏教ストゥーパ',
    catHinduSanctuary: 'ヒンドゥー聖域',
    catHilltopShrine: '丘上の聖地',
    catLivingTradition: '生きた伝統',
    catBuddhistSite: '仏教寺院・聖地',
    catHistoricTown: '歴史的古都',
    catCulturalLandmark: '文化遺産',

    stageEyebrow: '02. パノラマ空間デスク',
    stageTitle: 'インタラクティブ360°プレビュー',
    stageDescription:
      '下の7つの遺産を切り替えて360°の風景をドラッグで探索できます。詳細なルートや音声解説は各サイトタブでご覧いただけます。',
    stageOpenBtn: '{site} のタブを開く',

    routesEyebrow: '03. 地図とアクセス回廊',
    routesTitle: 'カトマンズ盆地を巡るルート',
    routesDescription:
      'ビシュヌマティ川・バグマティ川・マノハラ川を結ぶ徒歩ルートや公共交通を確認し、オリジナルの旅程を組んで印刷用PDFを作成できます。',
    mapEyebrow: '盆地トポグラフィック地図',
    mapTitle: 'カトマンズ盆地 遺産ネットワーク',
    mapLegendActive: '選択中の経由地',
    mapLegendMonument: '盆地の遺産',
    mapHint: 'マーカーをクリックして詳細タブを開く · カーソルを合わせて接続を表示',
    mapClickMarkerHint: 'クリックでタブを開く',
    mapAddTrail: 'ルートに追加',
    mapInTrail: 'ルート登録済',
    mapDirectConnections: '直接アクセスルート',
    mapOpenTourTab: 'ツアー詳細を開く',
    mapNewBrowserTab: '新しいブラウザタブ',
    mapCustomTrailTitle: 'カスタムルート概要',
    mapClear: 'クリア',
    mapStops: '経由地',
    mapDistance: '総距離',
    mapEstTransit: '推定移動時間',
    mapRemove: '削除',
    mapTrailFooter1: '地図上の遺産を選び「ルートに追加」でカスタマイズできます。',
    mapTrailFooter2: '撮影に最適な光：ネパール時間 06:00–09:00 および 16:00–18:00',

    itineraryEyebrow: '複数遺産ルート作成・PDF印刷出力',
    itineraryTitle: '旅程ビルダー',
    itineraryDesc:
      'ディレクトリから遺産を選択して訪問順を並べ替え、徒歩・交通機関の移動時間と総距離を確認し、印刷可能なPDFを作成できます。',
    itineraryStep1: '1. 遺産スポットを選択',
    itinerarySelectAll: 'すべて選択',
    itineraryClear: 'クリア',
    itineraryStep2: '2. 移動手段とスケジュール',
    itineraryTitleInput: '旅程タイトル（PDF記載）',
    itineraryDate: '旅行日',
    itineraryStartTime: '開始時刻 (NPT)',
    itineraryTraveler: '旅行者・グループ名（任意）',
    itineraryOverviewEyebrow: '現在の旅程概要',
    itineraryStarts: '開始',
    itineraryReverse: '逆順',
    itineraryPrint: '印刷プレビュー',
    itineraryDownloadPdf: '印刷用PDFをダウンロード',
    itinerarySelectedStops: '選択したスポット',
    itineraryTotalDist: '総距離',
    itineraryEstTravel: '推定移動時間',
    itineraryEstDay: '合計所要時間',
    itineraryEmptyTitle: 'スポットがまだ選択されていません',
    itineraryEmptyDesc: '左側から2か所以上の遺産を選ぶか、おすすめコースを読み込んでください。',
    itineraryLoadLoop: '聖地巡礼コースを読み込む',
    itineraryArrive: '到着',
    itineraryHours: '拝観時間',
    itineraryTo: '次へ：',
    itineraryModeBalanced: '徒歩＋交通機関',
    itineraryModeBalancedSub: '短距離 (3.5km以下) は徒歩、長距離はバス・タクシー',
    itineraryModeWalk: '徒歩のみ',
    itineraryModeWalkSub: '歩行ペース (約4.3km/h) で歴史街区や参道を散策',
    itineraryModeTaxi: 'タクシー・専用車',
    itineraryModeTaxiSub: 'カトマンズ市内の交通状況を考慮した直行移動',
    presetSacredLoop: '聖地巡礼コース (4か所)',
    presetMalla: 'マッラ朝三都王宮巡り (4か所)',
    presetAll7: '全7大遺産コンプリート周遊',

    audioEyebrow: '音声アーカイブとサウンドスケープ',
    audioTitle: '公式サイト音声ガイド',
    audioDesc:
      'すべての遺産に現地収録の3章の音声解説、同期テキスト、シンギングボウルや寺院の鐘の音色を収録。',
    audioColSite: '遺産スポット',
    audioColEra: '時代・所在地',
    audioColChapter: '第1章タイトル',
    audioColDuration: '再生時間',
    audioColAction: '操作',
    audioBtnOpen: '音声とタブを開く',

    otherEyebrow: '拡張カトマンズ名所ガイド',
    otherTitle: 'その他の名所・おすすめ訪問スポット',
    otherDesc:
      '7大遺産以外にも、ブダニールカンタ寺院、クマリの館、キルティプル、コパン僧院の写真・地図・距離・交通・周辺施設・歴史背景をご覧いただけます。新しい場所の追加も可能です。',
    notableMapEyebrow: '距離・アクセス対話型マップ',
    notableMapTitle: 'カトマンズ中心部（タメル／バサンタプル）からの距離',
    notableMappedCount: '{count} か所をマップ表示',
    notableWalkLabel: '徒歩距離：',
    notableTransitLabel: '交通手段：',
    notableCommoditiesLabel: '周辺施設・設備：',
    notableSelectPinHint: '地図上のピンを選んで詳細を更新',
    notableSearchPlaceholder: '名所・周辺設備・歴史を検索…',
    notableBtnAdd: 'おすすめスポットを追加',
    notableBtnCloseForm: '閉じる',
    notableColSite: 'スポット・写真・所在地',
    notableColHistory: '歴史的背景',
    notableColLogistics: '距離・交通・周辺設備',
    notableAddedBadge: '追加登録',
    notableRemoveEntry: '削除',
    notableConfirm: '確定',
    notableCancel: 'キャンセル',
    adminNotableEyebrow: '管理者キュレーション室',
    adminNotableTitle: '管理者専用セクション · 新しい遺産・名所を追加',
    adminNotableDesc:
      'アトラス管理者がカトマンズ盆地の寺院や中庭・名所を本物の写真とともに追加公開するための専用スペースです。',
    adminNotableSignIn: '管理者としてログイン',
    adminNotableSignOut: 'ログアウト',
    adminBtn: '管理',
    adminSitesEyebrow: '制限付きキュレーション管理画面',
    adminSitesTitle: '遺産サイト管理者コンソール',
    adminSitesDesc: '承認された管理者専用です。HERITAGE_SITES ディレクトリへ新しい遺産を追加または削除できます。',
    adminSitesRestrictedTitle: '管理者アクセス制限',
    adminSitesRestrictedDesc: '遺産サイトを追加・削除するには、認証済み管理者アカウント（{email}）でログインしてください。',
    adminSitesWrongEmail: '{email} としてログイン中。編集権限は {admin} のみに制限されています。',
    adminSitesAddHeading: 'HERITAGE_SITES に遺産サイトを追加',
    adminSitesManageHeading: '公開中の HERITAGE_SITES ({count})',

    compEyebrow: '04. 同行者・連絡先・Gmail連携',
    compTitle: 'Google連絡先とGmailで旅程を共有',
    compDesc:
      'Google連絡先と連携して同行者と旅程を調整したり、Gmailで遺産ガイド資料の送信や受信確認を行えます。',
    compTabContacts: 'Google連絡先・ガイド',
    compTabGmail: 'Gmail送信・受信箱',

    breadcrumbHome: '遺産アトラス',
    breadcrumbDirectory: '谷地ディレクトリ',
    breadcrumbSiteDetails: '遺跡詳細',
    detailBack: 'ディレクトリに戻る',
    detailStartAudio: '音声ガイドを再生',
    detailStandaloneTab: '別タブで開く',
    detailVisitingHours: '拝観時間',
    detailEntryFee: '入場料',
    detailArchEra: '建築様式・時代',
    detailForeign: '外国人',
    detailSaarc: 'SAARC',
    detailLocal: '現地',
    detailTourHeading: 'インタラクティブ360°バーチャルツアー',
    detailTourHelp: 'ドラッグで見回し、スクロールで拡大、マーカーをクリックして見どころを確認できます。',
    detailTabRoutes: 'アクセス・ルート',
    detailTabAudio: '音声ガイド',
    detailTabHistory: '歴史背景と年表',
    detailTabArch: '建築と参拝マナー',
    detailTabCompanions: '同行者と共有',
    detailTabGmail: 'Gmail送信',
    detailRoutesToTake: '推奨アクセスルート',
    detailRoutesHelp: 'カトマンズ中心部や周辺遺産からの移動手段をお選びください。',
    detailFrom: '出発地：',
    detailDifficulty: '難易度',
    detailClimb: '高低差',
    detailRecWindow: 'おすすめ時間帯：',
    detailFieldTip: '現地メモ：',
    detailChronology: '歴史年表',
    detailAnatomy: '建築構造と意匠',
    detailEtiquetteTitle: '参拝マナーと祭礼',
    detailDress: '服装と履物',
    detailRitual: '参拝作法',
    detailPhoto: '写真撮影規定',
    detailFestival: '主要な祭り',
    detailShareEyebrow: 'かんたん共有',
    detailShareTitle: 'QRをスキャン、またはWhatsApp・Facebook・Messenger・Viber・メールで共有',
    detailContinueTitle: 'カトマンズ盆地の他スポットへ',
    detailContinueDesc: '別の遺産を開いてルートや360°景観を比較できます。',

    footerShareEyebrow: 'URLを入力せずにQRスキャンまたはアプリで即共有',
    footerShareTitle: '{target} をSNS・メッセージアプリで共有',
    footerManagedBy: 'Designed and managed by Suraj Giri as Antiquity Nepal',
    footerTagline: 'カトマンズ、パタン、バクタプルの360°ツアー、アクセスルート、音声歴史ガイド。',
    newsletterEyebrow: '遺産ニュースレター',
    newsletterTitle: '文化遺産の最新情報',
    newsletterDesc: '季節の散策案内、修復レポート、新しい360°公開情報をお届けします。',
    newsletterPlaceholder: 'メールアドレスを入力',
    newsletterSubscribe: '登録する',
    newsletterSubscribing: '送信中…',
    newsletterInvalidEmail: '有効なメールアドレスを入力してください。',
    newsletterSuccess: '登録完了 — {email} 宛てに最新の文化遺産情報をお送りします。',
    newsletterError: '登録を完了できませんでした。後ほどもう一度お試しください。',
    backToTop: 'トップへ戻る',
    shareOtherApps: 'その他のアプリ',
    shareQrCard: 'QRカード',
    qrModalEyebrow: 'Antiquity Nepal · 専用QRパス＆共有',
    qrModalTitle: 'QRスキャン・SNSアプリ共有',
    qrModalFullAtlas: '盆地フルアトラス',
    qrModalScanLabel: 'スキャンして360°ツアーとルートを開く',
    qrModalSelectLabel: '共有する遺産またはアトラス全体を選択',
    qrModalFullOption: 'カトマンズ遺産アトラス全体（全7か所）',
    qrModalLinkLabel: 'QRコード内リンク',
    qrModalDownload: '共有用QRカードを保存 (PNG)',
    qrModalCopyImg: 'QR画像をコピー',
    qrModalImgCopied: 'コピー完了',
    qrModalCopyUrl: 'URLをコピー',
    qrModalUrlCopied: 'URLをコピー済',
    qrModalSocialTitle: 'メッセージ・SNSアプリへ直接送信',
    qrModalFooterNote: '高コントラスト Level-H QR · 即時スキャン＆ワンクリック共有',

    navMajorAudioGuides: '音声ガイド一覧',
    navMajorOtherSites: 'おすすめの名所案内',
    navMajorTestimonials: '初訪問者の体験談',

    audioPageCatalogEyebrow: '7大遺産コンプリート音声アーカイブ',
    audioPageCatalogTitle: '全21章のナレーション音声ガイド',
    audioListenNow: '今すぐ聴く',

    testimonialsEyebrow: '旅行者クロニクル · 初訪問の記録と体験記',
    testimonialsTitle: '初訪問者の体験談・旅の感想',
    testimonialsDesc:
      'カトマンズ盆地の聖地を初めて訪れた旅行者の感動や、リピーターならではの気づきを読み、あなた自身の体験も共有できます。',
    testimonialsStatTotal: '公開体験談',
    testimonialsStatFirst: '初めての訪問',
    testimonialsStatRating: '平均評価',
    testimonialsFilterAll: 'すべての体験談',
    testimonialsFilterFirst: '初めての訪問',
    testimonialsFilterReturn: 'リピーター',
    testimonialsFilterSiteLabel: 'スポットで絞り込み：',
    testimonialsVisitedLabel: '訪問先：',
    testimonialsTipHeading: '初訪問者へのアドバイス',
    testimonialsEmptyTitle: '該当する体験談がありません',
    testimonialsEmptyDesc: 'フィルターを変更するか、この遺産の最初の体験談を投稿してください。',
    testimonialsSyncNotice: '厳選された体験談を表示中です。投稿するにはGoogleでログインしてください。',
    testimonialsFormEyebrow: '体験を共有する',
    testimonialsFormTitle: '初めての体験談を投稿',
    testimonialsFormDesc: 'アクセスルートや中庭の雰囲気など、これから訪れる旅人へ役立つ感想をお寄せください。',
    testimonialsSignInNotice: 'Googleアカウントでログインすると、共有体験記にあなたの投稿を公開できます。',
    testimonialsSignInBtn: 'Googleでログインして投稿',
    testimonialsSignInRequired: '投稿するには先にGoogleでログインしてください。',
    testimonialsSignedInAs: '投稿者名：',
    testimonialsFieldName: 'お名前 *',
    testimonialsFieldOrigin: '都市・国 *',
    testimonialsFieldVisitType: '訪問区分',
    testimonialsFieldSite: '訪問した遺産',
    testimonialsFieldDate: '訪問年月',
    testimonialsFieldRating: '満足度',
    testimonialsFieldHeadline: 'タイトル *',
    testimonialsFieldStory: '体験ストーリー *',
    testimonialsFieldTip: '初訪問者へのヒント（任意）',
    testimonialsSubmitBtn: '体験談を公開する',
    testimonialsPublishSuccess: 'ありがとうございます！体験談が公開されました。',
  },
  zh: {
    brandTitle: 'Suraj Giri 的加德满都遗产地图集',
    navHeritageSites: '遗产名胜',
    navTours360: '360°全景观览',
    navValleyRoutes: '河谷路线',
    navWorthVisiting: '精选名胜',
    navCompanionsMail: '旅伴与邮件',
    ctaPlanTrail: '规划遗产路线',
    tabDirectory: '河谷目录 (7)',

    weatherShortName: '加德满都',
    weatherLoading: '正在获取天气…',
    weatherTitle: '加德满都实时遗产游览天气',
    weatherSubTitle: '加德满都谷地 · 海拔 1,400米',
    weatherRetry: '重试',
    weatherHumidity: '相对湿度',
    weatherWind: '风速',
    weatherWalkPlanning: '户外游览建议',
    weatherBestWindow: '最佳游览时段：',
    weatherGrounded: '由 Google 搜索实时验证',

    langBarLabel: '语言',
    langTranslating: '翻译中…',

    heroEyebrow: '加德满都谷地联合国教科文组织世界遗产 · 7 大古迹区',
    heroHeadline: '360°沉浸式探索加德满都神圣文化遗产',
    heroDescription:
      '步入古老的尼瓦尔皇宫广场、山巅佛教佛塔与圣河畔印度教神庙。点击任意遗产即可开启专属标签页，体验360°全景视野、交通路线、历史档案与语音导览。',
    btnBrowseSites: '浏览全部7处遗产',
    btnLaunchPreview: '开启360°预览',
    btnQrShare: '二维码与分享',
    featuredBadge: '精选古迹',
    featuredSub: '3个360°观景点 · 泰米尔步行路线 · 3段历史语音讲解',
    btnOpenSiteTab: '打开站点标签',
    statZones: '世界遗产区',
    statZonesVal: '07 处古迹',
    statViews: '360°全景视角',
    statViewsVal: '21 个全景',
    statRoutes: '分段到达路线',
    statRoutesVal: '21 条路线',
    statAudio: '精选语音导览',
    statAudioVal: '21 个章节',

    dirEyebrow: '01. 策展古迹目录',
    dirTitle: '加德满都谷地七大遗产保护区',
    dirDescription:
      '点击任意古迹开启独立工作区标签，查看360°空间热点、到达路线、历史年表与语音讲解，或在新标签页中打开。',
    dirFilterPlaceholder: '按名称、地区、年代筛选…',
    dirTripStatus: '行程规划',
    dirStopSingular: '站',
    dirStopPlural: '站',
    dirBuilderLink: '行程编辑与PDF ↓',
    dirNoMatchTitle: '未找到匹配的遗产站点',
    dirNoMatchDesc: '请清除搜索条件或选择“全部站点”。',
    dirResetFilters: '重置筛选',
    cardTourBadge: '360°互动全景',
    cardExploreTab: '进入站点详情',
    cardAddTrip: '加入行程',
    cardStopPrefix: '第',
    cardQrShare: '二维码/分享',
    cardNewTab: '新标签',
    cardAudioHotspots: '{chapters} 节语音导览 · {hotspots} 处亮点',

    catAllSites: '全部站点',
    catRoyalPlaza: '皇宫广场',
    catBuddhistStupa: '佛教佛塔',
    catHinduSanctuary: '印度教圣地',
    catHilltopShrine: '山巅圣殿',
    catLivingTradition: '活态传统',
    catBuddhistSite: '佛教圣地',
    catHistoricTown: '历史古城',
    catCulturalLandmark: '文化地标',

    stageEyebrow: '02. 空间全景工作台',
    stageTitle: '360°互动全景预览台',
    stageDescription:
      '在下方切换七大遗产区，拖拽浏览360°全貌与建筑细节，并随时打开对应站点查看完整路线与语音。',
    stageOpenBtn: '打开 {site} 标签',

    routesEyebrow: '03. 河谷地图与到达走廊',
    routesTitle: '加德满都盆地交通与步行路线',
    routesDescription:
      '查看连接比什努马蒂河、巴格马蒂河与马诺哈拉河的步行廊道及公交路线，或定制多站点行程并导出可打印PDF。',
    mapEyebrow: '盆地地形与遗产分布图',
    mapTitle: '加德满都谷地遗产交通网络',
    mapLegendActive: '当前行程站点',
    mapLegendMonument: '谷地古迹',
    mapHint: '点击地图标记直接打开站点详情 · 悬停查看线路',
    mapClickMarkerHint: '点击标记打开详情',
    mapAddTrail: '加入路线',
    mapInTrail: '已在路线中',
    mapDirectConnections: '直连古迹廊道',
    mapOpenTourTab: '打开全景详情',
    mapNewBrowserTab: '新标签打开',
    mapCustomTrailTitle: '自定义路线概览',
    mapClear: '清空',
    mapStops: '站点数',
    mapDistance: '总距离',
    mapEstTransit: '预计交通',
    mapRemove: '移除',
    mapTrailFooter1: '在地图上任选站点并点击“加入路线”即可自由组合。',
    mapTrailFooter2: '最佳摄影光线：尼泊尔时间 06:00–09:00 与 16:00–18:00。',

    itineraryEyebrow: '多站点行程规划与可打印PDF导出',
    itineraryTitle: '行程规划生成器',
    itineraryDesc:
      '从目录选择遗产景点、自由调整游览顺序、对比步行与乘车耗时，并一键生成可打印的PDF行程单。',
    itineraryStep1: '1. 选择遗产站点',
    itinerarySelectAll: '全选',
    itineraryClear: '清空',
    itineraryStep2: '2. 出行方式与时间安排',
    itineraryTitleInput: '行程标题（显示在PDF上）',
    itineraryDate: '出行日期',
    itineraryStartTime: '出发时间 (NPT)',
    itineraryTraveler: '旅行者/团队名称（可选）',
    itineraryOverviewEyebrow: '当前行程总览',
    itineraryStarts: '出发时间',
    itineraryReverse: '倒序',
    itineraryPrint: '打印表单',
    itineraryDownloadPdf: '下载可打印 PDF',
    itinerarySelectedStops: '已选站点',
    itineraryTotalDist: '总里程',
    itineraryEstTravel: '预计路程耗时',
    itineraryEstDay: '全天总耗时',
    itineraryEmptyTitle: '尚未选择遗产站点',
    itineraryEmptyDesc: '请在左侧勾选两个及以上古迹，或直接载入推荐经典线路。',
    itineraryLoadLoop: '载入圣谷经典环线',
    itineraryArrive: '预计到达',
    itineraryHours: '开放时间',
    itineraryTo: '前往',
    itineraryModeBalanced: '步行 + 乘车',
    itineraryModeBalancedSub: '短途旧城步行 (<= 3.5 km)，跨河长距离乘公交或出租车',
    itineraryModeWalk: '全程步行',
    itineraryModeWalkSub: '约 4.3 km/h 徒步穿越历史街巷与山道',
    itineraryModeTaxi: '出租车 / 专车',
    itineraryModeTaxiSub: '结合加德满都路况的点对点车辆接驳',
    presetSacredLoop: '圣谷经典环线（4站）',
    presetMalla: '马拉三都皇宫巡礼（4站）',
    presetAll7: '7大世界遗产完整环线',

    audioEyebrow: '口述档案与声景记录',
    audioTitle: '精选古迹语音导览',
    audioDesc:
      '每处遗产均配有3节实地录制的语音讲解、同步文稿以及颂钵或寺庙钟声背景音景。',
    audioColSite: '遗产名称',
    audioColEra: '年代与位置',
    audioColChapter: '首章标题',
    audioColDuration: '时长',
    audioColAction: '操作',
    audioBtnOpen: '打开音频与详情',

    otherEyebrow: '扩展谷地名胜志',
    otherTitle: '其他值得一游的历史遗址与名胜',
    otherDesc:
      '除七大核心保护区外，还可探索布达尼尔坎塔睡佛寺、库玛丽女神宫、吉尔蒂布尔古城与柯盘寺，查看实景照片、地图距离、交通方式、周边设施与历史典故，或添加您自己的推荐地点。',
    notableMapEyebrow: '互动距离与交通分布图',
    notableMapTitle: '距加德满都市中心（泰米尔 / 巴桑塔普）距离',
    notableMappedCount: '已标注 {count} 处名胜',
    notableWalkLabel: '步行距离：',
    notableTransitLabel: '交通方式：',
    notableCommoditiesLabel: '周边配套设施：',
    notableSelectPinHint: '点击地图图钉切换详情',
    notableSearchPlaceholder: '搜索地点、设施、历史…',
    notableBtnAdd: '添加值得游览的地点',
    notableBtnCloseForm: '收起表单',
    notableColSite: '地点、照片与位置',
    notableColHistory: '历史典故与背景',
    notableColLogistics: '距离、交通与周边配套',
    notableAddedBadge: '已添加',
    notableRemoveEntry: '删除记录',
    notableConfirm: '确认',
    notableCancel: '取消',
    adminNotableEyebrow: '管理员策展专席',
    adminNotableTitle: '管理员专区 · 添加更多值得探访的古迹与地点',
    adminNotableDesc:
      '专为地图集管理员保留，用于发布更多加德满都谷地寺庙、庭院与历史地标及真实高清照片。',
    adminNotableSignIn: '管理员登录',
    adminNotableSignOut: '退出登录',
    adminBtn: '管理',
    adminSitesEyebrow: '受限策展管理后台',
    adminSitesTitle: '世界遗产站点管理员控制台',
    adminSitesDesc: '仅限授权人员访问。可向实时 HERITAGE_SITES 目录添加或移除遗产站点。',
    adminSitesRestrictedTitle: '管理员受限访问',
    adminSitesRestrictedDesc: '请使用已验证的管理员账号（{email}）登录以添加或移除遗产站点。',
    adminSitesWrongEmail: '当前登录账号为 {email}，修改权限仅限于 {admin}。',
    adminSitesAddHeading: '向 HERITAGE_SITES 添加遗产站点',
    adminSitesManageHeading: '当前活跃 HERITAGE_SITES ({count})',

    compEyebrow: '04. 旅伴、谷歌通讯录与 Gmail',
    compTitle: '通过通讯录与 Gmail 分享文化遗产行程',
    compDesc:
      '连接 Google 通讯录与旅伴协调加德满都行程，或使用 Gmail 发送古迹指南、保存草稿及查看往来邮件。',
    compTabContacts: 'Google 通讯录与向导',
    compTabGmail: 'Gmail 发送与收件箱',

    breadcrumbHome: '遗产图集',
    breadcrumbDirectory: '谷地目录',
    breadcrumbSiteDetails: '景点详情',
    detailBack: '返回谷地目录',
    detailStartAudio: '播放语音导览',
    detailStandaloneTab: '在独立标签页打开',
    detailVisitingHours: '开放时间',
    detailEntryFee: '门票信息',
    detailArchEra: '建筑年代',
    detailForeign: '外国游客',
    detailSaarc: '南亚联盟',
    detailLocal: '本地居民',
    detailTourHeading: '360°互动虚拟漫游',
    detailTourHelp: '横向或纵向拖拽环顾四周，滚轮缩放，或点击空间标记了解古迹细节。',
    detailTabRoutes: '到达路线',
    detailTabAudio: '语音导览',
    detailTabHistory: '历史背景与年表',
    detailTabArch: '建筑特色与礼仪',
    detailTabCompanions: '旅伴与分享',
    detailTabGmail: 'Gmail 发送',
    detailRoutesToTake: '推荐路线',
    detailRoutesHelp: '选择从加德满都市中心或周边遗产区出发的方式。',
    detailFrom: '起点：',
    detailDifficulty: '难度',
    detailClimb: '爬升',
    detailRecWindow: '推荐时段：',
    detailFieldTip: '实地贴士：',
    detailChronology: '历史编年史',
    detailAnatomy: '建筑结构与工艺',
    detailEtiquetteTitle: '参观礼仪与节庆',
    detailDress: '着装与鞋履',
    detailRitual: '宗教礼仪',
    detailPhoto: '摄影规定',
    detailFestival: '主要节庆',
    detailShareEyebrow: '即时分享',
    detailShareTitle: '扫描二维码或发送至 WhatsApp、Facebook、Messenger、Viber 与邮件',
    detailContinueTitle: '继续探索加德满都谷地',
    detailContinueDesc: '打开其他古迹标签以对比路线、建筑与360°全景。',

    footerShareEyebrow: '无需输入网址，扫码或一键分享',
    footerShareTitle: '将 {target} 分享至社交应用',
    footerManagedBy: '由 Suraj Giri 以 Antiquity Nepal 名义设计与管理',
    footerTagline: '覆盖加德满都、帕坦与巴德岗的360°虚拟游览、到达路线与历史语音导览。',
    newsletterEyebrow: '遗产动态简报',
    newsletterTitle: '遗产地更新订阅',
    newsletterDesc: '获取季节步行提示、修缮进展与全新 360° 古迹全景通知。',
    newsletterPlaceholder: '输入您的电子邮箱',
    newsletterSubscribe: '订阅',
    newsletterSubscribing: '提交中…',
    newsletterInvalidEmail: '请输入有效的电子邮箱地址。',
    newsletterSuccess: '已订阅 — {email} 将收到加德满都遗产地最新资讯。',
    newsletterError: '暂时无法完成订阅，请稍后再试。',
    backToTop: '返回顶部',
    shareOtherApps: '其他应用',
    shareQrCard: '二维码卡片',
    qrModalEyebrow: 'Antiquity Nepal · 专属二维码与社交分享',
    qrModalTitle: '扫描二维码或分享至社交应用',
    qrModalFullAtlas: '完整谷地地图集',
    qrModalScanLabel: '扫码直达 360° 全景与路线',
    qrModalSelectLabel: '选择古迹或完整地图集',
    qrModalFullOption: '加德满都遗产地图集全览（全部7处）',
    qrModalLinkLabel: '编码链接',
    qrModalDownload: '下载分享二维码卡片 (PNG)',
    qrModalCopyImg: '复制二维码图片',
    qrModalImgCopied: '已复制图片',
    qrModalCopyUrl: '复制链接',
    qrModalUrlCopied: '已复制链接',
    qrModalSocialTitle: '直接发送至聊天与社交应用',
    qrModalFooterNote: '高对比度 H 级容错二维码 · 扫码即达，一键分享',

    navMajorAudioGuides: '精选古迹语音导览',
    navMajorOtherSites: '其他值得一游之地',
    navMajorTestimonials: '初访旅人真实体验',

    audioPageCatalogEyebrow: '七大世界遗产完整有声档案',
    audioPageCatalogTitle: '全部 21 节现场语音导览章节',
    audioListenNow: '立即收听',

    testimonialsEyebrow: '旅人手记 · 初次造访感受与对比见闻',
    testimonialsTitle: '初次到访体验与游客真实感言',
    testimonialsDesc:
      '阅读首次来到加德满都谷地旅人的真实震撼与贴士，对比重游者的细腻观察，并写下您的旅行回忆。',
    testimonialsStatTotal: '已收录感言',
    testimonialsStatFirst: '初次到访',
    testimonialsStatRating: '平均评分',
    testimonialsFilterAll: '全部感言',
    testimonialsFilterFirst: '初次到访',
    testimonialsFilterReturn: '重游探索者',
    testimonialsFilterSiteLabel: '按景点筛选：',
    testimonialsVisitedLabel: '到访景点：',
    testimonialsTipHeading: '给初访旅人的实用建议',
    testimonialsEmptyTitle: '暂无符合条件的游记感言',
    testimonialsEmptyDesc: '请切换上方筛选条件，或成为第一位分享此古迹感受的旅人。',
    testimonialsSyncNotice: '当前展示精选旅人故事。登录 Google 账号即可发布您的亲身体验。',
    testimonialsFormEyebrow: '分享您的旅程',
    testimonialsFormTitle: '记录您的初次加德满都体验',
    testimonialsFormDesc: '分享路线感受、清晨钟声或给后来者的避坑贴士。',
    testimonialsSignInNotice: '使用 Google 账号登录后，即可将您的真实体验发布至加德满都谷地分享墙。',
    testimonialsSignInBtn: '使用 Google 登录并发布',
    testimonialsSignInRequired: '发布体验感言前请先登录 Google 账号。',
    testimonialsSignedInAs: '当前登录：',
    testimonialsFieldName: '您的称呼 *',
    testimonialsFieldOrigin: '来自城市/国家 *',
    testimonialsFieldVisitType: '造访类型',
    testimonialsFieldSite: '造访景点',
    testimonialsFieldDate: '到访年月',
    testimonialsFieldRating: '体验评分',
    testimonialsFieldHeadline: '感言标题 *',
    testimonialsFieldStory: '您的游览体验 *',
    testimonialsFieldTip: '给初访者的建议（可选）',
    testimonialsSubmitBtn: '发布到谷地旅人手记',
    testimonialsPublishSuccess: '感谢分享！您的旅行感言已同步至加德满都手记。',
  },
  pt: {
    brandTitle: 'Atlas do Patrimônio de Katmandu de Suraj Giri',
    navHeritageSites: 'Sítios Históricos',
    navTours360: 'Tours 360°',
    navValleyRoutes: 'Rotas do Vale',
    navWorthVisiting: 'Lugares para Visitar',
    navCompanionsMail: 'Contatos e E-mail',
    ctaPlanTrail: 'Planejar Roteiro',
    tabDirectory: 'Diretório (7)',

    weatherShortName: 'Katmandu',
    weatherLoading: 'Clima em Katmandu…',
    weatherTitle: 'Clima ao vivo para visitas',
    weatherSubTitle: 'Vale de Katmandu · 1.400 m',
    weatherRetry: 'Tentar novamente',
    weatherHumidity: 'Umidade',
    weatherWind: 'Vento',
    weatherWalkPlanning: 'Planejamento da caminhada',
    weatherBestWindow: 'Melhor horário:',
    weatherGrounded: 'Verificado via Google Search',

    langBarLabel: 'Idioma',
    langTranslating: 'Traduzindo…',

    heroEyebrow: 'Patrimônio Mundial UNESCO do Vale de Katmandu · 7 Zonas',
    heroHeadline: 'Explore o patrimônio sagrado de Katmandu em 360°',
    heroDescription:
      'Entre em antigas praças reais Newar, estupas budistas no alto das colinas e santuários hindus à beira do rio. Selecione qualquer monumento para abrir sua aba dedicada com panoramas 360°, rotas, arquivos históricos e guias em áudio.',
    btnBrowseSites: 'Ver Todos os 7 Sítios',
    btnLaunchPreview: 'Prévia 360°',
    btnQrShare: 'QR e Compartilhar',
    featuredBadge: 'Monumento em Destaque',
    featuredSub:
      'Três pontos de vista 360° · Trilha a pé de Thamel · Três capítulos em áudio',
    btnOpenSiteTab: 'Abrir Aba',
    statZones: 'Zonas Patrimoniais',
    statZonesVal: '07 Sítios',
    statViews: 'Vistas Interativas 360°',
    statViewsVal: '21 Panoramas',
    statRoutes: 'Rotas Passo a Passo',
    statRoutesVal: '21 Trilhas',
    statAudio: 'Guias em Áudio',
    statAudioVal: '21 Capítulos',

    dirEyebrow: '01. Diretório Curatorial',
    dirTitle: 'Zonas Monumentais do Vale de Katmandu',
    dirDescription:
      'Clique em qualquer monumento para abrir sua aba dedicada com pontos 360°, rotas, linhas do tempo e narração em áudio—ou abra em uma nova aba do navegador.',
    dirFilterPlaceholder: 'Filtrar por sítio, distrito, era…',
    dirTripStatus: 'Roteiro da Viagem',
    dirStopSingular: 'parada',
    dirStopPlural: 'paradas',
    dirBuilderLink: 'Criador e PDF ↓',
    dirNoMatchTitle: 'Nenhum sítio patrimonial encontrado',
    dirNoMatchDesc: 'Limpe o filtro de busca ou selecione “Todos os Sítios”.',
    dirResetFilters: 'Redefinir Filtros',
    cardTourBadge: 'Tour Interativo 360°',
    cardExploreTab: 'Explorar Aba',
    cardAddTrip: 'Adicionar ao Roteiro',
    cardStopPrefix: 'Parada',
    cardQrShare: 'QR / Compartilhar',
    cardNewTab: 'Nova Aba',
    cardAudioHotspots: '{chapters} capítulos em áudio · {hotspots} pontos de interesse',

    catAllSites: 'Todos os Sítios',
    catRoyalPlaza: 'Praça Real',
    catBuddhistStupa: 'Estupa Budista',
    catHinduSanctuary: 'Santuário Hindu',
    catHilltopShrine: 'Templo na Colina',
    catLivingTradition: 'Tradição Viva',
    catBuddhistSite: 'Sítio Budista',
    catHistoricTown: 'Cidade Histórica',
    catCulturalLandmark: 'Marco Cultural',

    stageEyebrow: '02. Mesa Panorâmica Espacial',
    stageTitle: 'Palco Interativo 360°',
    stageDescription:
      'Alterne entre as sete zonas monumentais abaixo para girar pelos horizontes em 360° e inspecionar marcos, depois abra a aba do sítio para rotas e áudio.',
    stageOpenBtn: 'Abrir Aba {site}',

    routesEyebrow: '03. Cartografia e Corredores de Chegada',
    routesTitle: 'Rotas pela Bacia de Katmandu',
    routesDescription:
      'Trace caminhos a pé e conexões de transporte pelos rios Bishnumati, Bagmati e Manohara, ou monte um roteiro multi-monumentos e exporte em PDF imprimível.',
    mapEyebrow: 'Cartografia Topográfica da Bacia',
    mapTitle: 'Rede Patrimonial do Vale de Katmandu',
    mapLegendActive: 'Parada ativa',
    mapLegendMonument: 'Monumento do vale',
    mapHint: 'Clique em qualquer marcador para abrir a aba · Passe o cursor para ver corredores',
    mapClickMarkerHint: 'Clique para abrir a aba',
    mapAddTrail: 'Adicionar à Rota',
    mapInTrail: 'Na Rota',
    mapDirectConnections: 'Conexões Diretas',
    mapOpenTourTab: 'Abrir Aba do Tour',
    mapNewBrowserTab: 'Nova Aba',
    mapCustomTrailTitle: 'Resumo da Rota Personalizada',
    mapClear: 'Limpar',
    mapStops: 'Paradas',
    mapDistance: 'Distância',
    mapEstTransit: 'Trânsito est.',
    mapRemove: 'Remover',
    mapTrailFooter1: 'Selecione qualquer sítio no mapa e clique em “Adicionar à Rota”.',
    mapTrailFooter2: 'Melhores janelas de luz: 06:00–09:00 e 16:00–18:00 hora local do Nepal.',

    itineraryEyebrow: 'Planejador Multi-Sítios e Exportação Imprimível',
    itineraryTitle: 'Criador de Roteiro',
    itineraryDesc:
      'Escolha os monumentos do diretório, organize a ordem de visita, compare tempo a pé ou de transporte e baixe um roteiro em PDF imprimível.',
    itineraryStep1: '1. Selecionar Sítios',
    itinerarySelectAll: 'Selecionar Todos',
    itineraryClear: 'Limpar',
    itineraryStep2: '2. Modo de Viagem e Horário',
    itineraryTitleInput: 'Título do Roteiro (no PDF)',
    itineraryDate: 'Data da Viagem',
    itineraryStartTime: 'Hora de Início (NPT)',
    itineraryTraveler: 'Nome do Viajante / Grupo (opcional)',
    itineraryOverviewEyebrow: 'Visão Geral do Roteiro Ativo',
    itineraryStarts: 'Início',
    itineraryReverse: 'Inverter',
    itineraryPrint: 'Imprimir',
    itineraryDownloadPdf: 'Baixar PDF Imprimível',
    itinerarySelectedStops: 'Paradas Escolhidas',
    itineraryTotalDist: 'Distância Total',
    itineraryEstTravel: 'Tempo de Viagem Est.',
    itineraryEstDay: 'Duração Total Est.',
    itineraryEmptyTitle: 'Nenhum sítio selecionado ainda',
    itineraryEmptyDesc:
      'Selecione dois ou mais monumentos à esquerda ou carregue um circuito pronto.',
    itineraryLoadLoop: 'Carregar Circuito Sagrado',
    itineraryArrive: 'Chegada',
    itineraryHours: 'Horário',
    itineraryTo: 'Para',
    itineraryModeBalanced: 'A pé + Transporte',
    itineraryModeBalancedSub: 'Caminhe trechos curtos (<= 3,5 km); use ônibus ou táxi nos mais longos',
    itineraryModeWalk: 'A Pé (Caminhada)',
    itineraryModeWalkSub: 'Ritmo de caminhada (~4,3 km/h) por vielas e trilhas históricas',
    itineraryModeTaxi: 'Táxi / Carro Privado',
    itineraryModeTaxiSub: 'Traslado direto considerando o trânsito do vale de Katmandu',
    presetSacredLoop: 'Circuito Sagrado (4 Paradas)',
    presetMalla: 'Três Reinos Malla (4 Paradas)',
    presetAll7: 'Circuito Completo (7 Monumentos)',

    audioEyebrow: 'Arquivo Falado e Paisagens Sonoras',
    audioTitle: 'Guias em Áudio Curados',
    audioDesc:
      'Cada destino inclui três capítulos narrados em campo com transcrições sincronizadas e sons de taças tibetanas ou sinos de templos.',
    audioColSite: 'Sítio Patrimonial',
    audioColEra: 'Era e Localização',
    audioColChapter: 'Capítulo em Destaque',
    audioColDuration: 'Duração',
    audioColAction: 'Ação',
    audioBtnOpen: 'Abrir Áudio e Aba',

    otherEyebrow: 'Registro Estendido do Vale',
    otherTitle: 'Outros Sítios e Lugares que Valem a Visita',
    otherDesc:
      'Além das sete zonas principais—explore o Templo Budhanilkantha, Kumari Ghar, Kirtipur e o Mosteiro Kopan com fotos, distâncias no mapa, transporte, comodidades e a história de cada local, ou adicione novos lugares.',
    notableMapEyebrow: 'Mapa Interativo de Distância e Transporte',
    notableMapTitle: 'Distância do Centro de Katmandu (Thamel / Basantapur)',
    notableMappedCount: '{count} Locais Mapeados',
    notableWalkLabel: 'A pé:',
    notableTransitLabel: 'Transporte:',
    notableCommoditiesLabel: 'Comodidades próximas:',
    notableSelectPinHint: 'Selecione um pino no mapa para atualizar',
    notableSearchPlaceholder: 'Buscar lugares, comodidades, história…',
    notableBtnAdd: 'Adicionar Lugar para Visitar',
    notableBtnCloseForm: 'Fechar',
    notableColSite: 'Sítio, Foto e Local',
    notableColHistory: 'História do Local',
    notableColLogistics: 'Distância, Transporte e Comodidades',
    notableAddedBadge: 'Adicionado',
    notableRemoveEntry: 'Remover',
    notableConfirm: 'Confirmar',
    notableCancel: 'Cancelar',
    adminNotableEyebrow: 'Mesa Curatorial do Administrador',
    adminNotableTitle: 'Espaço do Administrador · Adicionar Mais Locais',
    adminNotableDesc:
      'Reservado ao administrador do atlas para publicar novos templos, pátios e marcos históricos do Vale de Katmandu.',
    adminNotableSignIn: 'Entrar como Administrador',
    adminNotableSignOut: 'Sair',
    adminBtn: 'Admin',
    adminSitesEyebrow: 'Console Curatorial Restrito',
    adminSitesTitle: 'Administrador de Sítios Patrimoniais',
    adminSitesDesc: 'Apenas pessoal autorizado. Adicione ou remova monumentos do diretório ativo HERITAGE_SITES.',
    adminSitesRestrictedTitle: 'Acesso Restrito ao Administrador',
    adminSitesRestrictedDesc: 'Entre com a conta verificada ({email}) para adicionar ou remover sítios patrimoniais.',
    adminSitesWrongEmail: 'Conectado como {email}. O acesso é estritamente reservado a {admin}.',
    adminSitesAddHeading: 'Adicionar Sítio a HERITAGE_SITES',
    adminSitesManageHeading: 'Diretório Ativo HERITAGE_SITES ({count})',

    compEyebrow: '04. Companheiros, Contatos e Gmail',
    compTitle: 'Compartilhe Roteiros via Contatos e Gmail',
    compDesc:
      'Conecte o Google Contatos para coordenar passeios em Katmandu com amigos, ou use o Gmail para enviar dossiês e ler mensagens.',
    compTabContacts: 'Google Contatos e Guias',
    compTabGmail: 'Envio Gmail e Caixa',

    breadcrumbHome: 'Atlas do Patrimônio',
    breadcrumbDirectory: 'Diretório do Vale',
    breadcrumbSiteDetails: 'Detalhes do Local',
    detailBack: 'Voltar ao Diretório',
    detailStartAudio: 'Iniciar Guia de Áudio',
    detailStandaloneTab: 'Abrir em Nova Aba',
    detailVisitingHours: 'Horário de Visita',
    detailEntryFee: 'Taxa de Entrada',
    detailArchEra: 'Era Arquitetônica',
    detailForeign: 'Estrangeiros',
    detailSaarc: 'SAARC',
    detailLocal: 'Locais',
    detailTourHeading: 'Tour Virtual Interativo 360°',
    detailTourHelp:
      'Arraste horizontal ou verticalmente para explorar, dê zoom ou clique nos marcadores.',
    detailTabRoutes: 'Rotas e Direções',
    detailTabAudio: 'Guia de Áudio',
    detailTabHistory: 'Contexto Histórico e Cronologia',
    detailTabArch: 'Arquitetura e Etiqueta',
    detailTabCompanions: 'Companheiros e Compartilhar',
    detailTabGmail: 'Envio Gmail',
    detailRoutesToTake: 'Rotas para Seguir',
    detailRoutesHelp: 'Escolha seu método preferido a partir do centro de Katmandu.',
    detailFrom: 'De',
    detailDifficulty: 'Dificuldade',
    detailClimb: 'subida',
    detailRecWindow: 'Horário recomendado:',
    detailFieldTip: 'Dica de campo:',
    detailChronology: 'Cronologia Histórica',
    detailAnatomy: 'Anatomia Arquitetônica',
    detailEtiquetteTitle: 'Etiqueta e Festivais',
    detailDress: 'Vestimenta e Calçados',
    detailRitual: 'Etiqueta Ritual',
    detailPhoto: 'Política de Fotografia',
    detailFestival: 'Festival Principal',
    detailShareEyebrow: 'Compartilhar Agora',
    detailShareTitle: 'Escaneie o QR ou envie para WhatsApp, Facebook, Messenger, Viber e E-mail',
    detailContinueTitle: 'Continuar Explorando o Vale',
    detailContinueDesc: 'Abra outro monumento para comparar rotas, arquitetura e vistas 360°.',

    footerShareEyebrow: 'Escaneie o Passe QR ou Compartilhe sem Digitar o Endereço',
    footerShareTitle: 'Compartilhar {target} em Apps Sociais',
    footerManagedBy: 'Projetado e gerenciado por Suraj Giri como Antiquity Nepal',
    footerTagline:
      'Tours virtuais 360°, rotas patrimoniais e guias históricos em áudio por Katmandu, Patan e Bhaktapur.',
    newsletterEyebrow: 'Boletim Patrimonial',
    newsletterTitle: 'Atualizações dos Sítios Históricos',
    newsletterDesc:
      'Receba avisos de trilhas sazonais, restaurações e novas vistas 360°.',
    newsletterPlaceholder: 'Digite seu endereço de e-mail',
    newsletterSubscribe: 'Inscrever-se',
    newsletterSubscribing: 'Enviando…',
    newsletterInvalidEmail: 'Por favor, insira um endereço de e-mail válido.',
    newsletterSuccess: 'Inscrito — {email} receberá atualizações do patrimônio de Katmandu.',
    newsletterError: 'Não foi possível concluir sua inscrição agora. Tente novamente.',
    backToTop: 'Voltar ao topo',
    shareOtherApps: 'Outros Apps',
    shareQrCard: 'Cartão QR',
    qrModalEyebrow: 'Antiquity Nepal · Passe QR e Compartilhamento',
    qrModalTitle: 'Escanear QR ou Compartilhar em Apps',
    qrModalFullAtlas: 'Atlas Completo do Vale',
    qrModalScanLabel: 'Escaneie para abrir o tour 360° e rotas',
    qrModalSelectLabel: 'Escolha o Monumento ou Destino do Atlas',
    qrModalFullOption: 'Atlas Completo do Patrimônio de Katmandu (7 Sítios)',
    qrModalLinkLabel: 'Link Codificado',
    qrModalDownload: 'Baixar Cartão QR (PNG)',
    qrModalCopyImg: 'Copiar Imagem QR',
    qrModalImgCopied: 'QR Copiado',
    qrModalCopyUrl: 'Copiar URL',
    qrModalUrlCopied: 'Link Copiado',
    qrModalSocialTitle: 'Compartilhar Diretamente em Apps de Mensagens e Redes',
    qrModalFooterNote: 'QR Nível-H de alto contraste · Leitura instantânea e envio em 1 clique',

    navMajorAudioGuides: 'Guias em Áudio',
    navMajorOtherSites: 'Outros Lugares para Visitar',
    navMajorTestimonials: 'Relatos de Primeira Viagem',

    audioPageCatalogEyebrow: 'Arquivo Sonoro Completo · 7 Monumentos',
    audioPageCatalogTitle: 'Todos os 21 Capítulos Narrados',
    audioListenNow: 'Ouvir Agora',

    testimonialsEyebrow: 'Crônica de Viajantes · Primeiras Visitas',
    testimonialsTitle: 'Depoimentos de Primeira Viagem e Relatos',
    testimonialsDesc:
      'Leia impressões genuínas de viajantes que conheceram o Vale de Katmandu pela primeira vez e reflexões de exploradores experientes, ou compartilhe sua própria jornada.',
    testimonialsStatTotal: 'Relatos Publicados',
    testimonialsStatFirst: 'Primeira Visita',
    testimonialsStatRating: 'Nota Média',
    testimonialsFilterAll: 'Todos os Relatos',
    testimonialsFilterFirst: 'Primeira Visita',
    testimonialsFilterReturn: 'Visitante Recorrente',
    testimonialsFilterSiteLabel: 'Filtrar por sítio:',
    testimonialsVisitedLabel: 'Visitou',
    testimonialsTipHeading: 'Dica para Novos Visitantes',
    testimonialsEmptyTitle: 'Nenhum relato corresponde ao filtro',
    testimonialsEmptyDesc: 'Altere o filtro acima ou publique o primeiro relato deste sítio.',
    testimonialsSyncNotice: 'Exibindo relatos curados. Entre com o Google para publicar sua experiência.',
    testimonialsFormEyebrow: 'Contribua com seu Relato',
    testimonialsFormTitle: 'Compartilhe Sua Primeira Experiência',
    testimonialsFormDesc:
      'Ajude futuros viajantes contando como foram o trajeto, a atmosfera dos pátios e a história do local.',
    testimonialsSignInNotice:
      'Entre com o Google para publicar seu depoimento verificado na crônica comunitária do vale.',
    testimonialsSignInBtn: 'Entrar com Google para Publicar',
    testimonialsSignInRequired: 'Entre com o Google antes de publicar seu relato.',
    testimonialsSignedInAs: 'Publicando como',
    testimonialsFieldName: 'Seu Nome *',
    testimonialsFieldOrigin: 'Cidade / País *',
    testimonialsFieldVisitType: 'Tipo de Visita',
    testimonialsFieldSite: 'Sítio Visitado',
    testimonialsFieldDate: 'Mês e Ano',
    testimonialsFieldRating: 'Avaliação',
    testimonialsFieldHeadline: 'Título do Relato *',
    testimonialsFieldStory: 'Sua História *',
    testimonialsFieldTip: 'Melhor Dica para Novatos (opcional)',
    testimonialsSubmitBtn: 'Publicar Depoimento',
    testimonialsPublishSuccess: 'Obrigado! Seu relato já está publicado na crônica de Katmandu.',
  },
};

const CATEGORY_MAP: Record<string, UIStringKey> = {
  All: 'catAllSites',
  'All Sites': 'catAllSites',
  'Royal Plaza': 'catRoyalPlaza',
  'Buddhist Stupa': 'catBuddhistStupa',
  'Hindu Sanctuary': 'catHinduSanctuary',
  'Hilltop Shrine': 'catHilltopShrine',
  'Living Tradition': 'catLivingTradition',
  'Buddhist Site': 'catBuddhistSite',
  'Historic Town': 'catHistoricTown',
  'Cultural Landmark': 'catCulturalLandmark',
};

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: UIStringKey, vars?: Record<string, string | number>) => string;
  translateCategory: (cat: string) => string;
  isTranslating: boolean;
  translationError: string | null;
  dismissTranslationError: () => void;
  cacheVersion: number;
  getCachedTranslation: (sourceText: string) => string | undefined;
  requestBatchTranslation: (texts: string[]) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// Module-level store so translations persist seamlessly across mounts
const memoryTranslations = new Map<string, string>();
const inflightTexts = new Set<string>();

function loadPersistedTranslations() {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') {
          memoryTranslations.set(k, v);
        }
      }
    }
  } catch {
    // Ignore storage corruption cleanly
  }
}

function savePersistedTranslations() {
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(memoryTranslations.entries()).slice(-1500);
    const obj: Record<string, string> = {};
    for (const [k, v] of entries) {
      obj[k] = v;
    }
    window.localStorage.setItem(
      TRANSLATION_CACHE_STORAGE_KEY,
      JSON.stringify(obj)
    );
  } catch {
    // Ignore storage quota errors
  }
}

loadPersistedTranslations();

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (
      saved === 'en' ||
      saved === 'fr' ||
      saved === 'es' ||
      saved === 'ja' ||
      saved === 'zh' ||
      saved === 'pt'
    ) {
      return saved;
    }
    return 'en';
  });

  const [pendingNetworkCount, setPendingNetworkCount] = useState(0);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [cacheVersion, setCacheVersion] = useState(0);

  // Batching queue per tick so multiple components mounting together coalesce into fewer API requests
  const queueRef = useRef<Map<string, string>>(new Map());
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeLangRef = useRef<LanguageCode>(language);
  activeLangRef.current = language;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  const setLanguage = useCallback((nextLang: LanguageCode) => {
    setTranslationError(null);
    setLanguageState(nextLang);
  }, []);

  const t = useCallback(
    (key: UIStringKey, vars?: Record<string, string | number>): string => {
      const table = UI_TRANSLATIONS[language] ?? EN_UI;
      let str = table[key] ?? EN_UI[key] ?? key;
      if (vars) {
        for (const [varKey, varVal] of Object.entries(vars)) {
          str = str.replace(
            new RegExp(`\\{${varKey}\\}`, 'g'),
            String(varVal)
          );
        }
      }
      return str;
    },
    [language]
  );

  const translateCategory = useCallback(
    (cat: string): string => {
      const mappedKey = CATEGORY_MAP[cat];
      if (!mappedKey) return cat;
      return t(mappedKey);
    },
    [t]
  );

  const flushQueue = useCallback(async () => {
    const lang = activeLangRef.current;
    if (lang === 'en') {
      queueRef.current.clear();
      return;
    }

    const entries = Array.from(queueRef.current.entries());
    queueRef.current.clear();
    if (entries.length === 0) return;

    // Split into chunks of 30 items for fast parallel/sequential resolution
    const CHUNK = 30;
    for (let i = 0; i < entries.length; i += CHUNK) {
      const slice = entries.slice(i, i + CHUNK);
      const payloadItems: Record<string, string> = {};
      slice.forEach(([cacheKey, sourceText]) => {
        payloadItems[cacheKey] = sourceText;
      });

      setPendingNetworkCount((c) => c + 1);
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLanguage: lang as TargetLanguageCode,
            items: payloadItems,
          }),
        });
        const data = (await res.json()) as {
          translations?: Record<string, string>;
          error?: string;
        };
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Translation service unavailable.');
        }
        if (data.translations) {
          for (const [cacheKey, translatedText] of Object.entries(
            data.translations
          )) {
            if (typeof translatedText === 'string' && translatedText.trim()) {
              memoryTranslations.set(cacheKey, translatedText);
            }
          }
          savePersistedTranslations();
          setCacheVersion((v) => v + 1);
        }
      } catch (err) {
        setTranslationError(
          err instanceof Error
            ? err.message
            : 'Unable to translate dynamic heritage descriptions.'
        );
      } finally {
        slice.forEach(([cacheKey]) => inflightTexts.delete(cacheKey));
        setPendingNetworkCount((c) => Math.max(0, c - 1));
      }
    }
  }, []);

  const getCachedTranslation = useCallback(
    (sourceText: string): string | undefined => {
      if (language === 'en') return sourceText;
      const trimmed = sourceText.trim();
      if (!trimmed) return sourceText;
      return memoryTranslations.get(`${language}:${trimmed}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, cacheVersion]
  );

  const requestBatchTranslation = useCallback(
    (texts: string[]) => {
      if (language === 'en') return;
      let added = false;

      for (const raw of texts) {
        const trimmed = raw?.trim();
        if (!trimmed) continue;
        const cacheKey = `${language}:${trimmed}`;
        if (
          memoryTranslations.has(cacheKey) ||
          inflightTexts.has(cacheKey) ||
          queueRef.current.has(cacheKey)
        ) {
          continue;
        }
        inflightTexts.add(cacheKey);
        queueRef.current.set(cacheKey, trimmed);
        added = true;
      }

      if (added) {
        if (flushTimerRef.current) {
          clearTimeout(flushTimerRef.current);
        }
        flushTimerRef.current = setTimeout(() => {
          flushTimerRef.current = null;
          void flushQueue();
        }, 25);
      }
    },
    [language, flushQueue]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      translateCategory,
      isTranslating: pendingNetworkCount > 0,
      translationError,
      dismissTranslationError: () => setTranslationError(null),
      cacheVersion,
      getCachedTranslation,
      requestBatchTranslation,
    }),
    [
      language,
      setLanguage,
      t,
      translateCategory,
      pendingNetworkCount,
      translationError,
      cacheVersion,
      getCachedTranslation,
      requestBatchTranslation,
    ]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}

/**
 * Translates a dictionary of English strings into the active language.
 * Returns English source values immediately while Gemini batch translation resolves,
 * then updates cleanly from cache on completion.
 */
export function useTranslatedTexts<T extends Record<string, string>>(
  sourceMap: T
): T {
  const {
    language,
    cacheVersion,
    getCachedTranslation,
    requestBatchTranslation,
  } = useLanguage();

  const signature = useMemo(() => {
    return Object.entries(sourceMap)
      .map(([k, v]) => `${k}=${v}`)
      .join('|');
  }, [sourceMap]);

  useEffect(() => {
    if (language === 'en') return;
    const missing = Object.values(sourceMap).filter(
      (val) => typeof val === 'string' && val.trim().length > 0 && !getCachedTranslation(val)
    );
    if (missing.length > 0) {
      requestBatchTranslation(missing);
    }
  }, [language, signature, getCachedTranslation, requestBatchTranslation, sourceMap]);

  return useMemo(() => {
    if (language === 'en') return sourceMap;
    const resolved: Record<string, string> = {};
    for (const [key, val] of Object.entries(sourceMap)) {
      resolved[key] = getCachedTranslation(val) ?? val;
    }
    return resolved as T;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, signature, cacheVersion, getCachedTranslation]);
}
