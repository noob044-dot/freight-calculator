import { TollPlaza } from './toll-engine';

export interface VehicleType {
  code: '16T' | '25T' | '40T';
  name: string;
  maxWeightKg: number;
  baseRatePerKm: number;
}

export interface CommodityFactor {
  code: string;
  name: string;
  factor: number;
  category: string;
}

export type CommodityCode =
  | 'general' | 'auto-parts' | 'pharma' | 'hazardous' | 'perishable'
  | 'odc' | 'steel' | 'textiles' | 'electronics' | 'chemicals'
  | 'fmcg' | 'machinery' | 'furniture' | 'paper' | 'plastic'
  | 'food-grains' | 'pulses' | 'oilseeds' | 'spices' | 'fruits-vegetables'
  | 'dry-fruits' | 'sugar-jaggery' | 'cotton-raw' | 'jute-mesta' | 'tobacco-leaf'
  | 'tea-coffee' | 'rubber-latex' | 'coconut-copra' | 'areca-nut' | 'cashew-nut'
  | 'floriculture' | 'seeds-planting' | 'animal-feed' | 'fertilizers-bulk' | 'pesticides'
  | 'iron-ore' | 'manganese-ore' | 'chrome-ore' | 'bauxite' | 'copper-ore'
  | 'lead-zinc-ore' | 'gold-ore' | 'limestone' | 'dolomite' | 'gypsum'
  | 'coal-thermal' | 'coal-coking' | 'lignite' | 'mica' | 'graphite'
  | 'quartz-silica' | 'feldspar' | 'clay-kaolin' | 'bentonite' | 'rock-phosphate' | 'salt-rock'
  | 'petrol' | 'diesel' | 'kerosene' | 'lpg' | 'atf'
  | 'furnace-oil' | 'lshs' | 'bitumen' | 'lubricants' | 'naphtha' | 'petcoke' | 'wax'
  | 'steel-hr' | 'steel-cr' | 'steel-gp' | 'steel-rebar' | 'steel-structural'
  | 'steel-pipes' | 'steel-wire' | 'stainless-steel' | 'aluminium-ingot' | 'aluminium-extruded'
  | 'copper-cathode' | 'copper-wire' | 'zinc-ingot' | 'lead-ingot' | 'nickel'
  | 'tin-ingot' | 'ferro-alloys' | 'pig-iron' | 'sponge-iron' | 'scrap-metal' | 'scrap-nonferrous'
  | 'cement-ordinary' | 'cement-ppc' | 'cement-slag' | 'cement-white' | 'clinker'
  | 'fly-ash' | 'slag-granulated' | 'rmc' | 'sand' | 'aggregates'
  | 'bricks' | 'blocks-aac' | 'tiles-ceramic' | 'sanitary-ware' | 'pipes-pvc'
  | 'pipes-steel' | 'pipes-hdpe' | 'cement-sheets' | 'roofing-sheets' | 'plywood'
  | 'laminates' | 'glass-float' | 'glass-toughened' | 'paints' | 'adhesives' | 'waterproofing' | 'insulation'
  | 'cotton-yarn' | 'cotton-fabric' | 'synthetic-yarn' | 'synthetic-fabric' | 'denim'
  | 'home-textiles' | 'garments-knitted' | 'garments-woven' | 'hosiery' | 'towels'
  | 'carpets' | 'technical-textiles' | 'jute-products' | 'wool-yarn' | 'silk-yarn' | 'textile-waste'
  | 'auto-engine' | 'auto-transmission' | 'auto-brake' | 'auto-suspension' | 'auto-electrical'
  | 'auto-body' | 'auto-tyres' | 'auto-batteries' | 'auto-glass' | 'auto-filters'
  | 'auto-lubricants' | 'auto-fasteners' | 'auto-bearing' | 'auto-lighting' | 'auto-ac'
  | 'auto-seating' | 'two-wheeler-parts' | 'cv-parts' | 'tractor-parts'
  | 'machine-tools' | 'industrial-machinery' | 'pumps' | 'compressors' | 'generators'
  | 'transformers' | 'electric-motors' | 'gearboxes' | 'bearings-industrial' | 'valves'
  | 'cranes' | 'forklifts' | 'conveyors' | 'packaging-machinery' | 'food-processing-mach'
  | 'textile-machinery' | 'plastic-machinery' | 'printing-machinery' | 'welding-equipment' | 'hand-tools'
  | 'measuring-instruments' | 'hydraulic-equipment' | 'filters-industrial' | 'gaskets-seals' | 'fasteners-industrial'
  | 'consumer-electronics' | 'mobile-phones' | 'computers-it' | 'semiconductors' | 'pcb'
  | 'electronic-components' | 'led-lighting' | 'solar-panels' | 'inverters-ups' | 'batteries-lithium'
  | 'cables-wires' | 'switchgear' | 'meters' | 'sensors' | 'automation-plc'
  | 'drives-vfd' | 'scada-hmi' | 'electrical-fittings' | 'conduits'
  | 'basic-chemicals' | 'organic-chemicals' | 'polymers-resins' | 'specialty-chemicals' | 'dyes-pigments'
  | 'rubber-synthetic' | 'plastics-raw' | 'plastic-products' | 'adhesives-sealants' | 'explosives'
  | 'industrial-gases' | 'refrigerants' | 'solvents' | 'essential-oils'
  | 'pharma-api' | 'pharma-formulations' | 'nutraceuticals' | 'cosmetics-raw' | 'cosmetics-finished'
  | 'detergents' | 'surfactants' | 'water-treatment' | 'construction-chemicals'
  | 'packaged-foods' | 'beverages' | 'alcohol' | 'dairy-products' | 'edible-oils'
  | 'sugar-confectionery' | 'tea-coffee-packaged' | 'spices-packaged' | 'instant-foods' | 'frozen-foods'
  | 'health-supplements' | 'baby-food' | 'pet-food'
  | 'paper-newsprint' | 'paper-writing' | 'paper-kraft' | 'paper-coated' | 'paper-tissue'
  | 'paperboard' | 'corrugated-boxes' | 'cartons-mono' | 'flexible-packaging' | 'plastic-packaging'
  | 'labels-stickers' | 'tape-adhesive' | 'strapping' | 'stretch-film' | 'printing-services'
  | 'furniture-wood' | 'furniture-metal' | 'furniture-plastic' | 'furniture-upholstered' | 'mattresses'
  | 'modular-kitchen' | 'office-furniture' | 'kids-furniture' | 'outdoor-furniture' | 'home-decor'
  | 'lighting-fixtures' | 'kitchen-appliances' | 'small-appliances'
  | 'haz-explosives' | 'haz-gases' | 'haz-flammable-liq' | 'haz-flammable-sol' | 'haz-oxidizing'
  | 'haz-toxic' | 'haz-infectious' | 'haz-radioactive' | 'haz-corrosive' | 'haz-misc'
  | 'haz-batteries-lithium' | 'haz-chemicals' | 'haz-waste'
  | 'containers-new' | 'containers-used' | 'reefer-containers' | 'tank-containers' | 'flat-rack-containers'
  | 'chassis' | 'trailers' | 'warehouse-racking' | 'material-handling' | 'dock-equipment'
  | 'weighbridges' | 'tarpaulins' | 'lashing-equipment' | 'pallets' | 'ibc-totes'
  | 'drums-barrels' | 'fiber-drums' | 'jumbobags' | 'sacks-woven' | 'boxes-corrugated'
  | 'project-cargo' | 'breakbulk' | 'livestock' | 'plants-live' | 'art-antiques'
  | 'jewellery' | 'currency' | 'documents' | 'samples' | 'personal-effects'
  | 'exhibition-goods' | 'returns' | 'refurbished' | 'scrap-general' | 'waste-recyclable';

