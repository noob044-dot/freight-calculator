import { getPincodeData } from './pincode-db';
import { getTollPlazasOnRoute, getTollRate } from './toll-engine';
import { QuoteInput, QuoteResult, VehicleType, CommodityFactor, CommodityCode } from './types';

export const VEHICLE_TYPES: VehicleType[] = [
  { code: '16T', name: '16 Ton Truck (2 Axle)', maxWeightKg: 9000, baseRatePerKm: 28 },
  { code: '25T', name: '25 Ton Truck (3 Axle)', maxWeightKg: 16000, baseRatePerKm: 35 },
  { code: '40T', name: '40 Ton Trailer (4-6 Axle)', maxWeightKg: 40000, baseRatePerKm: 48 },
];

export const COMMODITY_FACTORS: CommodityFactor[] = [
  { code: 'auto-parts', name: 'Auto Parts', factor: 1.05, category: 'automotive' },
  { code: 'chemicals', name: 'Chemicals', factor: 1.20, category: 'chemicals-pharma' },
  { code: 'electronics', name: 'Electronics', factor: 1.15, category: 'electronics' },
  { code: 'fmcg', name: 'FMCG', factor: 1.00, category: 'fmcg' },
  { code: 'furniture', name: 'Furniture', factor: 1.05, category: 'furniture' },
  { code: 'general', name: 'General Cargo', factor: 1.00, category: 'general-misc' },
  { code: 'hazardous', name: 'Hazardous / DG', factor: 1.35, category: 'hazardous-dg' },
  { code: 'machinery', name: 'Machinery', factor: 1.10, category: 'machinery' },
  { code: 'odc', name: 'Over-Dimensional', factor: 1.50, category: 'general-misc' },
  { code: 'paper', name: 'Paper / Packaging', factor: 0.98, category: 'paper-packaging' },
  { code: 'perishable', name: 'Perishable (F&V)', factor: 1.20, category: 'agricultural' },
  { code: 'pharma', name: 'Pharma / Cold Chain', factor: 1.25, category: 'chemicals-pharma' },
  { code: 'plastic', name: 'Plastic Granules', factor: 1.00, category: 'chemicals-pharma' },
  { code: 'steel', name: 'Steel / Cement', factor: 0.95, category: 'metals-steel' },
  { code: 'textiles', name: 'Textiles', factor: 1.00, category: 'textiles' },
  { code: 'adhesives', name: 'Adhesives', factor: 1.05, category: 'cement-materials' },
  { code: 'adhesives-sealants', name: 'Adhesives & Sealants', factor: 1.05, category: 'chemicals-pharma' },
  { code: 'aggregates', name: 'Aggregates', factor: 0.85, category: 'cement-materials' },
  { code: 'alcohol', name: 'Alcohol', factor: 1.08, category: 'fmcg' },
  { code: 'aluminium-extruded', name: 'Aluminium Extruded', factor: 1.00, category: 'metals-steel' },
  { code: 'aluminium-ingot', name: 'Aluminium Ingot', factor: 0.95, category: 'metals-steel' },
  { code: 'animal-feed', name: 'Animal Feed', factor: 0.95, category: 'agricultural' },
  { code: 'areca-nut', name: 'Areca Nut', factor: 1.00, category: 'agricultural' },
  { code: 'art-antiques', name: 'Art & Antiques', factor: 1.30, category: 'general-misc' },
  { code: 'atf', name: 'ATF (Aviation Fuel)', factor: 1.20, category: 'petroleum' },
  { code: 'auto-ac', name: 'Auto AC Systems', factor: 1.08, category: 'automotive' },
  { code: 'auto-batteries', name: 'Auto Batteries', factor: 1.08, category: 'automotive' },
  { code: 'auto-bearing', name: 'Auto Bearings', factor: 1.05, category: 'automotive' },
  { code: 'auto-body', name: 'Auto Body Parts', factor: 1.05, category: 'automotive' },
  { code: 'auto-brake', name: 'Auto Brake Systems', factor: 1.05, category: 'automotive' },
  { code: 'auto-electrical', name: 'Auto Electrical', factor: 1.08, category: 'automotive' },
  { code: 'auto-engine', name: 'Auto Engines', factor: 1.10, category: 'automotive' },
  { code: 'auto-fasteners', name: 'Auto Fasteners', factor: 1.00, category: 'automotive' },
  { code: 'auto-filters', name: 'Auto Filters', factor: 1.02, category: 'automotive' },
  { code: 'auto-glass', name: 'Auto Glass', factor: 1.10, category: 'automotive' },
  { code: 'auto-lighting', name: 'Auto Lighting', factor: 1.08, category: 'automotive' },
  { code: 'auto-lubricants', name: 'Auto Lubricants', factor: 1.05, category: 'automotive' },
  { code: 'auto-seating', name: 'Auto Seating', factor: 1.05, category: 'automotive' },
  { code: 'auto-suspension', name: 'Auto Suspension', factor: 1.05, category: 'automotive' },
  { code: 'auto-transmission', name: 'Auto Transmissions', factor: 1.10, category: 'automotive' },
  { code: 'auto-tyres', name: 'Auto Tyres', factor: 1.00, category: 'automotive' },
  { code: 'automation-plc', name: 'Automation PLC', factor: 1.15, category: 'electronics' },
  { code: 'baby-food', name: 'Baby Food', factor: 1.10, category: 'fmcg' },
  { code: 'basic-chemicals', name: 'Basic Chemicals', factor: 1.10, category: 'chemicals-pharma' },
  { code: 'batteries-lithium', name: 'Lithium Batteries', factor: 1.25, category: 'electronics' },
  { code: 'bauxite', name: 'Bauxite', factor: 0.90, category: 'minerals-ores' },
  { code: 'bearings-industrial', name: 'Industrial Bearings', factor: 1.05, category: 'machinery' },
  { code: 'bentonite', name: 'Bentonite', factor: 0.85, category: 'minerals-ores' },
  { code: 'beverages', name: 'Beverages', factor: 1.00, category: 'fmcg' },
  { code: 'bitumen', name: 'Bitumen', factor: 1.05, category: 'petroleum' },
  { code: 'blocks-aac', name: 'AAC Blocks', factor: 0.90, category: 'cement-materials' },
  { code: 'boxes-corrugated', name: 'Corrugated Boxes', factor: 0.95, category: 'logistics' },
  { code: 'breakbulk', name: 'Breakbulk', factor: 1.05, category: 'general-misc' },
  { code: 'bricks', name: 'Bricks', factor: 0.88, category: 'cement-materials' },
  { code: 'cables-wires', name: 'Cables & Wires', factor: 1.00, category: 'electronics' },
  { code: 'carpets', name: 'Carpets', factor: 1.05, category: 'textiles' },
  { code: 'cartons-mono', name: 'Mono Cartons', factor: 1.00, category: 'paper-packaging' },
  { code: 'cashew-nut', name: 'Cashew Nut', factor: 1.05, category: 'agricultural' },
  { code: 'cement-ordinary', name: 'Ordinary Portland Cement', factor: 0.95, category: 'cement-materials' },
  { code: 'cement-ppc', name: 'PPC Cement', factor: 0.95, category: 'cement-materials' },
  { code: 'cement-sheets', name: 'Cement Sheets', factor: 0.98, category: 'cement-materials' },
  { code: 'cement-slag', name: 'Slag Cement', factor: 0.95, category: 'cement-materials' },
  { code: 'cement-white', name: 'White Cement', factor: 1.00, category: 'cement-materials' },
  { code: 'chassis', name: 'Chassis', factor: 1.00, category: 'logistics' },
  { code: 'chrome-ore', name: 'Chrome Ore', factor: 0.90, category: 'minerals-ores' },
  { code: 'clay-kaolin', name: 'Clay & Kaolin', factor: 0.85, category: 'minerals-ores' },
  { code: 'clinker', name: 'Clinker', factor: 0.88, category: 'cement-materials' },
  { code: 'coal-coking', name: 'Coking Coal', factor: 0.90, category: 'minerals-ores' },
  { code: 'coal-thermal', name: 'Thermal Coal', factor: 0.88, category: 'minerals-ores' },
  { code: 'coconut-copra', name: 'Coconut & Copra', factor: 0.98, category: 'agricultural' },
  { code: 'compressors', name: 'Compressors', factor: 1.10, category: 'machinery' },
  { code: 'computers-it', name: 'Computers & IT Hardware', factor: 1.15, category: 'electronics' },
  { code: 'conduits', name: 'Conduits', factor: 1.00, category: 'electronics' },
  { code: 'construction-chemicals', name: 'Construction Chemicals', factor: 1.10, category: 'chemicals-pharma' },
  { code: 'consumer-electronics', name: 'Consumer Electronics', factor: 1.15, category: 'electronics' },
  { code: 'containers-new', name: 'New Containers', factor: 1.05, category: 'logistics' },
  { code: 'containers-used', name: 'Used Containers', factor: 1.00, category: 'logistics' },
  { code: 'conveyors', name: 'Conveyors', factor: 1.10, category: 'machinery' },
  { code: 'copper-cathode', name: 'Copper Cathode', factor: 1.00, category: 'metals-steel' },
  { code: 'copper-ore', name: 'Copper Ore', factor: 0.95, category: 'minerals-ores' },
  { code: 'copper-wire', name: 'Copper Wire', factor: 1.00, category: 'metals-steel' },
  { code: 'corrugated-boxes', name: 'Corrugated Boxes', factor: 0.95, category: 'paper-packaging' },
  { code: 'cosmetics-finished', name: 'Finished Cosmetics', factor: 1.15, category: 'chemicals-pharma' },
  { code: 'cosmetics-raw', name: 'Cosmetics Raw Material', factor: 1.10, category: 'chemicals-pharma' },
  { code: 'cotton-fabric', name: 'Cotton Fabric', factor: 1.00, category: 'textiles' },
  { code: 'cotton-raw', name: 'Raw Cotton', factor: 0.95, category: 'agricultural' },
  { code: 'cotton-yarn', name: 'Cotton Yarn', factor: 1.00, category: 'textiles' },
  { code: 'cranes', name: 'Cranes', factor: 1.20, category: 'machinery' },
  { code: 'currency', name: 'Currency', factor: 1.30, category: 'general-misc' },
  { code: 'cv-parts', name: 'Commercial Vehicle Parts', factor: 1.05, category: 'automotive' },
  { code: 'dairy-products', name: 'Dairy Products', factor: 1.15, category: 'fmcg' },
  { code: 'denim', name: 'Denim', factor: 1.02, category: 'textiles' },
  { code: 'detergents', name: 'Detergents', factor: 1.00, category: 'chemicals-pharma' },
  { code: 'diesel', name: 'Diesel', factor: 1.20, category: 'petroleum' },
  { code: 'dock-equipment', name: 'Dock Equipment', factor: 1.10, category: 'logistics' },
  { code: 'documents', name: 'Documents', factor: 1.10, category: 'general-misc' },
  { code: 'dolomite', name: 'Dolomite', factor: 0.85, category: 'minerals-ores' },
  { code: 'drives-vfd', name: 'VFD Drives', factor: 1.15, category: 'electronics' },
  { code: 'drums-barrels', name: 'Drums & Barrels', factor: 1.00, category: 'logistics' },
  { code: 'dry-fruits', name: 'Dry Fruits', factor: 1.10, category: 'agricultural' },
  { code: 'dyes-pigments', name: 'Dyes & Pigments', factor: 1.10, category: 'chemicals-pharma' },
  { code: 'edible-oils', name: 'Edible Oils', factor: 1.00, category: 'fmcg' },
  { code: 'electric-motors', name: 'Electric Motors', factor: 1.10, category: 'machinery' },
  { code: 'electrical-fittings', name: 'Electrical Fittings', factor: 1.00, category: 'electronics' },
  { code: 'electronic-components', name: 'Electronic Components', factor: 1.15, category: 'electronics' },
  { code: 'essential-oils', name: 'Essential Oils', factor: 1.10, category: 'chemicals-pharma' },
  { code: 'exhibition-goods', name: 'Exhibition Goods', factor: 1.15, category: 'general-misc' },
  { code: 'explosives', name: 'Industrial Explosives', factor: 1.40, category: 'chemicals-pharma' },
  { code: 'fasteners-industrial', name: 'Industrial Fasteners', factor: 1.00, category: 'machinery' },
  { code: 'feldspar', name: 'Feldspar', factor: 0.85, category: 'minerals-ores' },
  { code: 'ferro-alloys', name: 'Ferro Alloys', factor: 0.98, category: 'metals-steel' },
  { code: 'fertilizers-bulk', name: 'Fertilizers (Bulk)', factor: 0.90, category: 'agricultural' },
  { code: 'fiber-drums', name: 'Fiber Drums', factor: 1.00, category: 'logistics' },
  { code: 'filters-industrial', name: 'Industrial Filters', factor: 1.05, category: 'machinery' },
  { code: 'flat-rack-containers', name: 'Flat Rack Containers', factor: 1.10, category: 'logistics' },
  { code: 'flexible-packaging', name: 'Flexible Packaging', factor: 1.02, category: 'paper-packaging' },
  { code: 'floriculture', name: 'Floriculture', factor: 1.15, category: 'agricultural' },
  { code: 'fly-ash', name: 'Fly Ash', factor: 0.88, category: 'cement-materials' },
  { code: 'food-grains', name: 'Food Grains', factor: 0.95, category: 'agricultural' },
  { code: 'food-processing-mach', name: 'Food Processing Machinery', factor: 1.10, category: 'machinery' },
  { code: 'forklifts', name: 'Forklifts', factor: 1.15, category: 'machinery' },
  { code: 'frozen-foods', name: 'Frozen Foods', factor: 1.15, category: 'fmcg' },
  { code: 'fruits-vegetables', name: 'Fruits & Vegetables', factor: 1.15, category: 'agricultural' },
  { code: 'furnace-oil', name: 'Furnace Oil', factor: 1.15, category: 'petroleum' },
  { code: 'furniture-metal', name: 'Metal Furniture', factor: 1.05, category: 'furniture' },
  { code: 'furniture-plastic', name: 'Plastic Furniture', factor: 1.00, category: 'furniture' },
  { code: 'furniture-upholstered', name: 'Upholstered Furniture', factor: 1.15, category: 'furniture' },
  { code: 'furniture-wood', name: 'Wooden Furniture', factor: 1.10, category: 'furniture' },
  { code: 'garments-knitted', name: 'Knitted Garments', factor: 1.05, category: 'textiles' },
  { code: 'garments-woven', name: 'Woven Garments', factor: 1.05, category: 'textiles' },
  { code: 'gaskets-seals', name: 'Gaskets & Seals', factor: 1.00, category: 'machinery' },
  { code: 'gearboxes', name: 'Gearboxes', factor: 1.10, category: 'machinery' },
  { code: 'generators', name: 'Generators', factor: 1.10, category: 'machinery' },
  { code: 'glass-float', name: 'Float Glass', factor: 1.10, category: 'cement-materials' },
  { code: 'glass-toughened', name: 'Toughened Glass', factor: 1.10, category: 'cement-materials' },
  { code: 'gold-ore', name: 'Gold Ore', factor: 1.10, category: 'minerals-ores' },
  { code: 'graphite', name: 'Graphite', factor: 0.95, category: 'minerals-ores' },
  { code: 'gypsum', name: 'Gypsum', factor: 0.85, category: 'minerals-ores' },
  { code: 'hand-tools', name: 'Hand Tools', factor: 1.00, category: 'machinery' },
  { code: 'haz-batteries-lithium', name: 'Lithium Batteries (DG)', factor: 1.40, category: 'hazardous-dg' },
  { code: 'haz-chemicals', name: 'Hazardous Chemicals', factor: 1.35, category: 'hazardous-dg' },
  { code: 'haz-corrosive', name: 'Haz Class 8 - Corrosive', factor: 1.35, category: 'hazardous-dg' },
  { code: 'haz-explosives', name: 'Haz Class 1 - Explosives', factor: 1.50, category: 'hazardous-dg' },
  { code: 'haz-flammable-liq', name: 'Haz Class 3 - Flammable Liquids', factor: 1.35, category: 'hazardous-dg' },
  { code: 'haz-flammable-sol', name: 'Haz Class 4 - Flammable Solids', factor: 1.35, category: 'hazardous-dg' },
  { code: 'haz-gases', name: 'Haz Class 2 - Gases', factor: 1.40, category: 'hazardous-dg' },
  { code: 'haz-infectious', name: 'Haz Class 6 - Infectious', factor: 1.45, category: 'hazardous-dg' },
  { code: 'haz-misc', name: 'Haz Class 9 - Misc DG', factor: 1.30, category: 'hazardous-dg' },
  { code: 'haz-oxidizing', name: 'Haz Class 5 - Oxidizing', factor: 1.40, category: 'hazardous-dg' },
  { code: 'haz-radioactive', name: 'Haz Class 7 - Radioactive', factor: 1.50, category: 'hazardous-dg' },
  { code: 'haz-toxic', name: 'Haz Class 6 - Toxic', factor: 1.40, category: 'hazardous-dg' },
  { code: 'haz-waste', name: 'Hazardous Waste', factor: 1.40, category: 'hazardous-dg' },
  { code: 'health-supplements', name: 'Health Supplements', factor: 1.10, category: 'fmcg' },
  { code: 'home-decor', name: 'Home Decor', factor: 1.10, category: 'furniture' },
  { code: 'home-textiles', name: 'Home Textiles', factor: 1.02, category: 'textiles' },
  { code: 'hosiery', name: 'Hosiery', factor: 1.00, category: 'textiles' },
  { code: 'hydraulic-equipment', name: 'Hydraulic Equipment', factor: 1.10, category: 'machinery' },
  { code: 'ibc-totes', name: 'IBC Totes', factor: 1.00, category: 'logistics' },
  { code: 'industrial-gases', name: 'Industrial Gases', factor: 1.25, category: 'chemicals-pharma' },
  { code: 'industrial-machinery', name: 'Industrial Machinery', factor: 1.10, category: 'machinery' },
  { code: 'instant-foods', name: 'Instant Foods', factor: 1.02, category: 'fmcg' },
  { code: 'insulation', name: 'Insulation Material', factor: 1.10, category: 'cement-materials' },
  { code: 'inverters-ups', name: 'Inverters & UPS', factor: 1.10, category: 'electronics' },
  { code: 'iron-ore', name: 'Iron Ore', factor: 0.90, category: 'minerals-ores' },
  { code: 'jewellery', name: 'Jewellery', factor: 1.30, category: 'general-misc' },
  { code: 'jumbobags', name: 'Jumbo Bags / FIBC', factor: 0.98, category: 'logistics' },
  { code: 'jute-mesta', name: 'Jute & Mesta', factor: 0.95, category: 'agricultural' },
  { code: 'jute-products', name: 'Jute Products', factor: 0.98, category: 'textiles' },
  { code: 'kerosene', name: 'Kerosene', factor: 1.15, category: 'petroleum' },
  { code: 'kids-furniture', name: 'Kids\' Furniture', factor: 1.10, category: 'furniture' },
  { code: 'kitchen-appliances', name: 'Kitchen Appliances', factor: 1.10, category: 'furniture' },
  { code: 'labels-stickers', name: 'Labels & Stickers', factor: 1.05, category: 'paper-packaging' },
  { code: 'laminates', name: 'Laminates', factor: 1.05, category: 'cement-materials' },
  { code: 'lashing-equipment', name: 'Lashing Equipment', factor: 1.00, category: 'logistics' },
  { code: 'lead-ingot', name: 'Lead Ingot', factor: 0.95, category: 'metals-steel' },
  { code: 'lead-zinc-ore', name: 'Lead & Zinc Ore', factor: 0.90, category: 'minerals-ores' },
  { code: 'led-lighting', name: 'LED Lighting', factor: 1.10, category: 'electronics' },
  { code: 'lighting-fixtures', name: 'Lighting Fixtures', factor: 1.08, category: 'furniture' },
  { code: 'lignite', name: 'Lignite', factor: 0.88, category: 'minerals-ores' },
  { code: 'limestone', name: 'Limestone', factor: 0.85, category: 'minerals-ores' },
  { code: 'livestock', name: 'Livestock', factor: 1.25, category: 'general-misc' },
  { code: 'lpg', name: 'LPG', factor: 1.25, category: 'petroleum' },
  { code: 'lshs', name: 'LSHS', factor: 1.10, category: 'petroleum' },
  { code: 'lubricants', name: 'Lubricants', factor: 1.10, category: 'petroleum' },
  { code: 'machine-tools', name: 'Machine Tools', factor: 1.10, category: 'machinery' },
  { code: 'manganese-ore', name: 'Manganese Ore', factor: 0.90, category: 'minerals-ores' },
  { code: 'material-handling', name: 'Material Handling Equipment', factor: 1.10, category: 'logistics' },
  { code: 'mattresses', name: 'Mattresses', factor: 1.10, category: 'furniture' },
  { code: 'measuring-instruments', name: 'Measuring Instruments', factor: 1.10, category: 'machinery' },
  { code: 'meters', name: 'Meters', factor: 1.10, category: 'electronics' },
  { code: 'mica', name: 'Mica', factor: 0.95, category: 'minerals-ores' },
  { code: 'mobile-phones', name: 'Mobile Phones', factor: 1.20, category: 'electronics' },
  { code: 'modular-kitchen', name: 'Modular Kitchen', factor: 1.15, category: 'furniture' },
  { code: 'naphtha', name: 'Naphtha', factor: 1.20, category: 'petroleum' },
  { code: 'nickel', name: 'Nickel', factor: 1.05, category: 'metals-steel' },
  { code: 'nutraceuticals', name: 'Nutraceuticals', factor: 1.20, category: 'chemicals-pharma' },
  { code: 'office-furniture', name: 'Office Furniture', factor: 1.05, category: 'furniture' },
  { code: 'oilseeds', name: 'Oilseeds', factor: 0.98, category: 'agricultural' },
  { code: 'organic-chemicals', name: 'Organic Chemicals', factor: 1.15, category: 'chemicals-pharma' },
  { code: 'outdoor-furniture', name: 'Outdoor Furniture', factor: 1.05, category: 'furniture' },
  { code: 'packaged-foods', name: 'Packaged Foods', factor: 1.00, category: 'fmcg' },
  { code: 'packaging-machinery', name: 'Packaging Machinery', factor: 1.10, category: 'machinery' },
  { code: 'paints', name: 'Paints', factor: 1.05, category: 'cement-materials' },
  { code: 'pallets', name: 'Pallets', factor: 0.98, category: 'logistics' },
  { code: 'paper-coated', name: 'Coated Paper', factor: 1.00, category: 'paper-packaging' },
  { code: 'paper-kraft', name: 'Kraft Paper', factor: 0.95, category: 'paper-packaging' },
  { code: 'paper-newsprint', name: 'Newsprint Paper', factor: 0.95, category: 'paper-packaging' },
  { code: 'paper-tissue', name: 'Tissue Paper', factor: 1.05, category: 'paper-packaging' },
  { code: 'paper-writing', name: 'Writing Paper', factor: 0.98, category: 'paper-packaging' },
  { code: 'paperboard', name: 'Paperboard', factor: 0.98, category: 'paper-packaging' },
  { code: 'pcb', name: 'PCBs', factor: 1.15, category: 'electronics' },
  { code: 'personal-effects', name: 'Personal Effects', factor: 1.10, category: 'general-misc' },
  { code: 'pesticides', name: 'Pesticides', factor: 1.20, category: 'agricultural' },
  { code: 'pet-food', name: 'Pet Food', factor: 1.05, category: 'fmcg' },
  { code: 'petcoke', name: 'Petroleum Coke', factor: 1.00, category: 'petroleum' },
  { code: 'petrol', name: 'Petrol', factor: 1.20, category: 'petroleum' },
  { code: 'pharma-api', name: 'Pharma APIs', factor: 1.25, category: 'chemicals-pharma' },
  { code: 'pharma-formulations', name: 'Pharma Formulations', factor: 1.25, category: 'chemicals-pharma' },
  { code: 'pig-iron', name: 'Pig Iron', factor: 0.92, category: 'metals-steel' },
  { code: 'pipes-hdpe', name: 'HDPE Pipes', factor: 1.00, category: 'cement-materials' },
  { code: 'pipes-pvc', name: 'PVC Pipes', factor: 1.00, category: 'cement-materials' },
  { code: 'pipes-steel', name: 'Steel Pipes (Line)', factor: 1.00, category: 'cement-materials' },
  { code: 'plants-live', name: 'Live Plants', factor: 1.20, category: 'general-misc' },
  { code: 'plastic-machinery', name: 'Plastic Machinery', factor: 1.08, category: 'machinery' },
  { code: 'plastic-packaging', name: 'Plastic Packaging', factor: 1.00, category: 'paper-packaging' },
  { code: 'plastic-products', name: 'Plastic Products', factor: 1.00, category: 'chemicals-pharma' },
  { code: 'plastics-raw', name: 'Plastic Raw Material', factor: 1.00, category: 'chemicals-pharma' },
  { code: 'plywood', name: 'Plywood', factor: 1.00, category: 'cement-materials' },
  { code: 'polymers-resins', name: 'Polymers & Resins', factor: 1.05, category: 'chemicals-pharma' },
  { code: 'printing-machinery', name: 'Printing Machinery', factor: 1.10, category: 'machinery' },
  { code: 'printing-services', name: 'Printing Services', factor: 1.02, category: 'paper-packaging' },
  { code: 'project-cargo', name: 'Project Cargo', factor: 1.20, category: 'general-misc' },
  { code: 'pulses', name: 'Pulses', factor: 0.98, category: 'agricultural' },
  { code: 'pumps', name: 'Pumps', factor: 1.05, category: 'machinery' },
  { code: 'quartz-silica', name: 'Quartz & Silica', factor: 0.90, category: 'minerals-ores' },
  { code: 'reefer-containers', name: 'Reefer Containers', factor: 1.20, category: 'logistics' },
  { code: 'refrigerants', name: 'Refrigerants', factor: 1.20, category: 'chemicals-pharma' },
  { code: 'refurbished', name: 'Refurbished Goods', factor: 1.05, category: 'general-misc' },
  { code: 'returns', name: 'Return Goods', factor: 1.05, category: 'general-misc' },
  { code: 'rmc', name: 'Ready-Mix Concrete', factor: 1.05, category: 'cement-materials' },
  { code: 'rock-phosphate', name: 'Rock Phosphate', factor: 0.88, category: 'minerals-ores' },
  { code: 'roofing-sheets', name: 'Roofing Sheets', factor: 0.98, category: 'cement-materials' },
  { code: 'rubber-latex', name: 'Rubber Latex', factor: 1.00, category: 'agricultural' },
  { code: 'rubber-synthetic', name: 'Synthetic Rubber', factor: 1.00, category: 'chemicals-pharma' },
  { code: 'sacks-woven', name: 'Woven Sacks', factor: 0.95, category: 'logistics' },
  { code: 'salt-rock', name: 'Rock Salt', factor: 0.85, category: 'minerals-ores' },
  { code: 'samples', name: 'Samples', factor: 1.05, category: 'general-misc' },
  { code: 'sand', name: 'Sand', factor: 0.85, category: 'cement-materials' },
  { code: 'sanitary-ware', name: 'Sanitary Ware', factor: 1.05, category: 'cement-materials' },
  { code: 'scada-hmi', name: 'SCADA / HMI', factor: 1.15, category: 'electronics' },
  { code: 'scrap-general', name: 'General Scrap', factor: 0.90, category: 'general-misc' },
  { code: 'scrap-metal', name: 'Metal Scrap', factor: 0.90, category: 'metals-steel' },
  { code: 'scrap-nonferrous', name: 'Non-Ferrous Scrap', factor: 0.92, category: 'metals-steel' },
  { code: 'seeds-planting', name: 'Seeds & Planting Material', factor: 1.05, category: 'agricultural' },
  { code: 'semiconductors', name: 'Semiconductors', factor: 1.20, category: 'electronics' },
  { code: 'sensors', name: 'Sensors', factor: 1.15, category: 'electronics' },
  { code: 'silk-yarn', name: 'Silk Yarn', factor: 1.05, category: 'textiles' },
  { code: 'slag-granulated', name: 'Granulated Slag', factor: 0.88, category: 'cement-materials' },
  { code: 'small-appliances', name: 'Small Appliances', factor: 1.08, category: 'furniture' },
  { code: 'solar-panels', name: 'Solar Panels', factor: 1.10, category: 'electronics' },
  { code: 'solvents', name: 'Solvents', factor: 1.15, category: 'chemicals-pharma' },
  { code: 'specialty-chemicals', name: 'Specialty Chemicals', factor: 1.15, category: 'chemicals-pharma' },
  { code: 'spices', name: 'Spices', factor: 1.05, category: 'agricultural' },
  { code: 'spices-packaged', name: 'Packaged Spices', factor: 1.02, category: 'fmcg' },
  { code: 'sponge-iron', name: 'Sponge Iron', factor: 0.92, category: 'metals-steel' },
  { code: 'stainless-steel', name: 'Stainless Steel', factor: 1.05, category: 'metals-steel' },
  { code: 'steel-cr', name: 'Steel CR Coils', factor: 0.95, category: 'metals-steel' },
  { code: 'steel-gp', name: 'Steel GP / GC Sheets', factor: 0.95, category: 'metals-steel' },
  { code: 'steel-hr', name: 'Steel HR Coils', factor: 0.95, category: 'metals-steel' },
  { code: 'steel-pipes', name: 'Steel Pipes & Tubes', factor: 1.00, category: 'metals-steel' },
  { code: 'steel-rebar', name: 'Steel Rebar / TMT', factor: 0.95, category: 'metals-steel' },
  { code: 'steel-structural', name: 'Steel Structural', factor: 0.98, category: 'metals-steel' },
  { code: 'steel-wire', name: 'Steel Wire', factor: 1.00, category: 'metals-steel' },
  { code: 'strapping', name: 'Strapping Material', factor: 0.98, category: 'paper-packaging' },
  { code: 'stretch-film', name: 'Stretch Film', factor: 1.00, category: 'paper-packaging' },
  { code: 'sugar-confectionery', name: 'Sugar & Confectionery', factor: 1.00, category: 'fmcg' },
  { code: 'sugar-jaggery', name: 'Sugar & Jaggery', factor: 0.95, category: 'agricultural' },
  { code: 'surfactants', name: 'Surfactants', factor: 1.05, category: 'chemicals-pharma' },
  { code: 'switchgear', name: 'Switchgear', factor: 1.10, category: 'electronics' },
  { code: 'synthetic-fabric', name: 'Synthetic Fabric', factor: 1.00, category: 'textiles' },
  { code: 'synthetic-yarn', name: 'Synthetic Yarn', factor: 1.00, category: 'textiles' },
  { code: 'tank-containers', name: 'Tank Containers', factor: 1.15, category: 'logistics' },
  { code: 'tape-adhesive', name: 'Adhesive Tape', factor: 1.00, category: 'paper-packaging' },
  { code: 'tarpaulins', name: 'Tarpaulins', factor: 1.00, category: 'logistics' },
  { code: 'tea-coffee', name: 'Tea & Coffee', factor: 1.05, category: 'agricultural' },
  { code: 'tea-coffee-packaged', name: 'Packaged Tea & Coffee', factor: 1.02, category: 'fmcg' },
  { code: 'technical-textiles', name: 'Technical Textiles', factor: 1.08, category: 'textiles' },
  { code: 'textile-machinery', name: 'Textile Machinery', factor: 1.08, category: 'machinery' },
  { code: 'textile-waste', name: 'Textile Waste', factor: 0.95, category: 'textiles' },
  { code: 'tiles-ceramic', name: 'Ceramic Tiles', factor: 1.00, category: 'cement-materials' },
  { code: 'tin-ingot', name: 'Tin Ingot', factor: 1.00, category: 'metals-steel' },
  { code: 'tobacco-leaf', name: 'Tobacco Leaf', factor: 1.00, category: 'agricultural' },
  { code: 'towels', name: 'Towels', factor: 1.00, category: 'textiles' },
  { code: 'tractor-parts', name: 'Tractor Parts', factor: 1.05, category: 'automotive' },
  { code: 'trailers', name: 'Trailers', factor: 1.05, category: 'logistics' },
  { code: 'transformers', name: 'Transformers', factor: 1.15, category: 'machinery' },
  { code: 'two-wheeler-parts', name: 'Two-Wheeler Parts', factor: 1.05, category: 'automotive' },
  { code: 'valves', name: 'Valves', factor: 1.05, category: 'machinery' },
  { code: 'warehouse-racking', name: 'Warehouse Racking', factor: 1.05, category: 'logistics' },
  { code: 'waste-recyclable', name: 'Recyclable Waste', factor: 0.90, category: 'general-misc' },
  { code: 'water-treatment', name: 'Water Treatment Chemicals', factor: 1.10, category: 'chemicals-pharma' },
  { code: 'waterproofing', name: 'Waterproofing Material', factor: 1.05, category: 'cement-materials' },
  { code: 'wax', name: 'Wax', factor: 1.00, category: 'petroleum' },
  { code: 'weighbridges', name: 'Weighbridges', factor: 1.15, category: 'logistics' },
  { code: 'welding-equipment', name: 'Welding Equipment', factor: 1.05, category: 'machinery' },
  { code: 'wool-yarn', name: 'Wool Yarn', factor: 1.02, category: 'textiles' },
  { code: 'zinc-ingot', name: 'Zinc Ingot', factor: 0.95, category: 'metals-steel' },
];

