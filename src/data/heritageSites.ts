import kathmanduDurbarImg from '../assets/images/kathmandu_durbar_panorama_1794711180968.jpg';
import swayambhunathImg from '../assets/images/swayambhunath_panorama_1794711182286.jpg';
import boudhanathImg from '../assets/images/boudhanath_panorama_1794711181887.jpg';
import pashupatinathImg from '../assets/images/pashupatinath_panorama_1794711183372.jpg';
import patanDurbarImg from '../assets/images/patan_durbar_panorama_1794711184006.jpg';
import bhaktapurDurbarImg from '../assets/images/bhaktapur_durbar_panorama_1794711184092.jpg';
import changuNarayanImg from '../assets/images/changu_narayan_panorama_1794711185161.jpg';

export type HeritageCategory = 'Royal Plaza' | 'Buddhist Stupa' | 'Hindu Sanctuary' | 'Hilltop Shrine';

export type TransportMode = 'Walking Trail' | 'Public Transit' | 'Taxi / Cycle';

export interface PanoramaViewpoint {
  id: string;
  title: string;
  subtitle: string;
  initialYaw: number;
  initialPitch: number;
  defaultFov: number;
  atmosphereTint: 'golden' | 'dawn' | 'courtyard';
}

export interface PanoramaHotspot {
  id: string;
  viewpointId: string;
  yaw: number;
  pitch: number;
  title: string;
  category: string;
  period: string;
  description: string;
  architecturalNote: string;
  audioChapterIndex: number;
}

export interface RouteWaypoint {
  step: number;
  landmark: string;
  instruction: string;
  note?: string;
}

export interface DestinationRoute {
  id: string;
  mode: TransportMode;
  origin: string;
  distanceKm: number;
  durationMin: number;
  elevationGainM: number;
  difficulty: 'Gentle' | 'Moderate' | 'Steep Ascent';
  bestWindow: string;
  overview: string;
  waypoints: RouteWaypoint[];
}

export interface HistoricalMilestone {
  year: string;
  era: string;
  title: string;
  detail: string;
}

export interface ArchitecturalFeature {
  name: string;
  material: string;
  detail: string;
}

export interface AudioChapter {
  id: string;
  number: string;
  title: string;
  durationSec: number;
  narratorRole: string;
  ambientProfile: 'singing-bowl' | 'temple-bells' | 'river-wind';
  script: string[];
}

export interface HeritageSite {
  id: string;
  slug: string;
  name: string;
  nativeName: string;
  district: string;
  category: HeritageCategory;
  era: string;
  foundedYear: string;
  elevationMeters: number;
  coordinates: {
    lat: number;
    lng: number;
    label: string;
  };
  mapPos: {
    x: number;
    y: number;
  };
  unescoRef: string;
  visitingHours: string;
  entryFees: {
    foreign: string;
    saarc: string;
    nepali: string;
  };
  panoramaImage: string;
  galleryImages?: string[];
  summary: string;
  quote: {
    text: string;
    attribution: string;
  };
  historicalEssay: string[];
  viewpoints: PanoramaViewpoint[];
  hotspots: PanoramaHotspot[];
  routes: DestinationRoute[];
  timeline: HistoricalMilestone[];
  architecturalFeatures: ArchitecturalFeature[];
  audioChapters: AudioChapter[];
  visitorNotes: {
    dressCode: string;
    etiquette: string;
    photography: string;
    majorFestival: string;
  };
}

export interface TrailCorridor {
  id: string;
  fromId: string;
  toId: string;
  distanceKm: number;
  walkingMin: number | null;
  transitMin: number;
  corridorName: string;
  highlights: string;
}

