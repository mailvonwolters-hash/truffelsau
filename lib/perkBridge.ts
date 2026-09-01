export type PerkCustomer = {
  id: string
  name: string
  street: string
  postcode: string
  city: string
  phone?: string
  email?: string
  appointment?: { date: string; time: string; duration: number }
}

export type PerkHotelAnchor = { date: string; label: string; note?: string }
export type PerkSnapshot = { customers: PerkCustomer[]; hotelAnchors: PerkHotelAnchor[]; syncedAt: string }

export interface PerkConnector {
  sync(): Promise<PerkSnapshot>
}

/** Replace this connector with the real Perk API adapter when credentials are available. */
export const mockPerkBridge: PerkConnector = {
  async sync() {
    if (typeof window === 'undefined') return { customers: [], hotelAnchors: [], syncedAt: new Date().toISOString() }
    const customers = JSON.parse(localStorage.getItem('truffelsau-crm-customers') || '[]')
    const hotelAnchors = JSON.parse(localStorage.getItem('truffelsau-hotel-anchors') || '[]')
    return { customers: Array.isArray(customers) ? customers : [], hotelAnchors: Array.isArray(hotelAnchors) ? hotelAnchors : [], syncedAt: new Date().toISOString() }
  },
}

export const perkBridge = mockPerkBridge