// O(1) lookup map by commodity code
export const COMMODITY_MAP = {} as Record<CommodityCode, CommodityFactor>;
COMMODITY_FACTORS.forEach(c => { COMMODITY_MAP[c.code as CommodityCode] = c; });

// Search commodities by partial code or name (case-insensitive)
export function searchCommodities(query: string): CommodityFactor[] {
  const q = query.toLowerCase();
  return COMMODITY_FACTORS.filter(c =>
    c.code.includes(q) || c.name.toLowerCase().includes(q) || c.category.includes(q)
  );
}

const FUEL_SURCHARGE_PCT = 0.18;
const DOCUMENTATION_FEE = 500;
const INSURANCE_RATE = 0.003;
const MIN_INSURANCE = 500;

const LAST_MILE_RATES: Record<string, { firstKg: number; addKg: number; min: number }> = {
  'A': { firstKg: 45, addKg: 15, min: 250 },
  'B': { firstKg: 55, addKg: 20, min: 300 },
  'C': { firstKg: 70, addKg: 25, min: 400 },
  'D': { firstKg: 90, addKg: 35, min: 500 },
  'E': { firstKg: 120, addKg: 50, min: 800 },
};

const ENTRY_TAX_RATES: Record<string, { fixed: number; pctOfFreight: number; max?: number }> = {
  'Maharashtra': { fixed: 0, pctOfFreight: 0.01, max: 5000 },
  'Gujarat': { fixed: 200, pctOfFreight: 0 },
  'Uttar Pradesh': { fixed: 150, pctOfFreight: 0.005 },
  'Delhi': { fixed: 0, pctOfFreight: 0 },
  'Rajasthan': { fixed: 100, pctOfFreight: 0 },
  'Madhya Pradesh': { fixed: 100, pctOfFreight: 0 },
  'Karnataka': { fixed: 150, pctOfFreight: 0 },
  'Tamil Nadu': { fixed: 100, pctOfFreight: 0 },
  'Telangana': { fixed: 100, pctOfFreight: 0 },
  'West Bengal': { fixed: 100, pctOfFreight: 0 },
  'Haryana': { fixed: 100, pctOfFreight: 0 },
};

