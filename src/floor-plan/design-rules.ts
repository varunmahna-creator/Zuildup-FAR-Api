/**
 * Design Rules Database
 * Vastu and practical rules for Indian home design
 */

export interface DesignRule {
  id: string;
  room: string;
  text: string;
  vastu: boolean;
  priority: 'high' | 'medium' | 'low';
}

export const DESIGN_RULES: DesignRule[] = [
  // Pooja Room rules
  {
    id: 'pooja-utility',
    room: 'pooja',
    text: 'Pooja Room should not be adjacent to Utility/Toilet',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'pooja-northeast',
    room: 'pooja',
    text: 'Pooja Room should be in Northeast corner',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'pooja-bedroom',
    room: 'pooja',
    text: 'Pooja Room should not be inside Bedroom',
    vastu: true,
    priority: 'medium',
  },

  // Kitchen rules
  {
    id: 'kitchen-utility',
    room: 'kitchen',
    text: 'Kitchen should not be adjacent to Utility area',
    vastu: false,
    priority: 'medium',
  },
  {
    id: 'kitchen-southeast',
    room: 'kitchen',
    text: 'Kitchen should be in Southeast corner',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'kitchen-toilet',
    room: 'kitchen',
    text: 'Kitchen should not share wall with Toilet',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'kitchen-ventilation',
    room: 'kitchen',
    text: 'Kitchen should have cross-ventilation with external wall',
    vastu: false,
    priority: 'high',
  },

  // Store Room rules
  {
    id: 'store-utility',
    room: 'store',
    text: 'Store Room entry should not be from Utility',
    vastu: false,
    priority: 'low',
  },
  {
    id: 'store-northwest',
    room: 'store',
    text: 'Store Room can be in Northwest or Southwest',
    vastu: true,
    priority: 'medium',
  },

  // Utility/Toilet rules
  {
    id: 'utility-center',
    room: 'utility',
    text: 'Utility/Toilet should not be in center of house',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'toilet-dining',
    room: 'utility',
    text: 'Toilet should not open directly to Dining area',
    vastu: false,
    priority: 'high',
  },
  {
    id: 'toilet-northwest',
    room: 'utility',
    text: 'Toilet should be in West or Northwest',
    vastu: true,
    priority: 'medium',
  },

  // Bedroom rules
  {
    id: 'master-southwest',
    room: 'bedroom',
    text: 'Master Bedroom should be in Southwest',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'bedroom-kitchen',
    room: 'bedroom',
    text: 'Bedroom should not open directly to Kitchen',
    vastu: false,
    priority: 'medium',
  },
  {
    id: 'bedroom-privacy',
    room: 'bedroom',
    text: 'Bedrooms should be away from road noise (rear of house)',
    vastu: false,
    priority: 'medium',
  },

  // Entrance rules
  {
    id: 'entrance-east',
    room: 'entrance',
    text: 'Main entrance facing East or North is auspicious',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'entrance-toilet',
    room: 'entrance',
    text: 'Toilet should not be visible from Main entrance',
    vastu: false,
    priority: 'high',
  },
  {
    id: 'entrance-living',
    room: 'entrance',
    text: 'Main entrance should lead to Living/Drawing room',
    vastu: false,
    priority: 'medium',
  },

  // Parking rules
  {
    id: 'parking-bedroom',
    room: 'parking',
    text: 'Car parking should not be directly under Bedroom',
    vastu: true,
    priority: 'medium',
  },
  {
    id: 'parking-entrance',
    room: 'parking',
    text: 'Parking should have easy access from main entrance',
    vastu: false,
    priority: 'medium',
  },

  // Servant Quarter rules
  {
    id: 'servant-separate',
    room: 'servant',
    text: 'Servant quarter should have separate entrance',
    vastu: false,
    priority: 'high',
  },
  {
    id: 'servant-northwest',
    room: 'servant',
    text: 'Servant quarter should be in Northwest',
    vastu: true,
    priority: 'medium',
  },

  // Staircase rules
  {
    id: 'stair-center',
    room: 'staircase',
    text: 'Staircase should not be in center of house',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'stair-toilet',
    room: 'staircase',
    text: 'No toilet under staircase',
    vastu: true,
    priority: 'high',
  },
  {
    id: 'stair-south',
    room: 'staircase',
    text: 'Staircase should be in South, West, or Southwest',
    vastu: true,
    priority: 'medium',
  },

  // Living Room rules
  {
    id: 'living-north',
    room: 'living',
    text: 'Living room should be in North or East',
    vastu: true,
    priority: 'medium',
  },
  {
    id: 'living-front',
    room: 'living',
    text: 'Living/Drawing room should be at front (road facing)',
    vastu: false,
    priority: 'high',
  },

  // Dining rules
  {
    id: 'dining-kitchen',
    room: 'dining',
    text: 'Dining area should be adjacent to Kitchen',
    vastu: false,
    priority: 'high',
  },
  {
    id: 'dining-west',
    room: 'dining',
    text: 'Dining area should be in West',
    vastu: true,
    priority: 'medium',
  },

  // Balcony rules
  {
    id: 'balcony-north-east',
    room: 'balcony',
    text: 'Balcony should be in North or East for morning sun',
    vastu: true,
    priority: 'low',
  },

  // Terrace rules
  {
    id: 'terrace-drainage',
    room: 'terrace',
    text: 'Terrace should have proper drainage towards Northeast',
    vastu: true,
    priority: 'medium',
  },

  // Lift rules
  {
    id: 'lift-southeast',
    room: 'lift',
    text: 'Lift should not be in Northeast or Southwest corner',
    vastu: true,
    priority: 'medium',
  },
  {
    id: 'lift-central',
    room: 'lift',
    text: 'Lift should be centrally accessible from all rooms',
    vastu: false,
    priority: 'high',
  },
];

/**
 * Get rules relevant to selected rooms
 */
export function getRelevantRules(
  roomTypes: string[],
  vastuCompliant: boolean = true,
): DesignRule[] {
  const relevantRooms = new Set([
    ...roomTypes,
    'entrance', // Always include entrance rules
    'staircase', // Always include for multi-floor
  ]);

  return DESIGN_RULES.filter((rule) => {
    if (!relevantRooms.has(rule.room)) return false;
    if (!vastuCompliant && rule.vastu) return false;
    return true;
  });
}

/**
 * Get rules formatted as text for AI prompt
 */
export function getRulesText(rules: DesignRule[]): string {
  const vastuRules = rules.filter((r) => r.vastu);
  const practicalRules = rules.filter((r) => !r.vastu);

  let text = '';

  if (vastuRules.length > 0) {
    text += 'VASTU RULES (वास्तु नियम):\n';
    vastuRules.forEach((rule, i) => {
      text += `${i + 1}. ${rule.text}\n`;
    });
    text += '\n';
  }

  if (practicalRules.length > 0) {
    text += 'PRACTICAL RULES (व्यावहारिक नियम):\n';
    practicalRules.forEach((rule, i) => {
      text += `${i + 1}. ${rule.text}\n`;
    });
  }

  return text;
}