export const HERITAGE_SITES: HeritageSite[] = [
  {
    id: 'kathmandu-durbar-square',
    slug: 'kathmandu-durbar-square',
    name: 'Kathmandu Durbar Square',
    nativeName: 'वसन्तपुर दरबार क्षेत्र',
    district: 'Central Kathmandu · Basantapur',
    category: 'Royal Plaza',
    era: 'Licchavi to Shah Dynasties',
    foundedYear: 'c. 12th–18th Century',
    elevationMeters: 1350,
    coordinates: {
      lat: 27.7042,
      lng: 85.3066,
      label: '27.7042° N, 85.3066° E',
    },
    mapPos: { x: 420, y: 318 },
    unescoRef: 'UNESCO WHL 121bis · Zone I',
    visitingHours: 'Daily 06:00 – 19:00 (Museums 10:00 – 16:30)',
    entryFees: {
      foreign: 'NPR 1,000',
      saarc: 'NPR 150',
      nepali: 'Free',
    },
    panoramaImage: kathmanduDurbarImg,
    summary:
      'The historic coronation plaza of Nepal’s Malla and Shah monarchs, uniting multi-tiered Newari pagodas, the Kumari Bahal residence, and Hanuman Dhoka’s labyrinthine brick courtyards.',
    quote: {
      text: 'Every carved timber strut along Basantapur acts as both a structural cantilever against monsoon weight and a theological manuscript in sal wood.',
      attribution: 'Kathmandu Valley Preservation Archive',
    },
    historicalEssay: [
      'Known locally as Hanuman Dhoka Durbar Square, this interlocking ensemble of brick courtyards and multi-roofed temples served for centuries as the ceremonial heart of Kathmandu. While Licchavi-period foundations date back to the fifth century, the surviving skyline took shape under the late Malla kings—most notably Pratap Malla in the seventeenth century—before King Prithvi Narayan Shah adopted the palace as the seat of unified Nepal in 1769.',
      'The square unfolds as an open-air urban theater where sacred architecture meets daily neighborhood life. On the western flank stands the Kumari Ghar, built in 1757 by Jaya Prakash Malla with intricately latticed wooden balconies overlooking a tranquil inner quadrangle. Across the stone-paved plaza rise the towering three-tiered Taleju Bhawani Temple, the octagonal Chyasin Dega, and the monumental Kal Bhairav bas-relief.',
      'Following the 2015 Gorkha earthquake, master Newari carpenters, brickmakers, and stone conservators undertook painstaking structural restorations—rebuilding the Kasthamandap timber pavilion from salvaged sal-wood joinery and stabilizing the nine-story Basantapur Tower without sacrificing traditional lime-surkhi mortar.',
    ],
    viewpoints: [
      {
        id: 'kds-plaza',
        title: 'Main Coronation Plaza',
        subtitle: 'Looking across the central pagoda axis toward Taleju & Jagannath',
        initialYaw: 0,
        initialPitch: 4,
        defaultFov: 70,
        atmosphereTint: 'golden',
      },
      {
        id: 'kds-kumari',
        title: 'Kumari Ghar & Basantapur Edge',
        subtitle: 'Southern quadrangle facing the carved timber facade',
        initialYaw: -58,
        initialPitch: 2,
        defaultFov: 62,
        atmosphereTint: 'courtyard',
      },
      {
        id: 'kds-taleju',
        title: 'Taleju Roofline & Spire Horizon',
        subtitle: 'Elevated perspective over brick eaves and distant hills',
        initialYaw: 46,
        initialPitch: 10,
        defaultFov: 56,
        atmosphereTint: 'dawn',
      },
    ],
    hotspots: [
      {
        id: 'kds-hs-1',
        viewpointId: 'kds-plaza',
        yaw: -42,
        pitch: 12,
        title: 'Maju Dega & Stepped Plinth',
        category: 'Pagoda Architecture',
        period: '1690 CE · Queen Mother Riddhilakshmi',
        description:
          'A three-roofed Shiva shrine elevated on a nine-stage brick pedestal that doubles as Kathmandu’s favorite sunset gathering steps.',
        architecturalNote: 'Nine-tier plinth distributes seismic lateral loads beneath heavy terracotta tile eaves.',
        audioChapterIndex: 1,
      },
      {
        id: 'kds-hs-2',
        viewpointId: 'kds-plaza',
        yaw: 14,
        pitch: 15,
        title: 'Taleju Bhawani Temple Spire',
        category: 'Royal Patron Deity',
        period: '1564 CE · King Mahendra Malla',
        description:
          'Standing 36 meters tall on a twelve-tiered podium, Taleju served as the tutelary goddess of the Malla dynasty and opens to devotees once a year during Dashain.',
        architecturalNote: 'Gilded copper gajur finial crowns nested square roofs supported by 45-degree sal struts.',
        audioChapterIndex: 0,
      },
      {
        id: 'kds-hs-3',
        viewpointId: 'kds-plaza',
        yaw: 48,
        pitch: 18,
        title: 'Gaddi Baithak & Shikhara Axis',
        category: 'Colonial & Stone Craft',
        period: '17th–20th Century',
        description:
          'Contrasting stone shikhara towers stand beside royal audience halls, marking the architectural transition from Malla brickwork to Rana-era stucco.',
        architecturalNote: 'Hand-dressed grey stone blocks interlocked with concealed iron cramps.',
        audioChapterIndex: 2,
      },
      {
        id: 'kds-hs-4',
        viewpointId: 'kds-kumari',
        yaw: -52,
        pitch: 5,
        title: 'Kumari Bahal (Living Goddess Courtyard)',
        category: 'Living Heritage',
        period: '1757 CE · Jaya Prakash Malla',
        description:
          'Designed in the style of a Buddhist monastic vihara, this three-story brick residence houses the Royal Kumari, venerated jointly by Hindus and Newar Buddhists.',
        architecturalNote: 'Carved peacock windows (Mayur Jhyal) and repoussé brass lintel guardians.',
        audioChapterIndex: 2,
      },
    ],
    routes: [
      {
        id: 'kds-walk-thamel',
        mode: 'Walking Trail',
        origin: 'Thamel Chowk via Asan Bazaar',
        distanceKm: 1.6,
        durationMin: 22,
        elevationGainM: 8,
        difficulty: 'Gentle',
        bestWindow: '06:30 – 09:00 or 16:30 – 18:00',
        overview:
          'Kathmandu’s most atmospheric heritage walk threads directly through ancient Newari merchant quarters, spice markets, and hidden bahal courtyards.',
        waypoints: [
          {
            step: 1,
            landmark: 'Thamel Satghumti Junction',
            instruction: 'Head south along Chhetrapati–Thahiti road toward Thahiti Stupa.',
            note: 'Morning commuters and brassware shops line the narrow lane.',
          },
          {
            step: 2,
            landmark: 'Asan Tole Six-Way Bazaar',
            instruction: 'Continue past Annapurna Ajima Temple through the bustling spice intersection.',
            note: 'Look up to spot original 19th-century carved wooden bay windows above modern storefronts.',
          },
          {
            step: 3,
            landmark: 'Indra Chowk & Akash Bhairav',
            instruction: 'Follow the textile-draped lane southwest past the silver-facade Akash Bhairav shrine.',
          },
          {
            step: 4,
            landmark: 'Makhan Tole Gate',
            instruction: 'Enter the pedestrianized brick concourse directly into Hanuman Dhoka Plaza.',
          },
        ],
      },
      {
        id: 'kds-transit',
        mode: 'Public Transit',
        origin: 'Ratna Park / Sundhara Transit Hub',
        distanceKm: 0.7,
        durationMin: 10,
        elevationGainM: 4,
        difficulty: 'Gentle',
        bestWindow: '09:00 – 17:00',
        overview:
          'Almost every Sajha Yatayat and local Valley microbus terminates at Ratna Park or Nepal Airlines (NAC), leaving a short level walk into Basantapur.',
        waypoints: [
          {
            step: 1,
            landmark: 'Ratna Park / NAC Bus Stop',
            instruction: 'Alight at New Road Gate opposite the Tudikhel parade ground.',
          },
          {
            step: 2,
            landmark: 'New Road (Juddha Sadak)',
            instruction: 'Walk west straight down New Road past the historic Bhugol Park monument.',
          },
          {
            step: 3,
            landmark: 'Basantapur Dabali',
            instruction: 'Turn left at the stone gateway directly onto the open Durbar Square plaza.',
          },
        ],
      },
      {
        id: 'kds-taxi',
        mode: 'Taxi / Cycle',
        origin: 'Tribhuvan International Airport (TIA)',
        distanceKm: 6.4,
        durationMin: 28,
        elevationGainM: 18,
        difficulty: 'Gentle',
        bestWindow: 'Early morning or mid-afternoon to bypass Putalisadak traffic',
        overview:
          'Vehicles drop passengers at the southern Basantapur perimeter or Kantipath/New Road Gate, as the central plaza is pedestrianized.',
        waypoints: [
          {
            step: 1,
            landmark: 'TIA Gate & Tilganga',
            instruction: 'Exit onto Ring Road heading north toward Gaushala, then turn west at Maitidevi.',
          },
          {
            step: 2,
            landmark: 'Putalisadak & Exhibition Road',
            instruction: 'Cross Bhadrakali Temple skirting the southern edge of Tudikhel.',
          },
          {
            step: 3,
            landmark: 'Jhochhen (Freak Street) Drop-off',
            instruction: 'Disembark at the pedestrian bollard on the southern approach to Basantapur.',
          },
        ],
      },
    ],
    timeline: [
      {
        year: 'c. 1143 CE',
        era: 'Early Medieval',
        title: 'Founding of Kasthamandap',
        detail: 'Traditional accounts record the timber rest-house built from a single sal tree, lending Kathmandu its Sanskrit name.',
      },
      {
        year: '1564 CE',
        era: 'Malla Golden Age',
        title: 'Taleju Bhawani Consecration',
        detail: 'King Mahendra Malla raises the towering three-tiered royal temple at the northern perimeter of the palace.',
      },
      {
        year: '1641–1674 CE',
        era: 'Reign of Pratap Malla',
        title: 'Hanuman Dhoka & Polyglot Stone',
        detail: 'Pratap Malla installs the Hanuman statue at the palace gate, expands courtyards, and inscribes fifteen scripts in stone.',
      },
      {
        year: '2015–2023 CE',
        era: 'Contemporary Conservation',
        title: 'Seismic Reconstruction',
        detail: 'Community artisans and archaeologists rebuild Kasthamandap, Maju Dega, and the nine-story Basantapur wing.',
      },
    ],
    architecturalFeatures: [
      {
        name: 'Tundal Roof Struts',
        material: 'Seasoned Sal Timber',
        detail: 'Angled at 45 degrees beneath wide overhanging eaves, transferring roof weight to brick wall plates while displaying carved deities.',
      },
      {
        name: 'Dachi Appa Veneer Brick',
        material: 'Kiln-fired Terracotta & Oil Polish',
        detail: 'Trapezoidal bricks laid with paper-thin mortar joints externally and broad lime-mud bonding internally.',
      },
      {
        name: 'Torana Tympanum',
        material: 'Repoussé Gilded Copper & Wood',
        detail: 'Semicircular archways crowning shrine doors depicting Chepu, the mythical protector gripping nagas.',
      },
      {
        name: 'Timber Seismic Ring Beams',
        material: 'Interlocked Pegged Joinery',
        detail: 'Double wooden wall plates tied with wooden pegs allow masonry walls to flex without brittle shear failure.',
      },
    ],
    audioChapters: [
      {
        id: 'kds-ch-1',
        number: '01',
        title: 'The Seat of Three Kingdoms',
        durationSec: 65,
        narratorRole: 'Architectural Historian',
        ambientProfile: 'temple-bells',
        script: [
          'Stand at the center of Kathmandu Durbar Square and you stand inside a living palimpsest of nearly a thousand years of urban craft.',
          'Before Nepal’s unification in 1769, the Kathmandu Valley was divided among three rival Malla city-states—Kathmandu, Patan, and Bhaktapur—who competed not through fortress walls, but through the splendor of their royal plazas.',
          'Look north toward the high stepped plinth of Taleju Bhawani. Built in 1564, its silhouette anchored the sacred geometry of the city, reminding monarchs and citizens alike that royal authority was accountable to cosmic order.',
        ],
      },
      {
        id: 'kds-ch-2',
        number: '02',
        title: 'Earthquake Joinery & Sal Wood',
        durationSec: 58,
        narratorRole: 'Master Conservator',
        ambientProfile: 'singing-bowl',
        script: [
          'Every Newari pagoda here is engineered like a resilient timber cradle wrapped in glazed terracotta brick.',
          'Notice how each tiered roof narrows upward toward a gilded bronze pinnacle. Beneath those deep overhangs, angled sal-wood struts carry the load while shedding torrential summer monsoon rains far clear of the earthen mortar walls.',
          'When conservators rebuilt Kasthamandap after 2015, they returned to traditional wedged mortise-and-tenon joints—proving that flexible timber joinery outperforms rigid concrete during Himalayan tremors.',
        ],
      },
      {
        id: 'kds-ch-3',
        number: '03',
        title: 'Indra Jatra & The Living Kumari',
        durationSec: 62,
        narratorRole: 'Cultural Chronicler',
        ambientProfile: 'temple-bells',
        script: [
          'At the southern edge of the plaza sits Kumari Ghar, home to Kathmandu’s Living Goddess, selected from the Newar Buddhist Shakya clan.',
          'Each September during Indra Jatra, wooden chariots are hand-pulled across these very cobblestones amid masked Lakhey dancers and resonant bronze cymbals.',
          'Even on quiet weekday mornings, incense drifts from Hanuman’s vermilion-dusted pedestal as neighbors pause on their way to Asan market, keeping the square an active civic sanctuary rather than a cordoned ruin.',
        ],
      },
    ],
    visitorNotes: {
      dressCode: 'Modest attire; remove leather shoes before stepping onto inner temple plinths.',
      etiquette: 'Walk clockwise around central shrines; never climb carved wooden struts or stone guardians.',
      photography: 'Permitted across outer courtyards; prohibited inside Taleju sanctuary and of the Kumari directly.',
      majorFestival: 'Indra Jatra (September) — Chariot procession, Swet Bhairav unveiling, and masked dances.',
    },
  },
  {
    id: 'swayambhunath',
    slug: 'swayambhunath',
    name: 'Swayambhunath Stupa',
    nativeName: 'स्वयम्भूनाथ महाचैत्य',
    district: 'Western Ridge · Kathmandu',
    category: 'Buddhist Stupa',
    era: 'Licchavi Foundation (5th Century CE)',
    foundedYear: 'c. 460 CE (King Manadeva)',
    elevationMeters: 1425,
    coordinates: {
      lat: 27.7149,
      lng: 85.2903,
      label: '27.7149° N, 85.2903° E',
    },
    mapPos: { x: 235, y: 278 },
    unescoRef: 'UNESCO WHL 121bis · Zone II',
    visitingHours: 'Open 24 Hours (Ticket Desk 06:00 – 19:00)',
    entryFees: {
      foreign: 'NPR 200',
      saarc: 'NPR 50',
      nepali: 'Free',
    },
    panoramaImage: swayambhunathImg,
    summary:
      'Crowning a forested hillock 75 meters above the valley floor, Nepal’s most ancient Mahachaitya gazes across Kathmandu with painted Wisdom Eyes beneath radiating lines of prayer flags.',
    quote: {
      text: 'According to the Swayambhu Purana, when the valley was a primordial lake, a miraculous lotus bloomed from this very crest.',
      attribution: 'Swayambhu Purana Tradition',
    },
    historicalEssay: [
      'Rising west of the Bishnumati River, Swayambhunath is the mythic seed of Kathmandu’s urban civilization. Local chronicles tell of the Bodhisattva Manjushri cutting the southern Chobar gorge with a flaming sword to drain Lake Nagadaha, leaving the radiant lotus root perched atop Gopuchha Hill.',
      'Historically, stone inscriptions confirm royal patronage by the Licchavi King Vrsadeva and King Manadeva I in the fifth century CE. Over sixteen centuries, the hilltop evolved into a syncretic mandala where Vajrayana Buddhists, Tibetan pilgrims, and Hindu devotees gather side by side—honoring both the whitewashed stupa dome and the two-tiered Harati Ajima pagoda.',
      'Ascending the 365 stone steps along the eastern forest slope rewards travelers with an unbroken 360-degree panorama of the Kathmandu basin framed by the Langtang and Ganesh Himal ranges on crisp autumn mornings.',
    ],
    viewpoints: [
      {
        id: 'sw-terrace',
        title: 'Mahachaitya North-East Terrace',
        subtitle: 'Primary stupa dome, gilded harmika eyes, and valley overlook',
        initialYaw: -18,
        initialPitch: 6,
        defaultFov: 72,
        atmosphereTint: 'dawn',
      },
      {
        id: 'sw-steps',
        title: 'Eastern Vajra & 365 Steps Crest',
        subtitle: 'Arrival at the bronze thunderbolt scepter facing Kathmandu',
        initialYaw: 28,
        initialPitch: 2,
        defaultFov: 65,
        atmosphereTint: 'golden',
      },
      {
        id: 'sw-chaitya',
        title: 'Votive Chaitya Ridge',
        subtitle: 'Ancient stone reliquaries overlooking the morning valley mist',
        initialYaw: 64,
        initialPitch: -2,
        defaultFov: 58,
        atmosphereTint: 'dawn',
      },
    ],
    hotspots: [
      {
        id: 'sw-hs-1',
        viewpointId: 'sw-terrace',
        yaw: -44,
        pitch: 24,
        title: 'Harmika & The All-Seeing Eyes',
        category: 'Sacred Symbolism',
        period: 'Gilded Repoussé Copper',
        description:
          'Painted on all four cardinal faces of the square harmika, the serene eyes represent Wisdom (Method) and Compassion, united by the Nepali numeral one (एक) as the nose symbolizing unity.',
        architecturalNote: 'Thirteen stepped golden rings above represent the stages toward complete awakening.',
        audioChapterIndex: 0,
      },
      {
        id: 'sw-hs-2',
        viewpointId: 'sw-terrace',
        yaw: -52,
        pitch: -4,
        title: 'Whitewashed Garbha Dome & Pancha Buddha Niches',
        category: 'Stupa Anatomy',
        period: '5th–17th Century Renovations',
        description:
          'The hemispherical earth-and-brick mound embodies the womb of creation, ringed by gilded shrines housing the Five Dhyani Buddhas.',
        architecturalNote: 'Limewash infused with saffron pigment is reapplied by hand prior to Buddha Jayanti.',
        audioChapterIndex: 1,
      },
      {
        id: 'sw-hs-3',
        viewpointId: 'sw-terrace',
        yaw: 12,
        pitch: 6,
        title: 'Harati Ajima Pagoda & Valley Vista',
        category: 'Syncretic Shrine',
        period: '18th Century Rebuild',
        description:
          'Just beside the great stupa stands a Newari pagoda dedicated to Harati Devi, protector of children and healing, shared intimately by Hindu and Buddhist families.',
        architecturalNote: 'Two-tiered brass-clad roof balanced by carved guardian lions.',
        audioChapterIndex: 2,
      },
      {
        id: 'sw-hs-4',
        viewpointId: 'sw-chaitya',
        yaw: 56,
        pitch: -10,
        title: 'Licchavi Votive Stone Chaityas',
        category: 'Epigraphy & Stonework',
        period: '6th–10th Century CE',
        description:
          'Clusters of carved monolithic stupas offered by devotees over a millennium line the southern terrace edge overlooking Kathmandu.',
        architecturalNote: 'Carved from fine-grained Kathmandu Valley sandstone with four cardinal relief niches.',
        audioChapterIndex: 1,
      },
    ],
    routes: [
      {
        id: 'sw-walk-thamel',
        mode: 'Walking Trail',
        origin: 'Thamel via Dallu Bridge & Bishnumati River',
        distanceKm: 2.6,
        durationMin: 38,
        elevationGainM: 82,
        difficulty: 'Moderate',
        bestWindow: '05:30 – 07:30 for dawn mist & butter-lamp lighting',
        overview:
          'A rewarding urban-to-hilltop ascent crossing the Bishnumati footbridge into old Dallu neighborhood before climbing the 365 stone steps.',
        waypoints: [
          {
            step: 1,
            landmark: 'Thamel West / Sorhakhutte',
            instruction: 'Descend southwest through Chhetrapati toward the Bishnumati River corridor.',
          },
          {
            step: 2,
            landmark: 'Dallu Suspension & Footbridge',
            instruction: 'Cross the Bishnumati and follow Bijeshwori–Swayambhu Marg up past local tea stalls.',
          },
          {
            step: 3,
            landmark: 'Eastern Foot & Stone Gateway',
            instruction: 'Begin the shaded 365-step ascent beneath towering pines and carved Mani stones.',
            note: 'Watch your step around resident rhesus macaques; keep snacks tucked inside your pack.',
          },
          {
            step: 4,
            landmark: 'Dharmadhatu Mandala Crest',
            instruction: 'Emerge behind the giant gilded Vajra directly onto the main stupa kora.',
          },
        ],
      },
      {
        id: 'sw-transit',
        mode: 'Public Transit',
        origin: 'Ring Road (Sitapaila / Swayambhu Chowk)',
        distanceKm: 0.9,
        durationMin: 15,
        elevationGainM: 68,
        difficulty: 'Moderate',
        bestWindow: '07:00 – 17:30',
        overview:
          'Blue-and-white Ring Road buses stop right at Swayambhu Bus Park on the western highway; a gentler paved vehicle road leads up to the Western Gate.',
        waypoints: [
          {
            step: 1,
            landmark: 'Swayambhu Ring Road Stop',
            instruction: 'Alight beside the Natural History Museum gate on the western Ring Road.',
          },
          {
            step: 2,
            landmark: 'Bhagwan Pau Western Approach',
            instruction: 'Follow the winding paved slope uphill past the Peaceful Buddha Pond (World Peace Pond).',
          },
          {
            step: 3,
            landmark: 'Western Stairway (45 steps)',
            instruction: 'Climb the short stone staircase beside Tibetan prayer wheels to enter the stupa plaza.',
          },
        ],
      },
      {
        id: 'sw-taxi',
        mode: 'Taxi / Cycle',
        origin: 'Kathmandu Durbar Square or Thamel',
        distanceKm: 3.4,
        durationMin: 16,
        elevationGainM: 75,
        difficulty: 'Gentle',
        bestWindow: 'Anytime; effortless western hilltop drop-off',
        overview:
          'For visitors preferring to skip the steep 365 eastern steps, taxis drive directly up the back ridge to the Western Entrance parking plateau.',
        waypoints: [
          {
            step: 1,
            landmark: 'Teku / Kalimati Bridge',
            instruction: 'Cross southwest toward Chhauni National Museum road.',
          },
          {
            step: 2,
            landmark: 'Kimdol Ridge Ascent',
            instruction: 'Turn north up the forested switchback to Bhagwan Pau parking.',
          },
          {
            step: 3,
            landmark: 'Western Prayer-Wheel Gate',
            instruction: 'Only 45 gentle stone steps separate the drop-off bay from the stupa dome.',
          },
        ],
      },
    ],
    timeline: [
      {
        year: 'c. 460 CE',
        era: 'Licchavi Era',
        title: 'Earliest Dated Stupa Record',
        detail: 'Inscriptions attributed to King Manadeva I document the patronage and maintenance of the hilltop chaitya.',
      },
      {
        year: '1349 CE',
        era: 'Late Medieval',
        title: 'Rebuilding After Shamsuddin Raid',
        detail: 'Damaged during the 14th-century Bengal incursion, the dome was painstakingly restored by Newar Vajracharya masters.',
      },
      {
        year: '1650s CE',
        era: 'Malla Period',
        title: 'Pratap Malla’s Eastern Stairway & Vajra',
        detail: 'King Pratap Malla commissioned the 365-step stairway, Pratappur and Anantapur shikharas, and the monumental bronze Vajra.',
      },
      {
        year: '2010–2018 CE',
        era: 'Modern Gilding & Conservation',
        title: '20kg Gold Leaf Restoration',
        detail: 'The Tibetan Nyingma and Newar communities collaborated to regild the spire and stabilize surrounding shrines post-2015.',
      },
    ],
    architecturalFeatures: [
      {
        name: 'Pancha Buddha Shrines',
        material: 'Gilded Brass & Terracotta',
        detail: 'Five directional alcoves around the white dome representing Vairochana, Akshobhya, Ratnasambhava, Amitabha, and Amoghasiddhi.',
      },
      {
        name: 'Dharmadhatu Vajra Mandala',
        material: 'Repoussé Gilt Bronze',
        detail: 'Enormous ritual thunderbolt resting on a twelve-animal zodiac drum at the top of the eastern steps.',
      },
      {
        name: '13-Step Bodhisattva Spire',
        material: 'Gold-Plated Copper Rings',
        detail: 'Rising above the Wisdom Eyes to culminate in a parasol canopy symbolizing protection from delusion.',
      },
      {
        name: 'Lungta Prayer Flag Canopy',
        material: 'Five-Color Block-Printed Cotton',
        detail: 'Radiates from the pinnacle in blue, white, red, green, and yellow—balancing the five classical elements.',
      },
    ],
    audioChapters: [
      {
        id: 'sw-ch-1',
        number: '01',
        title: 'The Lotus of Lake Nagadaha',
        durationSec: 60,
        narratorRole: 'Valley Chronicler',
        ambientProfile: 'river-wind',
        script: [
          'As dawn light breaks over the eastern mountain rim, imagine this entire basin beneath you filled with emerald glacial water.',
          'The ancient Swayambhu Purana recounts that a luminous thousand-petalled lotus rose spontaneously from the lake—Swayambhu, the Self-Arisen.',
          'To make the sanctuary accessible, the Bodhisattva Manjushri cleaved the southern hills at Chobar, draining the waters to reveal the fertile Kathmandu Valley while the sacred lotus crystallized into this hilltop stupa.',
        ],
      },
      {
        id: 'sw-ch-2',
        number: '02',
        title: 'Reading the Stupa as a Mandala',
        durationSec: 64,
        narratorRole: 'Buddhist Art Scholar',
        ambientProfile: 'singing-bowl',
        script: [
          'A stupa is never merely a monument; it is a three-dimensional map of the awakened mind and the five cosmic elements.',
          'The square stone terrace anchors Earth. The rounded white dome embodies Water. Above it, the square golden harmika radiates Fire, the thirteen-tiered spire rises through Air, and the crowning umbrella dissolves into Space.',
          'Always walk clockwise around the dome, keeping the stupa to your right shoulder while spinning the brass prayer wheels set along its base.',
        ],
      },
      {
        id: 'sw-ch-3',
        number: '03',
        title: 'Syncretism on the Ridge',
        durationSec: 52,
        narratorRole: 'Ethnographer',
        ambientProfile: 'temple-bells',
        script: [
          'Few places on earth weave Hindu and Buddhist devotion as effortlessly as Swayambhunath.',
          'Listen closely: Tibetan monks chant beside spinning prayer wheels while Newar families offer marigold garlands and red vermilion at the adjacent pagoda of Harati Devi, guardian of children.',
          'Across the stone terrace, the scent of juniper smoke blends with butter lamps—an unbroken morning ritual that has greeted the valley’s sunrise for more than fifteen centuries.',
        ],
      },
    ],
    visitorNotes: {
      dressCode: 'Comfortable walking shoes for the 365 steps; modest layers against hilltop breeze.',
      etiquette: 'Circumambulate clockwise only; spin prayer wheels gently in a clockwise direction.',
      photography: 'Panoramic terraces welcome photography; refrain from flash inside dark monastic shrines.',
      majorFestival: 'Buddha Jayanti (May) & Gunla Month (August) — Sacred horn processions and saffron painting.',
    },
  },
  {
    id: 'boudhanath',
    slug: 'boudhanath',
    name: 'Boudhanath Stupa',
    nativeName: 'बौद्धनाथ महाचैत्य',
    district: 'Northeast Kathmandu · Boudha',
    category: 'Buddhist Stupa',
    era: 'Licchavi & Early Malla Periods',
    foundedYear: 'c. 5th–14th Century CE',
    elevationMeters: 1345,
    coordinates: {
      lat: 27.7215,
      lng: 85.362,
      label: '27.7215° N, 85.3620° E',
    },
    mapPos: { x: 705, y: 245 },
    unescoRef: 'UNESCO WHL 121bis · Zone III',
    visitingHours: 'Daily 05:00 – 21:00 (Kora remains lively into evening)',
    entryFees: {
      foreign: 'NPR 400',
      saarc: 'NPR 100',
      nepali: 'Free',
    },
    panoramaImage: boudhanathImg,
    summary:
      'One of the largest spherical mandala stupas on earth, encircled by a rhythmic pedestrian kora, over fifty Tibetan Buddhist monasteries, and hundreds of brass prayer wheels.',
    quote: {
      text: 'At dusk, when butter lamps flare along the three terraced plinths, Boudhanath turns the entire plaza into a revolving wheel of light.',
      attribution: 'Himalayan Monastic Survey',
    },
    historicalEssay: [
      'Positioned along the historic trans-Himalayan trade highway linking Kathmandu to Lhasa via Sankhu and Kuti, Boudhanath—known in Tibetan as Jarung Khashor—has anchored Himalayan caravan routes for centuries. Merchants paused beneath its 36-meter dome to pray for safe passage across high mountain passes before ascending toward Tibet.',
      'Architecturally, the stupa is a colossal three-dimensional mandala. Three ascending whitewashed terraces form the lotus-shaped plinth, supporting an immense hemisphere brushed with scalloped saffron-water petals. Above the dome rises a gilded harmika bearing the compassionate Buddha Eyes, crowned by a thirteen-step pyramid and golden umbrella.',
      'Since the mid-twentieth century, Boudha has blossomed into the spiritual center of Tibetan Buddhism in Nepal. Encircling the curved brick plaza stand monasteries representing all four major Tibetan lineages—Nyingma, Kagyu, Sakya, and Gelug—alongside traditional thangka ateliers and rooftop tea houses.',
    ],
    viewpoints: [
      {
        id: 'bd-kora',
        title: 'Southern Kora Promenade',
        subtitle: 'Full spherical mandala view across the circumambulation path',
        initialYaw: 0,
        initialPitch: 6,
        defaultFov: 74,
        atmosphereTint: 'golden',
      },
      {
        id: 'bd-terrace',
        title: 'Upper Mandala Plinth',
        subtitle: 'Close inspection of the dome curves and radiating prayer flags',
        initialYaw: -22,
        initialPitch: 12,
        defaultFov: 60,
        atmosphereTint: 'dawn',
      },
      {
        id: 'bd-monastery',
        title: 'Eastern Monastic Facade',
        subtitle: 'Curved brick gompa balconies and prayer-wheel perimeter',
        initialYaw: 52,
        initialPitch: 3,
        defaultFov: 66,
        atmosphereTint: 'courtyard',
      },
    ],
    hotspots: [
      {
        id: 'bd-hs-1',
        viewpointId: 'bd-kora',
        yaw: -14,
        pitch: 24,
        title: 'Gilded Spire & Harmika Eyes',
        category: 'Mandala Crown',
        period: 'Rebuilt 2016 CE',
        description:
          'Following the 2015 earthquake, the upper spire was completely dismantled and reconstructed using traditional hammered copper, mercury-gilded gold, and sacred inner relics.',
        architecturalNote: 'Thirteen stepped tiers denote the thirteen Bodhisattva grounds.',
        audioChapterIndex: 1,
      },
      {
        id: 'bd-hs-2',
        viewpointId: 'bd-kora',
        yaw: -12,
        pitch: 6,
        title: 'Saffron-Scalloped Mandala Plinths',
        category: 'Sacred Geometry',
        period: '14th Century Form',
        description:
          'Stepped rectangular terraces with recessed corners mimic a cosmic mandala when viewed from directly overhead, allowing pilgrims to ascend to the base of the dome.',
        architecturalNote: 'Saffron water arcs are splashed downward across the white limewash during festivals.',
        audioChapterIndex: 0,
      },
      {
        id: 'bd-hs-3',
        viewpointId: 'bd-kora',
        yaw: -16,
        pitch: -7,
        title: '108 Dhyani Niches & Prayer-Wheel Wall',
        category: 'Devotional Craft',
        period: 'Continuous Living Tradition',
        description:
          'Ringing the outer perimeter wall, recessed panels house sculpted deities and copper prayer cylinders filled with tightly wound scrolls of the mantra Om Mani Padme Hum.',
        architecturalNote: '108 represents the auspicious number of sacred volumes and rosary beads.',
        audioChapterIndex: 2,
      },
      {
        id: 'bd-hs-4',
        viewpointId: 'bd-monastery',
        yaw: 58,
        pitch: 4,
        title: 'Guru Lhakhang & Surrounding Gompas',
        category: 'Monastic Quarter',
        period: '19th–21st Century',
        description:
          'More than fifty Tibetan monasteries surround the square, hosting morning drum chants, thangka painting workshops, and butter-sculpture ceremonies.',
        architecturalNote: 'Curved three-story brick arcades frame the circular urban amphitheater.',
        audioChapterIndex: 2,
      },
    ],
    routes: [
      {
        id: 'bd-walk-pashupati',
        mode: 'Walking Trail',
        origin: 'Pashupatinath East Gate via Chabahil & Guhyeshwari',
        distanceKm: 3.1,
        durationMin: 42,
        elevationGainM: 22,
        difficulty: 'Gentle',
        bestWindow: '06:00 – 09:00 or 16:00 – 18:30',
        overview:
          'A sacred inter-site pilgrimage connecting Kathmandu’s greatest Hindu river sanctuary with its grandest Buddhist stupa through historic Chabahil.',
        waypoints: [
          {
            step: 1,
            landmark: 'Guhyeshwari Forest Footbridge',
            instruction: 'Exit Pashupatinath’s northern deer-park path past Guhyeshwari Shrine.',
          },
          {
            step: 2,
            landmark: 'Chabahil Charumati Stupa',
            instruction: 'Cross the Ring Road pedestrian bridge to visit the 3rd-century BCE Charumati Stupa.',
            note: 'Often overlooked by travelers, Charumati is one of the oldest brick stupas in the valley.',
          },
          {
            step: 3,
            landmark: 'Boudha Pipalbot Boulevard',
            instruction: 'Follow the wide sidewalk east along Boudha Road past monastic banner gates.',
          },
          {
            step: 4,
            landmark: 'Main South Archway',
            instruction: 'Step beneath the ornamental gateway straight onto the circular kora.',
          },
        ],
      },
      {
        id: 'bd-transit',
        mode: 'Public Transit',
        origin: 'Ratna Park to Boudha Gate (Bus / Tempo)',
        distanceKm: 6.8,
        durationMin: 30,
        elevationGainM: 12,
        difficulty: 'Gentle',
        bestWindow: '07:00 – 19:00',
        overview:
          'Frequent city buses and green electric Sajha/microbus lines run directly along Kamalpokhari–Gyaneshwor–Chabahil straight to Boudha Main Gate.',
        waypoints: [
          {
            step: 1,
            landmark: 'Ratna Park East Stand',
            instruction: 'Board any bus signed "Boudha / Jorpati" heading northeast.',
          },
          {
            step: 2,
            landmark: 'Chabahil Chowk',
            instruction: 'Remain aboard as the route turns east onto Boudha–Jorpati Road.',
          },
          {
            step: 3,
            landmark: 'Boudha Stupa Main Gate',
            instruction: 'Alight directly opposite the ornate arched entrance to the plaza.',
          },
        ],
      },
      {
        id: 'bd-taxi',
        mode: 'Taxi / Cycle',
        origin: 'Tribhuvan International Airport (TIA)',
        distanceKm: 4.5,
        durationMin: 18,
        elevationGainM: 10,
        difficulty: 'Gentle',
        bestWindow: 'Morning or evening kora hours',
        overview:
          'Boudhanath sits closer to the international airport than Thamel, making it an effortless first or final stop via Ring Road and Chabahil.',
        waypoints: [
          {
            step: 1,
            landmark: 'Airport Ring Road North',
            instruction: 'Turn north past Gaushala and Mitrapark along the eastern Ring Road.',
          },
          {
            step: 2,
            landmark: 'Chabahil Junction Right Turn',
            instruction: 'Head east for 1.8 km along Boudha Marg.',
          },
          {
            step: 3,
            landmark: 'Tushal / Boudha Pedestrian Perimeter',
            instruction: 'Disembark outside the vehicle-free brick inner ring.',
          },
        ],
      },
    ],
    timeline: [
      {
        year: 'c. 6th Century CE',
        era: 'Licchavi Period',
        title: 'Foundations on the Trade Road',
        detail: 'Chronicles link early stupa construction to Licchavi King Shivadeva along the northern caravan corridor.',
      },
      {
        year: '14th Century CE',
        era: 'Early Malla Era',
        title: 'Monumental Mandala Expansion',
        detail: 'Expanded to its current 36-meter height, establishing the three stepped terraces and 108 perimeter niches.',
      },
      {
        year: '1959–1980s CE',
        era: 'Monastic Renaissance',
        title: 'Tibetan Monastic Flourishing',
        detail: 'Tibetan lamas and artisans establish dozens of active monasteries, turning Boudha into a global Himalayan study hub.',
      },
      {
        year: '2016 CE',
        era: 'Post-Earthquake Rebirth',
        title: 'Community Spire Reconstruction',
        detail: 'First UNESCO monument in Kathmandu to complete full community-funded spire reconstruction within 18 months.',
      },
    ],
    architecturalFeatures: [
      {
        name: 'Three-Tier Lotus Plinth',
        material: 'Lime-Plastered Brick Masonry',
        detail: 'Twenty-sided mandala geometry visible from above, designed for ritual circumambulation on multiple elevation levels.',
      },
      {
        name: 'Kora Brass Prayer Wheels',
        material: 'Hand-Beaten Copper & Brass',
        detail: 'Mounted along the circular boundary wall, each cylinder revolves on iron spindles packed with printed mantras.',
      },
      {
        name: 'Torma & Butter-Lamp Terraces',
        material: 'Stone Ledges & Brass Oil Dishes',
        detail: 'Dedicated niches along the first plinth where thousands of beeswax and ghee lamps are lit at twilight.',
      },
      {
        name: 'Saffron Wash Scallops',
        material: 'Lime, Milk & Saffron Pigment',
        detail: 'Traditional crescent patterns hand-poured from the dome apex down the whitewashed curvature.',
      },
    ],
    audioChapters: [
      {
        id: 'bd-ch-1',
        number: '01',
        title: 'The Caravan Beacon of Jarung Khashor',
        durationSec: 58,
        narratorRole: 'Himalayan Historian',
        ambientProfile: 'river-wind',
        script: [
          'Long before asphalt highways crossed the Himalayas, salt, wool, and silk caravans departed Kathmandu’s northeast edge toward Tibet.',
          'At the edge of the fertile rice plains rose this colossal white dome—the last monumental landmark travelers beheld before climbing into alpine passes, and the first beacon welcoming them home.',
          'Tibetan Buddhists call it Jarung Khashor, remembering the legend of a humble poultry-keeper who vowed to raise a stupa vast enough to shelter all beings.',
        ],
      },
      {
        id: 'bd-ch-2',
        number: '02',
        title: 'The Rhythm of the Evening Kora',
        durationSec: 56,
        narratorRole: 'Soundscape Archivist',
        ambientProfile: 'singing-bowl',
        script: [
          'Arrive around five in the afternoon and the circular courtyard becomes a slow, hypnotic river of movement.',
          'Red-robed monks, elderly Sherpa pilgrims turning hand prayer wheels, and neighborhood families walk steadily clockwise in what is known as the kora.',
          'Notice how the curved brick buildings act like a giant acoustic amphitheater—amplifying low monastery horns, gentle footsteps, and the metallic click of spinning brass cylinders.',
        ],
      },
      {
        id: 'bd-ch-3',
        number: '03',
        title: 'Rebuilding the Golden Spire',
        durationSec: 54,
        narratorRole: 'Restoration Chronicler',
        ambientProfile: 'temple-bells',
        script: [
          'When the 2015 earthquake fractured the stupa’s harmika and spire, the local Boudha community refused to wait for slow bureaucracy.',
          'Monks, Newar coppersmiths, and volunteers dismantled the summit brick by brick, safeguarding sacred inner texts before re-gilding the thirteen steps with over thirty kilograms of pure gold.',
          'In November 2016, Boudhanath became the first major Kathmandu heritage monument to reopen completely—a triumph of living stewardship.',
        ],
      },
    ],
    visitorNotes: {
      dressCode: 'Respectful casual attire; remove shoes when climbing onto the upper stupa plinths.',
      etiquette: 'Walk strictly clockwise around the dome; never step over seated pilgrims’ offerings.',
      photography: 'Excellent rooftop vantage points around the square; ask permission before photographing monks up close.',
      majorFestival: 'Lhosar (Tibetan New Year, Feb/Mar) — Tsampa blessings, butter lamps, and fresh prayer flags.',
    },
  },
  {
    id: 'pashupatinath',
    slug: 'pashupatinath',
    name: 'Pashupatinath Temple',
    nativeName: 'पशुपतिनाथ मन्दिर क्षेत्र',
    district: 'Eastern Kathmandu · Bagmati River',
    category: 'Hindu Sanctuary',
    era: 'Licchavi Origins · 17th C. Pagoda',
    foundedYear: 'c. 400 CE (Current Shrine 1692 CE)',
    elevationMeters: 1335,
    coordinates: {
      lat: 27.7104,
      lng: 85.3487,
      label: '27.7104° N, 85.3487° E',
    },
    mapPos: { x: 645, y: 312 },
    unescoRef: 'UNESCO WHL 121bis · Zone IV',
    visitingHours: 'Outer Ghats 04:00 – 21:00 (Evening Aarati ~18:00)',
    entryFees: {
      foreign: 'NPR 1,000',
      saarc: 'NPR 1,000',
      nepali: 'Free',
    },
    panoramaImage: pashupatinathImg,
    summary:
      'Nepal’s holiest Shiva sanctuary stretching across the sacred Bagmati River ghats, uniting a two-tiered golden pagoda with stone shikhara clusters and evening fire rituals.',
    quote: {
      text: 'Along the Bagmati ghats, stone steps carry both the dawn prayers of bathing pilgrims and the quiet dignity of final passage.',
      attribution: 'Bagmati Sacred Landscape Monograph',
    },
    historicalEssay: [
      'Spread across 246 hectares on both banks of the Bagmati River, Pashupatinath is one of South Asia’s supreme Shaivite pilgrimage complexes. Dedicated to Shiva as Pashupati—Lord of All Beings—the sanctuary holds inscriptions stretching back to the fifth-century Licchavi dynasty, though local tradition places its origins even earlier.',
      'While access to the innermost gilded pagoda courtyard is reserved exclusively for practicing Hindus, the vast eastern hillside, stone river bridges, and terraced eastern viewing ghats offer visitors an extraordinary architectural panorama. Across the water rise the twin gilded copper roofs of the main temple, flanked by the Panch Deval almshouse, Ram Mandir, and dozens of carved votive shikhara shrines.',
      'From the stone steps of the eastern bank, one witnesses the complete cycle of life and devotion: morning ablutions in river mist, sadhus resting inside stone shelters, and the resonant Bagmati Sandhya Aarati ceremony each twilight with brass oil lamps and Vedic chants.',
    ],
    viewpoints: [
      {
        id: 'ps-ghats',
        title: 'Eastern Bank Overlook (Pandra Shivalaya)',
        subtitle: 'Panoramic view across the Bagmati River toward the golden pagoda',
        initialYaw: 0,
        initialPitch: 4,
        defaultFov: 70,
        atmosphereTint: 'dawn',
      },
      {
        id: 'ps-bridge',
        title: 'Arya Ghat River Axis',
        subtitle: 'Looking along the stepped stone ghats and shikhara row',
        initialYaw: -38,
        initialPitch: 0,
        defaultFov: 64,
        atmosphereTint: 'golden',
      },
      {
        id: 'ps-kailash',
        title: 'Vishwarupa & Forested Ridge',
        subtitle: 'Elevated terraces above the eastern stone shrines',
        initialYaw: 44,
        initialPitch: 8,
        defaultFov: 58,
        atmosphereTint: 'courtyard',
      },
    ],
    hotspots: [
      {
        id: 'ps-hs-1',
        viewpointId: 'ps-ghats',
        yaw: 32,
        pitch: 14,
        title: 'Main Gilded Pagoda of Pashupatinath',
        category: 'Sacred Pagoda',
        period: '1692 CE · King Bhupalendra Malla',
        description:
          'Crowned with twin cubic copper roofs clad in pure gold leaf, the inner sanctum enshrines a four-faced black stone Shiva Linga dating to the Malla era.',
        architecturalNote: 'Four silver-plated doorways face the cardinal compass points.',
        audioChapterIndex: 0,
      },
      {
        id: 'ps-hs-2',
        viewpointId: 'ps-ghats',
        yaw: 8,
        pitch: -8,
        title: 'Arya Ghat & Bagmati River Steps',
        category: 'Sacred Riverbank',
        period: 'Medieval Stonework',
        description:
          'Sacred stepped stone embankments along the Bagmati where ritual ablutions and open-air cremation ceremonies honor the cycle of rebirth.',
        architecturalNote: 'Interlocked grey limestone slabs designed to withstand seasonal monsoon surges.',
        audioChapterIndex: 1,
      },
      {
        id: 'ps-hs-3',
        viewpointId: 'ps-ghats',
        yaw: -28,
        pitch: 2,
        title: 'Pandra Shivalaya (15 Stone Shrines)',
        category: 'Votive Shikhara Row',
        period: '19th Century CE',
        description:
          'A rhythmic colonnade of stone dome shrines lined along the eastern terrace, offering serene vantage points above the evening Aarati.',
        architecturalNote: 'Carved stone lingams housed inside domed brick-and-stucco pavilions.',
        audioChapterIndex: 2,
      },
      {
        id: 'ps-hs-4',
        viewpointId: 'ps-bridge',
        yaw: -42,
        pitch: 8,
        title: 'Mrigasthali Deer Park & Gorakhnath Ridge',
        category: 'Sacred Grove',
        period: 'Ancient Forest Sanctuary',
        description:
          'Shaded woodland paths ascending behind the eastern shrines lead to the hilltop Gorakhnath temple and Guhyeshwari Shakti Peeth.',
        architecturalNote: 'Stone stairways weave through protected riverine oak and sal forest.',
        audioChapterIndex: 2,
      },
    ],
    routes: [
      {
        id: 'ps-walk-boudha',
        mode: 'Walking Trail',
        origin: 'Boudhanath Stupa via Guhyeshwari Forest',
        distanceKm: 3.1,
        durationMin: 40,
        elevationGainM: 28,
        difficulty: 'Gentle',
        bestWindow: '05:30 – 08:30 or 16:30 – 18:30 (for Evening Aarati)',
        overview:
          'Walk south from Boudhanath through Chabahil and into the tranquil northern deer forest of Pashupatinath, arriving above the Bagmati River terraces.',
        waypoints: [
          {
            step: 1,
            landmark: 'Boudhanath South Gate',
            instruction: 'Walk west along Boudha Marg to Chabahil Chowk.',
          },
          {
            step: 2,
            landmark: 'Mitrapark & Guhyeshwari Turn',
            instruction: 'Cross Ring Road safely via the overhead bridge and head south toward Guhyeshwari Temple.',
          },
          {
            step: 3,
            landmark: 'Mrigasthali Forest Trail',
            instruction: 'Climb the stone woodland steps past Kirateshwar Mahadev.',
          },
          {
            step: 4,
            landmark: 'Eastern Ghat Terrace',
            instruction: 'Descend to the 15 Shivalayas directly opposite the main golden pagoda.',
          },
        ],
      },
      {
        id: 'ps-transit',
        mode: 'Public Transit',
        origin: 'Gaushala Chowk (Ring Road)',
        distanceKm: 0.6,
        durationMin: 8,
        elevationGainM: 5,
        difficulty: 'Gentle',
        bestWindow: 'All day; major Ring Road transit hub',
        overview:
          'Gaushala sits directly on Kathmandu’s Ring Road, served continuously by Sajha Yatayat and Valley loop buses.',
        waypoints: [
          {
            step: 1,
            landmark: 'Gaushala Bus Stop',
            instruction: 'Alight beside the brick archway marked "Pashupati Area Development Trust".',
          },
          {
            step: 2,
            landmark: 'Pingalasthan Bazaar Lane',
            instruction: 'Walk east down the pedestrian approach lined with marigold and incense stalls.',
          },
          {
            step: 3,
            landmark: 'Bagmati Footbridge',
            instruction: 'Cross to the eastern riverbank stairs for full panoramic views of the temple and ghats.',
          },
        ],
      },
      {
        id: 'ps-taxi',
        mode: 'Taxi / Cycle',
        origin: 'Tribhuvan International Airport (TIA) or Thamel',
        distanceKm: 2.2,
        durationMin: 10,
        elevationGainM: 6,
        difficulty: 'Gentle',
        bestWindow: '17:15 arrival for 18:00 Sandhya Aarati',
        overview:
          'Just two kilometers northwest of Kathmandu’s airport terminal, Pashupatinath is the fastest heritage reach from Tilganga.',
        waypoints: [
          {
            step: 1,
            landmark: 'TIA Gate / Tilganga Eye Hospital',
            instruction: 'Head north on Ring Road for 1.5 km to Pingalasthan or Tilganga Eastern Gate.',
          },
          {
            step: 2,
            landmark: 'Tilganga Tourist Ticket Counter',
            instruction: 'Enter directly via the eastern bridge parking lot facing the Shivalayas.',
          },
        ],
      },
    ],
    timeline: [
      {
        year: 'c. 477 CE',
        era: 'Licchavi Era',
        title: 'Earliest Stone Inscriptions',
        detail: 'Licchavi epigraphy records royal endowments to Pashupati, confirming the river sanctuary’s regional primacy.',
      },
      {
        year: '1692 CE',
        era: 'Malla Architecture',
        title: 'Current Two-Tiered Golden Pagoda',
        detail: 'Following termite damage to earlier timber frames, King Bhupalendra Malla rebuilt the grand sanctuary.',
      },
      {
        year: '19th Century CE',
        era: 'Shah & Rana Patronage',
        title: 'Pandra Shivalaya & Stone Ghats',
        detail: 'Construction of the Pandra Shivalaya colonnade, Panch Deval, and expanded stone river ghats.',
      },
      {
        year: '2007–Present',
        era: 'Living Sacred Landscape',
        title: 'Revival of Sandhya Aarati',
        detail: 'Revival of the nightly Bagmati Sandhya Aarati drawing thousands of citizens and pilgrims along the ghats.',
      },
    ],
    architecturalFeatures: [
      {
        name: 'Gilded Copper Pagoda Roofs',
        material: 'Gold-Plated Copper over Sal Timber',
        detail: 'Square double-tiered roofs pitched sharply to deflect monsoon rain, topped by a towering golden gajur.',
      },
      {
        name: 'Stone Ghat Retaining Steps',
        material: 'Dressed River Limestone',
        detail: 'Continuous stepped terraces descending into the Bagmati River for ceremonial bathing and vigils.',
      },
      {
        name: 'Shikhara Votive Pavilions',
        material: 'Carved Brick & Lime Stucco',
        detail: 'Dozens of miniature domed shrines donated in memory of ancestors along the eastern bank.',
      },
      {
        name: 'Panch Deval Courtyard',
        material: 'Brick & Carved Wood',
        detail: 'Five-temple complex crowning the southeastern terrace, historically serving as a monastic hospice.',
      },
    ],
    audioChapters: [
      {
        id: 'ps-ch-1',
        number: '01',
        title: 'Lord of All Beings on the Bagmati',
        durationSec: 60,
        narratorRole: 'Sacred Geography Scholar',
        ambientProfile: 'river-wind',
        script: [
          'As the Bagmati River curves southward through a forested gorge, it forms one of the most revered sacred landscapes in the Hindu world.',
          'Here Shiva is worshiped as Pashupati—not as a distant ascetic, but as the compassionate guardian of every living creature, from forest deer to human pilgrims.',
          'Look across the water at the twin golden roofs rising above the courtyard wall: though the inner sanctum admits only Hindus, the sacred energy of the complex unfolds across the entire riverside.',
        ],
      },
      {
        id: 'ps-ch-2',
        number: '02',
        title: 'Reflections at Arya Ghat',
        durationSec: 55,
        narratorRole: 'Cultural Historian',
        ambientProfile: 'singing-bowl',
        script: [
          'Along the western stone steps, woodsmoke rises steadily into the valley air. Arya Ghat is Nepal’s most sacred open-air cremation riverbank.',
          'Within Hindu philosophy, dying beside the Bagmati at Pashupati releases the soul gently from earthly attachment. Families gather calmly around sandalwood pyres without theatrical grief.',
          'Observation from the eastern terrace should always remain quiet and respectful, avoiding close-up photography of mourning families.',
        ],
      },
      {
        id: 'ps-ch-3',
        number: '03',
        title: 'Twilight Sandhya Aarati',
        durationSec: 58,
        narratorRole: 'Field Recordist',
        ambientProfile: 'temple-bells',
        script: [
          'Each evening at six, as dusk cools the valley, the eastern bank transforms.',
          'Three priests swing multi-tiered brass camphor lamps in sweeping arcs while temple bells, conch shells, and chanting echo across the Bagmati.',
          'Hundreds sit silently along the steps of the fifteen stone shrines, watching firelight shimmer over the water before walking uphill through the quiet Mrigasthali trees.',
        ],
      },
    ],
    visitorNotes: {
      dressCode: 'Conservative clothing covering shoulders and knees; remove leather items near inner gates.',
      etiquette: 'Non-Hindus cannot enter the main golden inner courtyard; observe cremation ghats quietly from across the river.',
      photography: 'Allowed from the eastern terrace; strictly avoid photographing grieving families at close range.',
      majorFestival: 'Maha Shivaratri (Feb/Mar) — Over half a million devotees, sadhus, and all-night bonfires.',
    },
  },
  {
    id: 'patan-durbar-square',
    slug: 'patan-durbar-square',
    name: 'Patan Durbar Square',
    nativeName: 'पाटन दरबार क्षेत्र (यल)',
    district: 'Lalitpur · South of Bagmati',
    category: 'Royal Plaza',
    era: 'Malla Renaissance (16th–18th C.)',
    foundedYear: 'c. 3rd C. BCE City · 1637 CE Krishna Mandir',
    elevationMeters: 1320,
    coordinates: {
      lat: 27.6727,
      lng: 85.3253,
      label: '27.6727° N, 85.3253° E',
    },
    mapPos: { x: 472, y: 472 },
    unescoRef: 'UNESCO WHL 121bis · Zone V',
    visitingHours: 'Plaza Open Daily (Patan Museum 10:00 – 17:30)',
    entryFees: {
      foreign: 'NPR 1,000',
      saarc: 'NPR 250',
      nepali: 'Free',
    },
    panoramaImage: patanDurbarImg,
    summary:
      'The artistic jewel of Lalitpur—City of Fine Arts—where the carved stone shikhara of Krishna Mandir confronts an unbroken red-brick Malla royal palace and bronze artisan workshops.',
    quote: {
      text: 'In Patan, brick, bronze, and grey sandstone achieve an urban proportion unmatched anywhere else in the Himalayan foothills.',
      attribution: 'Lalitpur Architectural Inventory',
    },
    historicalEssay: [
      'Known in Nepal Bhasa as Yala and in Sanskrit as Lalitpur—the City of Beauty—Patan is the oldest continuous urban center in the Kathmandu Valley. Tradition credits Emperor Ashoka with ringing the city with four stupas in the third century BCE, yet its Durbar Square stands as the zenith of seventeenth-century Malla patronage.',
      'Unlike Kathmandu’s sprawling maze of alleys, Patan Durbar Square feels like a meticulously curated outdoor gallery. Along its eastern length runs the unbroken red-brick facade of the Malla Royal Palace—comprising Keshav Narayan Chowk, Mul Chowk, and Sundari Chowk—crowned with gilded roofs and housing Nepal’s finest museum of Himalayan bronze casting.',
      'Facing the palace rises the extraordinary Krishna Mandir, built in 1637 by King Siddhi Narsingh Malla entirely from hand-chiselled stone rather than brick and timber. Just steps north through goldsmith lanes waits the Golden Temple (Hiranya Varna Mahavihar), an active medieval monastery shimmering in repoussé brass.',
    ],
    viewpoints: [
      {
        id: 'pt-main',
        title: 'Krishna Mandir & Palace Axis',
        subtitle: 'Central brick plaza between stone shikhara spires and Malla palace',
        initialYaw: 0,
        initialPitch: 4,
        defaultFov: 68,
        atmosphereTint: 'golden',
      },
      {
        id: 'pt-garuda',
        title: 'Garuda Pillar & Palace Windows',
        subtitle: 'Detail view toward Mul Chowk and ornate wooden bays',
        initialYaw: 34,
        initialPitch: 6,
        defaultFov: 56,
        atmosphereTint: 'courtyard',
      },
      {
        id: 'pt-manga',
        title: 'Bhimsen & Northern Shrines',
        subtitle: 'Looking northwest toward Manga Hiti and stone lion guardians',
        initialYaw: -48,
        initialPitch: 2,
        defaultFov: 64,
        atmosphereTint: 'dawn',
      },
    ],
    hotspots: [
      {
        id: 'pt-hs-1',
        viewpointId: 'pt-main',
        yaw: 0,
        pitch: 14,
        title: 'Krishna Mandir (21-Spire Stone Shikhara)',
        category: 'Stone Architecture',
        period: '1637 CE · King Siddhi Narsingh Malla',
        description:
          'Built entirely of grey stone without timber framing, its carved friezes narrate the entire Mahabharata and Ramayana epics across columned balconies.',
        architecturalNote: 'Twenty-one gilded stone pinnacles crown a North Indian shikhara form adapted by Newar masons.',
        audioChapterIndex: 0,
      },
      {
        id: 'pt-hs-2',
        viewpointId: 'pt-main',
        yaw: 24,
        pitch: 10,
        title: 'Gilded Garuda Pillar',
        category: 'Royal Sculpture',
        period: '1647 CE',
        description:
          'Mounted atop a monolithic stone column facing Krishna Mandir, the kneeling bronze eagle-man Garuda pays perpetual homage toward the sanctum.',
        architecturalNote: 'Lost-wax cast bronze (cire perdue), Patan’s signature metallurgical craft.',
        audioChapterIndex: 1,
      },
      {
        id: 'pt-hs-3',
        viewpointId: 'pt-main',
        yaw: 52,
        pitch: 6,
        title: 'Patan Royal Palace & Patan Museum',
        category: 'Palace Architecture',
        period: '1666–1734 CE',
        description:
          'Three contiguous brick quadrangles featuring the sunken royal bath of Tusha Hiti and world-renowned galleries of Nepali sacred metalwork.',
        architecturalNote: 'Austrian-Nepali adaptive conservation transformed Keshav Narayan Chowk into a benchmark museum.',
        audioChapterIndex: 2,
      },
      {
        id: 'pt-hs-4',
        viewpointId: 'pt-manga',
        yaw: -44,
        pitch: 2,
        title: 'Vishwanath & Bhimsen Stone Guardians',
        category: 'Civic Shrines',
        period: '1627–1680 CE',
        description:
          'Flanked by massive sculpted stone elephants and lions, the northern temples anchor Patan’s lively merchant crossroads and sunken water spouts.',
        architecturalNote: 'Carved stone elephants carry royal riders beside traditional dhunge dhara water conduits.',
        audioChapterIndex: 1,
      },
    ],
    routes: [
      {
        id: 'pt-walk-kupondole',
        mode: 'Walking Trail',
        origin: 'Kupondole / Bagmati Bridge via Pulchowk & Golden Temple',
        distanceKm: 2.8,
        durationMin: 36,
        elevationGainM: 18,
        difficulty: 'Gentle',
        bestWindow: '08:00 – 11:00 or 15:30 – 17:30',
        overview:
          'Approach Patan’s medieval core on foot through quiet residential bahals, brass workshops, and the shimmering Golden Temple before emerging at Durbar Square.',
        waypoints: [
          {
            step: 1,
            landmark: 'Pulchowk Harihar Bhawan',
            instruction: 'Turn east off Pulchowk Main Road onto Patan Dhoka lane.',
          },
          {
            step: 2,
            landmark: 'Patan Dhoka Gateway',
            instruction: 'Pass through the traditional brick city gate into Kwa Bahal road.',
          },
          {
            step: 3,
            landmark: 'Hiranya Varna Mahavihar (Golden Temple)',
            instruction: 'Pause inside the 12th-century courtyard clad in gilded copper repoussé.',
          },
          {
            step: 4,
            landmark: 'Manga Bazaar to Durbar Square',
            instruction: 'Walk 250 meters south past ancient Manga Hiti water spouts onto the royal plaza.',
          },
        ],
      },
      {
        id: 'pt-transit',
        mode: 'Public Transit',
        origin: 'Ratna Park to Lagankhel / Patan Dhoka',
        distanceKm: 5.1,
        durationMin: 22,
        elevationGainM: 12,
        difficulty: 'Gentle',
        bestWindow: '07:00 – 19:00',
        overview:
          'Sajha Yatayat buses and electric safas run continuously from Ratna Park across Thapathali Bridge to Lagankhel Bus Park, just a 10-minute level walk north to the square.',
        waypoints: [
          {
            step: 1,
            landmark: 'Ratna Park / Shahid Gate',
            instruction: 'Board any bus signed "Lagankhel" heading south across the Bagmati River.',
          },
          {
            step: 2,
            landmark: 'Pulchowk or Lagankhel Terminal',
            instruction: 'Alight at Lagankhel beside the massive Ashoka Stupa.',
          },
          {
            step: 3,
            landmark: 'Lagankhel–Mangal Bazaar Spine',
            instruction: 'Walk north along the lively pedestrian shopping lane straight into Durbar Square.',
          },
        ],
      },
      {
        id: 'pt-taxi',
        mode: 'Taxi / Cycle',
        origin: 'Thamel or Kathmandu Durbar Square',
        distanceKm: 5.5,
        durationMin: 24,
        elevationGainM: 15,
        difficulty: 'Gentle',
        bestWindow: 'Mid-morning or late afternoon light',
        overview:
          'Cross the Bagmati via Thapathali or Shankhamul Bridge and drop off at Patan Dhoka or Mangal Bazaar perimeter.',
        waypoints: [
          {
            step: 1,
            landmark: 'Thapathali Bridge',
            instruction: 'Cross south into Lalitpur along Kupondole Hill.',
          },
          {
            step: 2,
            landmark: 'Pulchowk to Gabahal',
            instruction: 'Follow Gabahal Road east to the Mangal Bazaar pedestrian bollard.',
          },
        ],
      },
    ],
    timeline: [
      {
        year: 'c. 250 BCE',
        era: 'Mauryan Tradition',
        title: 'Four Cardinal Ashoka Stupas',
        detail: 'Four ancient earthen stupas mark the cardinal boundaries of Lalitpur’s planned urban grid.',
      },
      {
        year: '1637 CE',
        era: 'Reign of Siddhi Narsingh Malla',
        title: 'Construction of Krishna Mandir',
        detail: 'Inspired by a dream of Krishna and Radha, the king raises Nepal’s foremost 21-spire stone shikhara temple.',
      },
      {
        year: '1647–1734 CE',
        era: 'Late Malla Dynasty',
        title: 'Sundari Chowk & Palace Quadrangles',
        detail: 'Expansion of the royal bath Tusha Hiti and ornate golden doorway of Mul Chowk.',
      },
      {
        year: '1997–2020 CE',
        era: 'Museum & Seismic Stewardship',
        title: 'Patan Museum & Post-2015 Restoration',
        detail: 'Opening of Patan Museum and meticulous post-2015 restoration of Char Narayan and Mani Mandap.',
      },
    ],
    architecturalFeatures: [
      {
        name: 'Shikhara Stone Joinery',
        material: 'Dressed Sandstone & Granite',
        detail: 'Curvilinear tower ribs carved with epic reliefs and interlocked without modern mortar.',
      },
      {
        name: 'Tusha Hiti Royal Bath',
        material: 'Carved Stone & Gilded Bronze',
        detail: 'Sunken octagonal stone basin lined with seventy-two carved deities in Sundari Chowk.',
      },
      {
        name: 'Lost-Wax Bronze Casting',
        material: 'Ashtadhatu (Eight-Metal Alloy)',
        detail: 'Patan families still cast temple finials and bodhisattvas using beeswax molds in surrounding alleys.',
      },
      {
        name: 'Carved Timber Jali Bays',
        material: 'Aged Sal Latticework',
        detail: 'Projecting palace windows allowing royal observers to view square ceremonies unseen.',
      },
    ],
    audioChapters: [
      {
        id: 'pt-ch-1',
        number: '01',
        title: 'City of Fine Arts & Bronze Craft',
        durationSec: 57,
        narratorRole: 'Art Historian',
        ambientProfile: 'temple-bells',
        script: [
          'Cross the Bagmati River into Lalitpur and the pace of Kathmandu shifts from mercantile bustle to sculptural precision.',
          'For centuries, Patan’s Shakya and Tamrakar guilds have supplied sacred bronze images, gilded temple roofs, and carved stone finials not only across Nepal, but to monasteries in Tibet and Bhutan.',
          'Listen closely in the side lanes north of the square and you can still hear the steady tap of chasing hammers shaping copper sheets over pitch.',
        ],
      },
      {
        id: 'pt-ch-2',
        number: '02',
        title: 'Krishna Mandir: Epic Carved in Stone',
        durationSec: 60,
        narratorRole: 'Architectural Guide',
        ambientProfile: 'singing-bowl',
        script: [
          'Standing squarely in the center of the brick plaza, Krishna Mandir breaks every Newari rule of red brick and timber.',
          'Built in 1637 by the poet-king Siddhi Narsingh Malla, its twenty-one stone spires soar skyward like Mount Meru.',
          'Walk around the first-floor colonnade and study the carved stone lintels: scenes from the Mahabharata and Ramayana unfold like a continuous stone storyboard, labeled in crisp Malla-era script.',
        ],
      },
      {
        id: 'pt-ch-3',
        number: '03',
        title: 'Inside the Three Palace Courtyards',
        durationSec: 54,
        narratorRole: 'Museum Curator',
        ambientProfile: 'singing-bowl',
        script: [
          'Pass beneath the carved brick palace facade and noise drops instantly into cloistered calm.',
          'Keshav Narayan Chowk now houses the Patan Museum, celebrated across Asia for displaying lost-wax Buddhist and Hindu bronzes inside the very palace architecture that inspired them.',
          'Continue south into Sundari Chowk to discover Tusha Hiti—a sunken stone royal bath guarded by carved serpents and brass waterspouts.',
        ],
      },
    ],
    visitorNotes: {
      dressCode: 'Smart casual; modest coverage inside active monastic courtyards such as Golden Temple.',
      etiquette: 'Do not lean on ancient carved stone reliefs or touch bronze museum sculptures.',
      photography: 'Allowed in plazas and outer courtyards; check signage inside Patan Museum galleries.',
      majorFestival: 'Rato Machhendranath Jatra (Apr/May) — Towering bamboo chariot festival across Lalitpur.',
    },
  },
  {
    id: 'bhaktapur-durbar-square',
    slug: 'bhaktapur-durbar-square',
    name: 'Bhaktapur Durbar Square',
    nativeName: 'भक्तपुर दरबार क्षेत्र (ख्वप)',
    district: 'Eastern Valley · Bhaktapur',
    category: 'Royal Plaza',
    era: 'Malla Capital (12th–18th Century)',
    foundedYear: 'c. 12th Century CE · 1702 CE Nyatapola',
    elevationMeters: 1401,
    coordinates: {
      lat: 27.6721,
      lng: 85.4282,
      label: '27.6721° N, 85.4282° E',
    },
    mapPos: { x: 825, y: 455 },
    unescoRef: 'UNESCO WHL 121bis · Zone VI',
    visitingHours: 'Daily 06:00 – 20:00 (Old Town pedestrianized)',
    entryFees: {
      foreign: 'NPR 1,800',
      saarc: 'NPR 500',
      nepali: 'Free',
    },
    panoramaImage: bhaktapurDurbarImg,
    summary:
      'A traffic-free medieval Newari brick city encompassing the 55-Window Palace, the Golden Gate, Pottery Square, and the five-tiered, 30-meter Nyatapola Pagoda.',
    quote: {
      text: 'Nyatapola stood intact through the 1934 and 2015 earthquakes—a testament to stepped masonry geometry and balanced timber framing.',
      attribution: 'Nepali Seismic Heritage Commission',
    },
    historicalEssay: [
      'Founded in the twelfth century by Ananda Malla and serving as the unified capital of the Kathmandu Valley until the late fifteenth century, Bhaktapur—known locally as Khwopa, City of Devotees—preserves Nepal’s most intact medieval urban fabric. Cars are banned across its brick-paved core, leaving squares open to potters drying clay vessels in the sun and artisans carving wood.',
      'The heritage zone spans four interconnected plazas: the royal Durbar Square anchored by the 55-Window Palace and repoussé Golden Gate (Sun Dhoka); Taumadhi Square dominated by the towering five-story Nyatapola Temple; Pottery Square; and Dattatreya Square in the east.',
      'Built in 1702 by King Bhupatindra Malla in just five months, Nyatapola rises over thirty meters on five stepped brick terraces flanked by pairs of legendary guardians—each ten times stronger than the pair below, from wrestlers Jaya and Phatta Malla up to lions, griffins, and tantric goddesses.',
    ],
    viewpoints: [
      {
        id: 'bh-taumadhi',
        title: 'Taumadhi & Nyatapola Plinth',
        subtitle: 'Looking across the five-tiered pagoda and historic palace skyline',
        initialYaw: 0,
        initialPitch: 6,
        defaultFov: 70,
        atmosphereTint: 'golden',
      },
      {
        id: 'bh-55window',
        title: '55-Window Palace & Plaza',
        subtitle: 'Royal brick facade, stone columns, and mountain horizon',
        initialYaw: -48,
        initialPitch: 4,
        defaultFov: 62,
        atmosphereTint: 'courtyard',
      },
      {
        id: 'bh-guardians',
        title: 'Nyatapola Guardian Stairway',
        subtitle: 'Close perspective along the carved stone elephants and lions',
        initialYaw: 28,
        initialPitch: 10,
        defaultFov: 56,
        atmosphereTint: 'dawn',
      },
    ],
    hotspots: [
      {
        id: 'bh-hs-1',
        viewpointId: 'bh-taumadhi',
        yaw: 30,
        pitch: 18,
        title: 'Nyatapola Five-Tiered Pagoda',
        category: 'Seismic Masterpiece',
        period: '1702 CE · King Bhupatindra Malla',
        description:
          'Nepal’s tallest traditional pagoda rises 30 meters above Taumadhi Plaza, dedicated to the tantric goddess Siddhi Lakshmi and surviving both the 1934 and 2015 earthquakes.',
        architecturalNote: 'Five-stage pyramidal brick base tapers load smoothly into a symmetrical timber tower.',
        audioChapterIndex: 0,
      },
      {
        id: 'bh-hs-2',
        viewpointId: 'bh-taumadhi',
        yaw: 22,
        pitch: -4,
        title: 'Stepped Guardian Statues',
        category: 'Stone Sculpture',
        period: '1702 CE',
        description:
          'Ascending the central staircase are pairs of Malla wrestlers, elephants, lions, winged griffins, and Baghini/Singhini deities—each symbolizing tenfold ascending strength.',
        architecturalNote: 'Monolithic sandstone carvings seated on brick plinth balustrades.',
        audioChapterIndex: 1,
      },
      {
        id: 'bh-hs-3',
        viewpointId: 'bh-taumadhi',
        yaw: -40,
        pitch: 4,
        title: 'Pachpanna Jhyale (55-Window Palace)',
        category: 'Royal Timber Craft',
        period: '1700 CE',
        description:
          'Constructed originally in 1427 and remodeled by Bhupatindra Malla, its projecting upper gallery features fifty-five continuous carved black-wood lattice windows.',
        architecturalNote: 'Masterpiece of interlocking sal-wood joinery cantilevered over mud-mortar brick.',
        audioChapterIndex: 2,
      },
      {
        id: 'bh-hs-4',
        viewpointId: 'bh-55window',
        yaw: -36,
        pitch: 0,
        title: 'Bhupatindra Column & Golden Gate',
        category: 'Gilded Repoussé',
        period: '1753 CE · Jaya Ranjit Malla',
        description:
          'A stone pillar supports a gilt-bronze statue of King Bhupatindra Malla in perpetual prayer opposite the dazzling repoussé copper Golden Gate.',
        architecturalNote: 'Sun Dhoka depicts Garuda, Kali, and four-headed Taleju in hammered gold-leaf copper.',
        audioChapterIndex: 2,
      },
    ],
    routes: [
      {
        id: 'bh-walk-oldtown',
        mode: 'Walking Trail',
        origin: 'Bhaktapur Bus Park (Kamalbinayak / Dudhpati) Heritage Loop',
        distanceKm: 2.4,
        durationMin: 35,
        elevationGainM: 18,
        difficulty: 'Gentle',
        bestWindow: '07:00 – 10:30 when potters lay clay jars across Talako Square',
        overview:
          'An entirely car-free loop linking all four historic squares of Bhaktapur—from western Dudhpati through Durbar Square, Taumadhi, Pottery Square, and eastern Dattatreya.',
        waypoints: [
          {
            step: 1,
            landmark: 'Siddha Pokhari & Dudhpati Entry',
            instruction: 'Pass the vast 15th-century stone water reservoir and purchase your heritage ticket at the main west gate.',
          },
          {
            step: 2,
            landmark: 'Durbar Square & Golden Gate',
            instruction: 'Explore the 55-Window Palace and National Art Museum courtyard.',
          },
          {
            step: 3,
            landmark: 'Taumadhi & Pottery Square',
            instruction: 'Walk south past Nyatapola Temple into Talako Square to watch wheel-thrown terracotta firing.',
          },
          {
            step: 4,
            landmark: 'Dattatreya Square & Peacock Window',
            instruction: 'Continue northeast along craft lanes to inspect the 15th-century Pujari Math peacock carving.',
          },
        ],
      },
      {
        id: 'bh-transit',
        mode: 'Public Transit',
        origin: 'Ratna Park / Bagh Bazaar Express Bus',
        distanceKm: 13.5,
        durationMin: 40,
        elevationGainM: 55,
        difficulty: 'Gentle',
        bestWindow: 'Depart before 08:30 or mid-day on the Araniko Highway',
        overview:
          'Express green Bhaktapur buses depart every 10 minutes from Ratna Park along the six-lane Araniko Highway straight to Dudhpati or Kamalbinayak.',
        waypoints: [
          {
            step: 1,
            landmark: 'Ratna Park Bhaktapur Bus Stand',
            instruction: 'Board the Bhaktapur Express via Koteshwor–Sallaghari.',
          },
          {
            step: 2,
            landmark: 'Sallaghari Pine Crossroads',
            instruction: 'Exit onto Dudhpati Road north of the Araniko Highway.',
          },
          {
            step: 3,
            landmark: 'Siddha Pokhari Stop',
            instruction: 'Alight beside the brick pond and walk 300 meters east into Durbar Square.',
          },
        ],
      },
      {
        id: 'bh-taxi',
        mode: 'Taxi / Cycle',
        origin: 'Kathmandu / Airport via Araniko Highway',
        distanceKm: 12.2,
        durationMin: 32,
        elevationGainM: 55,
        difficulty: 'Gentle',
        bestWindow: 'Afternoon golden hour (15:30 – 17:30)',
        overview:
          'Smooth highway drive east from Koteshwor/Jadibuti past Thimi pottery town right to the pedestrian entrance gates of Bhaktapur.',
        waypoints: [
          {
            step: 1,
            landmark: 'Koteshwor–Suryabinayak Expressway',
            instruction: 'Follow the wide six-lane Araniko Highway east past Madhyapur Thimi.',
          },
          {
            step: 2,
            landmark: 'Sallaghari Left Turn',
            instruction: 'Take the northern spur road to Dudhpati Gate parking.',
          },
        ],
      },
    ],
    timeline: [
      {
        year: 'c. 1147 CE',
        era: 'Early Medieval',
        title: 'Founding of Khwopa',
        detail: 'King Ananda Malla plans the conch-shell shaped city as the primary capital of the Valley.',
      },
      {
        year: '1427 CE',
        era: 'Yaksha Malla Era',
        title: 'Original 55-Window Palace',
        detail: 'Construction of the royal palace wing prior to Bhaktapur’s emergence as an independent kingdom in 1482.',
      },
      {
        year: '1702 CE',
        era: 'Bhupatindra Malla Golden Age',
        title: 'Nyatapola Consecration',
        detail: 'Completed in just 150 days, creating Nepal’s tallest and most seismically resilient pagoda.',
      },
      {
        year: '1974–Present',
        era: 'Bhaktapur Development Project',
        title: 'Car-Free Brick Preservation',
        detail: 'Long-running German-Nepali restoration preserves medieval brick paving, pottery kilns, and historic water conduits.',
      },
    ],
    architecturalFeatures: [
      {
        name: 'Five-Tier Pyramidal Plinth',
        material: 'Graduated Brick Masonry',
        detail: 'Broad stepped terraces distribute overturning forces evenly, protecting Nyatapola during severe earthquakes.',
      },
      {
        name: 'Pachpanna Jhyale Gallery',
        material: 'Carved Black Sal Timber',
        detail: 'Fifty-five interlocking lattice windows mounted atop a cantilevered upper palace wall.',
      },
      {
        name: 'Sun Dhoka (Golden Gate)',
        material: 'Mercury-Gilded Repoussé Copper',
        detail: 'Finely embossed archway considered the pinnacle of Newari metalworking artistry.',
      },
      {
        name: 'Pujari Math Peacock Window',
        material: 'Intricate Hardwood Carving',
        detail: '15th-century wooden screen displaying a fanned peacock amidst auspicious vines.',
      },
    ],
    audioChapters: [
      {
        id: 'bh-ch-1',
        number: '01',
        title: 'The Engineering Genius of Nyatapola',
        durationSec: 62,
        narratorRole: 'Structural Historian',
        ambientProfile: 'temple-bells',
        script: [
          'Stand at the foot of Taumadhi Square and tilt your gaze upward past five sweeping terracotta roofs.',
          'When Bhupatindra Malla raised Nyatapola in 1702, he placed the 30-meter tower on five wide brick terraces that widen the footprint and anchor the center of gravity.',
          'Each upper roof shrinks symmetrically in proportion, reducing wind and seismic whip—explaining why Nyatapola rode out both the catastrophic 1934 earthquake and the 2015 tremors with barely a cracked tile.',
        ],
      },
      {
        id: 'bh-ch-2',
        number: '02',
        title: 'Potters, Carvers & Juju Dhau',
        durationSec: 55,
        narratorRole: 'Urban Ethnographer',
        ambientProfile: 'river-wind',
        script: [
          'Unlike a museum behind glass, Bhaktapur remains a working guild city.',
          'Walk three minutes west to Pottery Square and you will see Prajapati families spinning black valley clay on wooden flywheels—drying thousands of yogurt bowls across the sunlit brickwork.',
          'That clay powers Bhaktapur’s famous Juju Dhau, or King Curd, cultured inside porous terracotta pots that draw out excess moisture to leave a velvety custard.',
        ],
      },
      {
        id: 'bh-ch-3',
        number: '03',
        title: 'Through the Golden Gate',
        durationSec: 52,
        narratorRole: 'Curatorial Guide',
        ambientProfile: 'singing-bowl',
        script: [
          'Back in Durbar Square, pause before the shimmering Golden Gate installed by King Jaya Ranjit Malla in 1753.',
          'Crafted from hammered copper panels coated in pure gold, the archways depict winged Garuda, mythical sea creatures, and the four-headed goddess Taleju.',
          'Even in a single square meter of this doorway, Newari smiths achieved jewel-like delicacy at architectural scale.',
        ],
      },
    ],
    visitorNotes: {
      dressCode: 'Comfortable walking shoes for brick alleys; respectful attire inside active courtyards.',
      etiquette: 'Keep your ticket handy as inspectors check it between squares; step carefully around drying pottery.',
      photography: 'Dawn and late afternoon create deep relief shadows across woodcarvings.',
      majorFestival: 'Bisket Jatra (Mid-April Nepali New Year) — Towering chariot tug-of-war in Taumadhi Square.',
    },
  },
  {
    id: 'changu-narayan',
    slug: 'changu-narayan',
    name: 'Changu Narayan Temple',
    nativeName: 'चाँगुनारायण मन्दिर',
    district: 'Eastern Hilltop · Bhaktapur Ridge',
    category: 'Hilltop Shrine',
    era: 'Licchavi Origins (5th Century CE)',
    foundedYear: '464 CE Dated Pillar (Current Roof 1702 CE)',
    elevationMeters: 1541,
    coordinates: {
      lat: 27.7163,
      lng: 85.4278,
      label: '27.7163° N, 85.4278° E',
    },
    mapPos: { x: 862, y: 268 },
    unescoRef: 'UNESCO WHL 121bis · Zone VII',
    visitingHours: 'Daily 06:00 – 18:00',
    entryFees: {
      foreign: 'NPR 300',
      saarc: 'NPR 100',
      nepali: 'Free',
    },
    panoramaImage: changuNarayanImg,
    summary:
      'Perched on a peaceful pine-forested ridge 150 meters above the Manohara valley, Changu Narayan holds Nepal’s oldest dated stone inscription (464 CE) and unmatched Licchavi stone sculptures.',
    quote: {
      text: 'Long before Kathmandu’s Durbar Squares took shape, King Manadeva carved Nepal’s earliest documented history onto a stone pillar on Changu ridge.',
      attribution: 'Epigraphica Nepalensis',
    },
    historicalEssay: [
      'Standing atop a quiet dolomitic ridge northeast of Bhaktapur, Changu Narayan is revered as the oldest surviving Hindu temple sanctuary in the Kathmandu Valley. Dedicated to Vishnu as Narayan, its stone courtyard feels worlds removed from city traffic, framed by rural Newar brick houses and distant snowpeaks.',
      'In 464 CE, Licchavi King Manadeva I erected a sandstone pillar before the western shrine entrance inscribed in crisp Gupta Brahmi script—the earliest dated historical document in Nepal. Around the courtyard stand extraordinary fifth- to eighth-century sculptures: Vishnu mounted on Garuda, Vikranta Vamana striding across the cosmos, and the majestic Vishwarupa panel.',
      'Rebuilt in its present two-tiered pagoda form in 1702 after fire, the temple showcases some of the valley’s richest multi-armed tantric woodcarvings along its overhanging roof struts and gilded copper doorways.',
    ],
    viewpoints: [
      {
        id: 'cn-garuda',
        title: 'Garuda Pillar & Western Courtyard',
        subtitle: 'Classic view past the 5th-century Garuda sculpture toward the pagoda',
        initialYaw: 0,
        initialPitch: 5,
        defaultFov: 68,
        atmosphereTint: 'dawn',
      },
      {
        id: 'cn-himal',
        title: 'Himalayan Ridge Overlook',
        subtitle: 'Eastern courtyard balustrade gazing toward Langtang peaks',
        initialYaw: 45,
        initialPitch: 4,
        defaultFov: 64,
        atmosphereTint: 'golden',
      },
      {
        id: 'cn-struts',
        title: 'Gilded Facade & Strut Detail',
        subtitle: 'Close architectural look at the repoussé entrance and carved timber',
        initialYaw: -28,
        initialPitch: 8,
        defaultFov: 54,
        atmosphereTint: 'courtyard',
      },
    ],
    hotspots: [
      {
        id: 'cn-hs-1',
        viewpointId: 'cn-garuda',
        yaw: 0,
        pitch: 4,
        title: 'Garuda Pillar & 464 CE Inscription',
        category: 'Earliest Nepali Epigraphy',
        period: '464 CE · King Manadeva I',
        description:
          'A kneeling stone Garuda crowns a slender monolith bearing the oldest dated stone inscription in Nepal, recounting Manadeva’s filial devotion and military deeds.',
        architecturalNote: 'Carved in fine-grained valley sandstone using late-Gupta sculptural proportions.',
        audioChapterIndex: 0,
      },
      {
        id: 'cn-hs-2',
        viewpointId: 'cn-garuda',
        yaw: -36,
        pitch: 12,
        title: 'Two-Tiered Gilded Narayan Pagoda',
        category: 'Pagoda Architecture',
        period: '1702 CE Rebuild',
        description:
          'Crowned with golden roof plates and ornate toranas, the shrine’s four sides display brass guardian lions, griffins, and winged steeds.',
        architecturalNote: 'Twenty-four polychrome wooden struts depict the incarnations of Vishnu.',
        audioChapterIndex: 1,
      },
      {
        id: 'cn-hs-3',
        viewpointId: 'cn-garuda',
        yaw: -14,
        pitch: 0,
        title: 'Licchavi Stone Reliefs (Vishwarupa & Narasimha)',
        category: 'Classical Sculpture',
        period: '5th–8th Century CE',
        description:
          'Set along the courtyard perimeter are museum-grade stone reliefs carved over 1,300 years ago, illustrating cosmic avatars of Vishnu.',
        architecturalNote: 'Carved in high relief from dark metamorphic stone resistant to mountain weathering.',
        audioChapterIndex: 2,
      },
      {
        id: 'cn-hs-4',
        viewpointId: 'cn-himal',
        yaw: 48,
        pitch: 2,
        title: 'Changu Ridge & Manohara Vista',
        category: 'Sacred Geography',
        period: 'Natural Sanctuary',
        description:
          'Once surrounded by a dense champak forest (Changu), the hilltop commands sweeping morning views across terraced rice fields and the northern Himalayan wall.',
        architecturalNote: 'Dry-stone retaining walls follow the natural ridge crest.',
        audioChapterIndex: 2,
      },
    ],
    routes: [
      {
        id: 'cn-walk-nagarkot',
        mode: 'Walking Trail',
        origin: 'Bhaktapur / Telkot Ridge Trail',
        distanceKm: 5.2,
        durationMin: 75,
        elevationGainM: 185,
        difficulty: 'Steep Ascent',
        bestWindow: '06:30 – 10:30 for clear Himalayan snowline views',
        overview:
          'One of Kathmandu Valley’s finest short heritage hikes climbs from Telkot or northern Bhaktapur through terraced millet fields, pine woods, and tranquil Tamang and Newar hamlets.',
        waypoints: [
          {
            step: 1,
            landmark: 'Telkot Pass Trailhead (or Bhaktapur North)',
            instruction: 'Start along the undulating eastern dirt ridge path marked for Changu Narayan.',
          },
          {
            step: 2,
            landmark: 'Champadevi Ridge Terraces',
            instruction: 'Follow the stone-paved crest footpath flanked by mustard and rice terraces.',
            note: 'Wide views open north toward Langtang Lirung and Dorje Lakpa on clear mornings.',
          },
          {
            step: 3,
            landmark: 'Changu Village Stone Lane',
            instruction: 'Pass traditional mud-brick houses selling handmade Newari thanka paintings and clay crafts.',
          },
          {
            step: 4,
            landmark: 'Western Stone Archway',
            instruction: 'Ascend the final twenty stone steps into the serene temple quadrangle.',
          },
        ],
      },
      {
        id: 'cn-transit',
        mode: 'Public Transit',
        origin: 'Bhaktapur Kamalbinayak Bus Park',
        distanceKm: 6.1,
        durationMin: 25,
        elevationGainM: 145,
        difficulty: 'Gentle',
        bestWindow: '07:30 – 16:30 (hourly local buses)',
        overview:
          'Local buses depart regularly from Bhaktapur’s Kamalbinayak terminal up the winding hill road straight to the base of Changu village.',
        waypoints: [
          {
            step: 1,
            landmark: 'Kamalbinayak Bus Stand',
            instruction: 'Board the green local bus signed "Changu Narayan" on the northeast edge of Bhaktapur.',
          },
          {
            step: 2,
            landmark: 'Manohara Bridge & Ridge Switchbacks',
            instruction: 'Ride past rural brick kilns and climb through terraced hillsides.',
          },
          {
            step: 3,
            landmark: 'Changu Village Gate',
            instruction: 'Walk 250 meters uphill through the cobblestone heritage lane to the temple courtyard.',
          },
        ],
      },
      {
        id: 'cn-taxi',
        mode: 'Taxi / Cycle',
        origin: 'Boudhanath or Bhaktapur via Mulpani–Sankhu Road',
        distanceKm: 9.8,
        durationMin: 30,
        elevationGainM: 165,
        difficulty: 'Moderate',
        bestWindow: 'Morning sunlight before valley haze rises',
        overview:
          'A scenic ridge drive passing Sankhu road and Mulpani golf terraces, climbing steadily to Changu Narayan’s hillside parking terrace.',
        waypoints: [
          {
            step: 1,
            landmark: 'Jorpati / Mulpani Corridor',
            instruction: 'Drive east past Mulpani cricket ground across the Manohara River.',
          },
          {
            step: 2,
            landmark: 'Changu Hill Ascent',
            instruction: 'Follow the paved ridge road directly to the pedestrian village square.',
          },
        ],
      },
    ],
    timeline: [
      {
        year: 'c. 325–464 CE',
        era: 'Licchavi Dynasty',
        title: 'Manadeva’s Dated Pillar',
        detail: 'Earliest dated stone inscription in Nepal records the patronage of Changu Narayan atop Doladri Hill.',
      },
      {
        year: '6th–8th Century CE',
        era: 'Classical Licchavi Art',
        title: 'Masterwork Stone Sculptures',
        detail: 'Creation of the courtyard’s iconic Vikranta, Narasimha, and Vishwarupa stone reliefs.',
      },
      {
        year: '1702 CE',
        era: 'Malla Reconstruction',
        title: 'Two-Tiered Pagoda & Gilded Entrance',
        detail: 'Following a devastating fire, the temple was rebuilt with gilded copper roofs and carved struts.',
      },
      {
        year: '2015–2019 CE',
        era: 'Post-Quake Structural Repair',
        title: 'Chaukot Sattal & Pagoda Restoration',
        detail: 'Master craftsmen stabilized surrounding brick rest-houses and conserved Licchavi stonework.',
      },
    ],
    architecturalFeatures: [
      {
        name: '464 CE Sandstone Pillar',
        material: 'Inscribed Valley Sandstone',
        detail: 'Fifteen lines of Sanskrit verse in Licchavi script anchoring the chronology of Nepali history.',
      },
      {
        name: 'Polychrome Timber Struts',
        material: 'Carved Sal Wood & Mineral Pigments',
        detail: 'Support struts beneath both pagoda roofs illustrating celestial dancers and Vishnu’s avatars.',
      },
      {
        name: 'Licchavi Bas-Reliefs',
        material: 'Fine Grey Metamorphic Stone',
        detail: 'Graceful anatomy and drapery showcasing Kathmandu Valley’s golden age of stone carving.',
      },
      {
        name: 'Chaukot Brick Quadrangle',
        material: 'Terracotta Brick & Timber',
        detail: 'Surrounding pilgrimage rest-houses (sattals) enclosing the hilltop sanctuary against mountain winds.',
      },
    ],
    audioChapters: [
      {
        id: 'cn-ch-1',
        number: '01',
        title: 'Nepal’s First Dated Stone Page',
        durationSec: 60,
        narratorRole: 'Epigrapher',
        ambientProfile: 'river-wind',
        script: [
          'Pause beside the weathered stone pillar crowned by the kneeling winged figure of Garuda.',
          'Engraved here in the year 464 CE by King Manadeva I is the earliest securely dated written record in Nepal’s history.',
          'In delicate Sanskrit verse, the young king describes persuading his grieving mother not to ascend the royal funeral pyre—offering historians an intimate, human window into the Kathmandu Valley sixteen centuries ago.',
        ],
      },
      {
        id: 'cn-ch-2',
        number: '02',
        title: 'Gallery of Licchavi Stone',
        durationSec: 54,
        narratorRole: 'Sculpture Specialist',
        ambientProfile: 'singing-bowl',
        script: [
          'Circle the pagoda courtyard slowly and notice the stone reliefs tucked inside small shrines.',
          'Carved between the fifth and eighth centuries, figures like Narasimha and Cosmic Vishnu display fluid, natural proportions rarely seen in later medieval stonework.',
          'Each stone panel survived centuries of monsoon rain and earthquakes in the open air, preserved by dense valley stone and continual community care.',
        ],
      },
      {
        id: 'cn-ch-3',
        number: '03',
        title: 'A Sanctuary Above the Clouds',
        durationSec: 50,
        narratorRole: 'Trail Narrator',
        ambientProfile: 'temple-bells',
        script: [
          'Look north from the courtyard wall and the noise of Kathmandu disappears below a sea of terraced hillsides.',
          'On crisp winter mornings, the snow-capped wall of the Langtang Himalayas hovers directly above the pine ridge, turning Changu Narayan into both a historical archive and the valley’s quietest alpine balcony.',
        ],
      },
    ],
    visitorNotes: {
      dressCode: 'Layered walking gear for cool hilltop winds; shoes removed before stepping onto the inner shrine threshold.',
      etiquette: 'Inner sanctum doors are restricted to Hindu worshippers; the full outer courtyard and sculptures are open to all.',
      photography: 'Allowed throughout the courtyard and village ridge.',
      majorFestival: 'Haribodhini Ekadashi (November) — Lamps, devotional songs, and hill pilgrimages.',
    },
  },
];

