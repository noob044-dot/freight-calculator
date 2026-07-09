export interface TollPlaza {
  code: string;
  name: string;
  nhNumber: string;
  lat: number;
  lon: number;
  state: string;
  rates: {
    '16T': number;
    '25T': number;
    '40T': number;
  };
}

export const NHAI_TOLL_PLAZAS: TollPlaza[] = [
  { code: 'KHP', name: 'Khalapur', nhNumber: 'NH48', lat: 18.8167, lon: 73.3000, state: 'Maharashtra', rates: { '16T': 185, '25T': 310, '40T': 520 } },
  { code: 'KSP', name: 'Khed Shivapur', nhNumber: 'NH48', lat: 18.3833, lon: 73.7667, state: 'Maharashtra', rates: { '16T': 165, '25T': 280, '40T': 470 } },
  { code: 'CHT', name: 'Chittorgarh', nhNumber: 'NH48', lat: 24.8887, lon: 74.6269, state: 'Rajasthan', rates: { '16T': 210, '25T': 350, '40T': 580 } },
  { code: 'SHP', name: 'Shahpura', nhNumber: 'NH48', lat: 25.6283, lon: 75.9575, state: 'Rajasthan', rates: { '16T': 145, '25T': 240, '40T': 400 } },
  { code: 'BHR', name: 'Behror', nhNumber: 'NH48', lat: 27.8817, lon: 76.2850, state: 'Rajasthan', rates: { '16T': 130, '25T': 220, '40T': 370 } },
  { code: 'DHU', name: 'Dharuhera', nhNumber: 'NH48', lat: 28.2167, lon: 76.7833, state: 'Haryana', rates: { '16T': 120, '25T': 200, '40T': 340 } },
  { code: 'KTP', name: 'Kishangarh', nhNumber: 'NH48', lat: 26.5833, lon: 74.8667, state: 'Rajasthan', rates: { '16T': 155, '25T': 260, '40T': 430 } },
  { code: 'JDP', name: 'Jaipur-Deoli', nhNumber: 'NH48', lat: 26.3333, lon: 75.8000, state: 'Rajasthan', rates: { '16T': 175, '25T': 290, '40T': 480 } },
  { code: 'SRN', name: 'Sarni', nhNumber: 'NH47', lat: 22.1333, lon: 78.2667, state: 'Madhya Pradesh', rates: { '16T': 140, '25T': 230, '40T': 380 } },
  { code: 'MLW', name: 'Malwa', nhNumber: 'NH47', lat: 22.7167, lon: 76.0500, state: 'Madhya Pradesh', rates: { '16T': 125, '25T': 210, '40T': 350 } },
  { code: 'DVG', name: 'Devgarh', nhNumber: 'NH48', lat: 25.5333, lon: 73.8833, state: 'Rajasthan', rates: { '16T': 150, '25T': 250, '40T': 420 } },
  { code: 'KLP', name: 'Kelapur', nhNumber: 'NH44', lat: 20.1667, lon: 78.5833, state: 'Maharashtra', rates: { '16T': 160, '25T': 270, '40T': 450 } },
  { code: 'WNR', name: 'Wanjarwadi', nhNumber: 'NH44', lat: 19.3333, lon: 77.4167, state: 'Maharashtra', rates: { '16T': 170, '25T': 285, '40T': 475 } },
  { code: 'KPN', name: 'Kapan', nhNumber: 'NH44', lat: 18.5000, lon: 77.0833, state: 'Maharashtra', rates: { '16T': 155, '25T': 260, '40T': 435 } },
  { code: 'NLP', name: 'Nilajpur', nhNumber: 'NH44', lat: 21.0667, lon: 79.1000, state: 'Maharashtra', rates: { '16T': 145, '25T': 245, '40T': 410 } },
];

export function getTollRate(plazaCode: string, vehicleType: '16T' | '25T' | '40T'): number {
  const plaza = NHAI_TOLL_PLAZAS.find(p => p.code === plazaCode);
  return plaza?.rates[vehicleType] || 0;
}

export function getTollPlazasOnRoute(routeGeometry: { lat: number; lon: number }[]): TollPlaza[] {
  const matched: TollPlaza[] = [];
  for (const plaza of NHAI_TOLL_PLAZAS) {
    for (const point of routeGeometry) {
      const dist = Math.sqrt(
        Math.pow(point.lat - plaza.lat, 2) + Math.pow(point.lon - plaza.lon, 2)
      ) * 111;
      if (dist <= 2) {
        matched.push(plaza);
        break;
      }
    }
  }
  return matched;
}