async function fetchOSRMRoute(origin: { lat: number; lon: number }, dest: { lat: number; lon: number }) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM routing failed');
  const data = await res.json();
  const route = data.routes[0];
  return {
    distanceKm: route.distance / 1000,
    durationHrs: route.duration / 3600,
    geometry: route.geometry.coordinates.map((c: number[]) => ({ lat: c[1], lon: c[0] })),
  };
}

function selectVehicle(weightKg: number, preferredType?: '16T' | '25T' | '40T'): VehicleType {
  if (preferredType) {
    return VEHICLE_TYPES.find(v => v.code === preferredType) || VEHICLE_TYPES[0];
  }
  if (weightKg <= 9000) return VEHICLE_TYPES[0];
  if (weightKg <= 16000) return VEHICLE_TYPES[1];
  return VEHICLE_TYPES[2];
}

function calcLastMile(zone: string, weightKg: number): number {
  const rate = LAST_MILE_RATES[zone] || LAST_MILE_RATES['C'];
  const kg = Math.max(weightKg / 1000, 0.5);
  return rate.min + Math.max(0, kg - 1) * rate.addKg;
}

function calcEntryTax(destState: string, freightPlusTolls: number): number {
  const rule = ENTRY_TAX_RATES[destState] || { fixed: 0, pctOfFreight: 0 };
  return rule.fixed + freightPlusTolls * rule.pctOfFreight;
}