export interface QuoteInput {
  originPincode: string;
  destPincode: string;
  weightKg: number;
  commodity: CommodityCode;
  vehicleType?: '16T' | '25T' | '40T';
  valueInr?: number;
  dimensions?: { length: number; width: number; height: number };
  containerType?: '20ft_GP' | '40ft_GP' | '40ft_HC' | '20ft_RF' | '40ft_RF';
  incoterm?: 'FOB' | 'CIF' | 'CFR' | 'EXW';
}

export interface QuoteBreakdown {
  baseFreight: number;
  fuelSurcharge: number;
  commodityAdjustment: number;
  tolls: number;
  pickupLastMile: number;
  deliveryLastMile: number;
  entryTax: number;
  insurance: number;
  documentation: number;
}

export interface AirBenchmarks {
  blueDartBA: { baseRate: number; airport: string; provider: string } | null;
  spiceXpress: { netRate: number; flight: string } | null;
  indiGo: { netRate: number; flight: string } | null;
  bomBlrSpecial: { perKg: number; total: number; flight: string } | null;
}

export interface QuoteResult {
  mode: 'road' | 'air' | 'sea' | 'rail';
  distanceKm: number;
  durationHrs: number;
  vehicle: string;
  tollPlazas?: (TollPlaza & { tollAmount: number })[];
  breakdown: QuoteBreakdown;
  total: number;
  perKg: number;
  confidence: number;
  transitDays: number;
  originName: string;
  destName: string;
  benchmarks?: AirBenchmarks;
}

export interface Benchmark {
  freightosIndex: number;
  cogoport: number;
  freightwalla: number;
  delex: number;
  average: number;
  savingsVsAverage: number;
}