export const TRAIL_CORRIDORS: TrailCorridor[] = [
  {
    id: 'corridor-kds-sw',
    fromId: 'kathmandu-durbar-square',
    toId: 'swayambhunath',
    distanceKm: 2.3,
    walkingMin: 30,
    transitMin: 14,
    corridorName: 'Maru–Bishnumati Heritage Walk',
    highlights: 'Crosses Maru Tole, wooden footbridge over the Bishnumati River, and ascends the 365 Eastern Steps.',
  },
  {
    id: 'corridor-kds-pt',
    fromId: 'kathmandu-durbar-square',
    toId: 'patan-durbar-square',
    distanceKm: 5.2,
    walkingMin: 68,
    transitMin: 22,
    corridorName: 'Bagmati Twin-Capital Corridor',
    highlights: 'Connects Hanuman Dhoka southward past Tripureshwor across the Bagmati into Lalitpur’s Golden Temple lane.',
  },
  {
    id: 'corridor-kds-ps',
    fromId: 'kathmandu-durbar-square',
    toId: 'pashupatinath',
    distanceKm: 4.8,
    walkingMin: 62,
    transitMin: 20,
    corridorName: 'East-West Old City Traverse',
    highlights: 'Threads from Basantapur via Kamaladi and Maitidevi to Gaushala and the Bagmati River ghats.',
  },
  {
    id: 'corridor-ps-bd',
    fromId: 'pashupatinath',
    toId: 'boudhanath',
    distanceKm: 3.1,
    walkingMin: 40,
    transitMin: 12,
    corridorName: 'Sacred River-to-Mandala Trail',
    highlights: 'Walks through Mrigasthali forest, past Guhyeshwari and 3rd-century BCE Charumati Stupa straight to Boudha’s kora.',
  },
  {
    id: 'corridor-pt-bh',
    fromId: 'patan-durbar-square',
    toId: 'bhaktapur-durbar-square',
    distanceKm: 11.4,
    walkingMin: null,
    transitMin: 35,
    corridorName: 'Araniko Pottery & Palace Link',
    highlights: 'Follows Jadibuti and Madhyapur Thimi ceramic workshops along the southern valley terrace to Bhaktapur.',
  },
  {
    id: 'corridor-bh-cn',
    fromId: 'bhaktapur-durbar-square',
    toId: 'changu-narayan',
    distanceKm: 5.6,
    walkingMin: 75,
    transitMin: 22,
    corridorName: 'Doladri Ridge Heritage Hike',
    highlights: 'Climbs from northern Bhaktapur or Telkot through terraced fields and pine forest to Changu Narayan.',
  },
  {
    id: 'corridor-bd-cn',
    fromId: 'boudhanath',
    toId: 'changu-narayan',
    distanceKm: 9.2,
    walkingMin: null,
    transitMin: 28,
    corridorName: 'Manohara Valley Ridge Climb',
    highlights: 'Crosses the Manohara basin via Mulpani and climbs up to the 5th-century Changu hilltop.',
  },
];