export async function calculateRoadFTL(input: QuoteInput): Promise<QuoteResult> {
  const origin = getPincodeData(input.originPincode);
  const dest = getPincodeData(input.destPincode);
  
  if (!origin || !dest) {
    throw new Error('Invalid pincode(s)');
  }

  const vehicle = selectVehicle(input.weightKg, input.vehicleType);
  const commodity = COMMODITY_FACTORS.find(c => c.code === input.commodity) || COMMODITY_FACTORS[0];
  
  const route = await fetchOSRMRoute(
    { lat: origin.lat, lon: origin.lon },
    { lat: dest.lat, lon: dest.lon }
  );

  const tollPlazas = getTollPlazasOnRoute(route.geometry);
  const totalToll = tollPlazas.reduce((sum, p) => sum + getTollRate(p.code, vehicle.code), 0);
  const tollPlazasWithAmount = tollPlazas.map(p => ({ 
    ...p, 
    tollAmount: getTollRate(p.code, vehicle.code) 
  }));

  const baseFreight = route.distanceKm * vehicle.baseRatePerKm;
  const fuelSurcharge = baseFreight * FUEL_SURCHARGE_PCT;
  const commodityAdjustment = baseFreight * (commodity.factor - 1);
  const pickupLastMile = calcLastMile(origin.deliveryZone, input.weightKg);
  const deliveryLastMile = calcLastMile(dest.deliveryZone, input.weightKg);
  const entryTax = calcEntryTax(dest.state, baseFreight + totalToll);
  const insurance = input.valueInr ? Math.max(MIN_INSURANCE, input.valueInr * INSURANCE_RATE) : 0;
  
  const total = baseFreight + fuelSurcharge + commodityAdjustment + totalToll + 
                pickupLastMile + deliveryLastMile + entryTax + insurance + DOCUMENTATION_FEE;
  
  const transitDays = Math.ceil(route.durationHrs / 8);

  return {
    mode: 'road',
    distanceKm: Math.round(route.distanceKm * 10) / 10,
    durationHrs: Math.round(route.durationHrs * 10) / 10,
    vehicle: vehicle.name,
    tollPlazas: tollPlazasWithAmount,
    breakdown: {
      baseFreight: Math.round(baseFreight),
      fuelSurcharge: Math.round(fuelSurcharge),
      commodityAdjustment: Math.round(commodityAdjustment),
      tolls: Math.round(totalToll),
      pickupLastMile: Math.round(pickupLastMile),
      deliveryLastMile: Math.round(deliveryLastMile),
      entryTax: Math.round(entryTax),
      insurance: Math.round(insurance),
      documentation: DOCUMENTATION_FEE,
    },
    total: Math.round(total),
    perKg: Math.round((total / input.weightKg) * 100) / 100,
    confidence: 0.97,
    transitDays,
    originName: `${origin.district}, ${origin.state}`,
    destName: `${dest.district}, ${dest.state}`,
  };
}
