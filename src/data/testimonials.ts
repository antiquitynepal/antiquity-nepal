export type VisitType = 'First-Time Visitor' | 'Returning Explorer';

export interface VisitorTestimonial {
  id: string;
  authorUid: string;
  visitorName: string;
  originCountry: string;
  visitType: VisitType;
  visitedSiteId: string;
  visitedSiteName: string;
  visitDateLabel: string;
  rating: number;
  headline: string;
  story: string;
  adviceForFirstTimers: string;
  isCuratedEditorial?: boolean;
}

export const INITIAL_TESTIMONIALS: VisitorTestimonial[] = [
  {
    id: 'curated-kyoto-swayambhunath',
    authorUid: 'curated-editorial',
    visitorName: 'Haruka Takahashi',
    originCountry: 'Kyoto, Japan',
    visitType: 'First-Time Visitor',
    visitedSiteId: 'swayambhunath',
    visitedSiteName: 'Swayambhunath Stupa',
    visitDateLabel: 'October 2026',
    rating: 5,
    headline: 'Climbing 365 stone steps into mist, butter lamps, and valley silence',
    story:
      'As someone arriving in Nepal for the very first time, the early-morning walk from Thamel across the Bishnumati footbridge to Swayambhunath felt unforgettable. Listening to Chapter 1 of the audio guide while catching my breath beside the mossy chaityas made every stupa spire and carved torana come alive. Seeing the painted eyes catch the sunrise over the entire Kathmandu basin was the single most serene hour of my trip.',
    adviceForFirstTimers:
      'Arrive before 06:45 to hear the courtyard chanting without crowds, carry small rupees for lamp offerings, and keep snacks tucked inside your pack away from the macaques.',
    isCuratedEditorial: true,
  },
  {
    id: 'curated-lisbon-kathmandu-durbar',
    authorUid: 'curated-editorial',
    visitorName: 'Mateus & Sofia Almeida',
    originCountry: 'Lisbon, Portugal',
    visitType: 'First-Time Visitor',
    visitedSiteId: 'kathmandu-durbar-square',
    visitedSiteName: 'Kathmandu Durbar Square',
    visitDateLabel: 'November 2026',
    rating: 5,
    headline: 'Walking straight from chaotic Asan Bazaar into living royal Newari woodwork',
    story:
      'Nothing prepared us for how seamlessly ancient palace courtyards sit alongside daily vegetable and spice markets on our first afternoon in Kathmandu. Using the walking route waypoints took us past brass workshops right up to Kumari Ghar just as the courtyard bells rang. Seeing how post-2015 timber restoration preserved centuries-old struts moved us deeply.',
    adviceForFirstTimers:
      'Hold onto your square entry ticket if you step into the side lanes—you can have it stamped at the corner booth for multi-day reentry.',
    isCuratedEditorial: true,
  },
  {
    id: 'curated-lyon-boudhanath',
    authorUid: 'curated-editorial',
    visitorName: 'Claire Deschamps',
    originCountry: 'Lyon, France',
    visitType: 'Returning Explorer',
    visitedSiteId: 'boudhanath',
    visitedSiteName: 'Boudhanath Stupa',
    visitDateLabel: 'September 2026',
    rating: 5,
    headline: 'Why first-timers fall in love with dusk circumambulation—and still notice new murals on visit three',
    story:
      'I returned to Boudhanath four years after my first Nepal journey and walked beside many first-time travelers experiencing the twilight butter-lamp kora for the first time. Watching newcomers pause in awe as juniper smoke rises past the 36-meter white mandala reminded me why this square feels unlike anywhere else on earth. Compared to busy central traffic, inside the circular courtyard only footsteps, prayer wheels, and soft mantras remain.',
    adviceForFirstTimers:
      'Always walk clockwise around the stupa, try freshly brewed salt butter tea on an upper terrace overlooking the harmika eyes, and stay at least 40 minutes after sunset.',
    isCuratedEditorial: true,
  },
  {
    id: 'curated-madrid-pashupatinath',
    authorUid: 'curated-editorial',
    visitorName: 'Javier Morales',
    originCountry: 'Madrid, Spain',
    visitType: 'First-Time Visitor',
    visitedSiteId: 'pashupatinath',
    visitedSiteName: 'Pashupatinath Temple',
    visitDateLabel: 'October 2026',
    rating: 5,
    headline: 'Profound reverence during the Bagmati evening Aarati ritual',
    story:
      'I was nervous before visiting Pashupatinath on my first day because I wanted to be completely respectful of local sacred customs. Reading the etiquette guide and standing on the stone terraces across the eastern riverbank made all the difference. As the three-tiered oil lamps began swinging in rhythm with drums and Sanskrit hymns at dusk, dozens of strangers stood silently together in the warm river breeze.',
    adviceForFirstTimers:
      'Non-Hindus view the main pagoda from the eastern stone steps; cross the footbridge 35 minutes before sunset for an unobstructed stone seat opposite the riverside altars.',
    isCuratedEditorial: true,
  },
  {
    id: 'curated-vancouver-bhaktapur',
    authorUid: 'curated-editorial',
    visitorName: 'Meera Krishnan',
    originCountry: 'Vancouver, Canada',
    visitType: 'First-Time Visitor',
    visitedSiteId: 'bhaktapur-durbar-square',
    visitedSiteName: 'Bhaktapur Durbar Square',
    visitDateLabel: 'August 2026',
    rating: 5,
    headline: 'Pottery Square kilns, peacock windows, and Juju Dhau yogurt in terracotta bowls',
    story:
      'Everyone told me Patan and Kathmandu were must-sees, yet taking the morning bus out to Bhaktapur gave me my favorite first-time impression of medieval Nepal. Without motorcycles rushing past the brick alleys, you genuinely hear chisels tapping wood and pottery wheels spinning beside Nyatapola Pagoda. Having the walking itinerary PDF saved time so I caught both Taumadhi Square and Dattatreya in one relaxed afternoon.',
    adviceForFirstTimers:
      'Start at Golden Gate before noon, walk slowly down to Pottery Square when clay bowls are drying in rows, and sample Juju Dhau ("King Curd") served in unglazed clay pots.',
    isCuratedEditorial: true,
  },
  {
    id: 'curated-singapore-budhanilkantha',
    authorUid: 'curated-editorial',
    visitorName: 'Daniel Tan',
    originCountry: 'Singapore',
    visitType: 'First-Time Visitor',
    visitedSiteId: 'budhanilkantha-temple',
    visitedSiteName: 'Budhanilkantha Temple & Northern Rim',
    visitDateLabel: 'November 2026',
    rating: 4,
    headline: 'Stepping away from the inner city to see Vishnu floating on stillness',
    story:
      'Using the "Other Sites Worth Visiting" guide inspired me to ride 25 minutes north to Budhanilkantha on my final morning before flying out. For a first-time visitor accustomed to dense urban temples, seeing a fifth-century black basalt sculpture resting peacefully in clear spring water beneath the Shivapuri hills was a remarkably calming contrast.',
    adviceForFirstTimers:
      'Combine morning prayers at Budhanilkantha with a warm tea stop near the foothills trailhead before returning south to central Kathmandu before midday traffic builds.',
    isCuratedEditorial: true,
  },
];
