import pandas as pd
import json

# Read the Excel file
df = pd.read_excel(r'C:\Users\Viknesh\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\507C2D892AD57F57B09B51FCDBC2A44C82C872A2\transfers\2026-27\pincode.xlsx', engine='openpyxl')

df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce')
df['Longitude'] = pd.to_numeric(df['Longitude'], errors='coerce')

pincode_agg = df.groupby('Pincode').agg({
    'District': 'first',
    'StateName': 'first',
    'Latitude': 'mean',
    'Longitude': 'mean',
}).reset_index()

pincode_agg.columns = ['pincode', 'district', 'state', 'lat', 'lon']
pincode_agg['lat'] = pincode_agg['lat'].round(6)
pincode_agg['lon'] = pincode_agg['lon'].round(6)
pincode_agg = pincode_agg.dropna(subset=['lat', 'lon'])
pincode_agg['pincode'] = pincode_agg['pincode'].astype(str).str.zfill(6)

# Better delivery zone classification
metro_districts = {
    'mumbai', 'mumbai suburban', 'delhi', 'new delhi', 'central delhi', 'north delhi', 'south delhi', 'east delhi', 'west delhi',
    'bangalore', 'bengaluru', 'bangalore urban', 'bangalore rural',
    'chennai', 'kolkata', 'hyderabad', 'ghmc (hyd)', 'secunderabad',
    'ahmedabad', 'pune', 'surat', 'jaipur', 'lucknow', 'kanpur',
    'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'vadodara',
    'faridabad', 'ghaziabad', 'gurgaon', 'gurugram', 'noida', 'greater noida'
}

tier1_districts = {
    'coimbatore', 'madurai', 'tiruchirappalli', 'salem', 'erode', 'tirupur', 'vellore',
    'jodhpur', 'kota', 'ajmer', 'bikaner', 'udaipur',
    'rajkot', 'jamnagar', 'bhavnagar', 'gandhinagar', 'junagadh',
    'mysore', 'mysuru', 'hubli', 'dharwad', 'belgaum', 'mangalore',
    'cochin', 'kochi', 'ernakulam', 'thiruvananthapuram', 'kozhikode',
    'guwahati', 'dibrugarh', 'jamshedpur', 'dhanbad', 'bokaro', 'ranchi',
    'raipur', 'bhilai', 'bilaspur', 'korba',
    'amritsar', 'ludhiana', 'jalandhar', 'patiala',
    'allahabad', 'prayagraj', 'varanasi', 'gorakhpur', 'bareilly', 'moradabad',
    'dehradun', 'haridwar',
    'chandigarh', 'panchkula', 'mohali', 'sas nagar'
}

industrial_districts = {
    'mumbai', 'mumbai suburban', 'thane', 'raigad', 'pune', 'nashik', 'aurangabad', 'nagpur',
    'ahmedabad', 'vadodara', 'surat', 'rajkot', 'jamnagar', 'bhavnagar', 'ankleshwar', 'vapi', 'dahej',
    'chennai', 'kanchipuram', 'tiruvallur', 'coimbatore', 'tirupur', 'erode', 'hosur', 'sriperumbudur',
    'bangalore', 'bengaluru', 'bangalore urban', 'mysuru', 'hubli', 'dharwad', 'peenya', 'bommasandra',
    'hyderabad', 'rangareddy', 'medchal', 'sangareddy', 'jeedimetla', 'pashamylaram',
    'kolkata', 'howrah', 'north 24 parganas', 'south 24 parganas', 'hooghly',
    'delhi', 'new delhi', 'central delhi', 'north delhi', 'south delhi', 'east delhi', 'west delhi',
    'gurgaon', 'gurugram', 'faridabad', 'ghaziabad', 'noida', 'greater noida',
    'jaipur', 'jodhpur', 'udaipur', 'kota', 'bhiwadi', 'neemrana',
    'lucknow', 'kanpur', 'unnao', 'agra', 'varanasi',
    'visakhapatnam', 'vijayawada', 'guntur', 'nellore',
    'coimbatore', 'tirupur', 'erode', 'salem', 'hosur',
    'jamshedpur', 'dhanbad', 'bokaro', 'ramgarh',
    'raipur', 'bhilai', 'durg', 'korba', 'bilaspur'
}

state_to_port = {
    'MAHARASHTRA': 'JNPT', 'GUJARAT': 'MUNDRA', 'TAMIL NADU': 'CHENNAI',
    'ANDHRA PRADESH': 'VISAKHAPATNAM', 'ODISHA': 'PARADIP', 'WEST BENGAL': 'KOLKATA',
    'KERALA': 'COCHIN', 'KARNATAKA': 'NEW MANGALORE', 'GOA': 'MORMUGAO'
}

state_to_icd = {
    'MAHARASHTRA': 'MULUND', 'GUJARAT': 'AHMEDABAD', 'TAMIL NADU': 'IRUGATTUKOTTAI',
    'ANDHRA PRADESH': 'VISAKHAPATNAM', 'KARNATAKA': 'WHITEFIELD', 'TELANGANA': 'SANATHNAGAR',
    'DELHI': 'TUGHLAKABAD', 'HARYANA': 'GARHI HARSARU', 'PUNJAB': 'LUDHIANA',
    'UTTAR PRADESH': 'DADRI', 'WEST BENGAL': 'KOLKATA', 'RAJASTHAN': 'JAIPUR',
    'MADHYA PRADESH': 'INDORE', 'RAJASTHAN': 'JODHPUR', 'KERALA': 'COCHIN', 'ODISHA': 'PARADIP'
}

state_to_airport = {
    'MAHARASHTRA': 'BOM', 'GUJARAT': 'AMD', 'TAMIL NADU': 'MAA',
    'ANDHRA PRADESH': 'VTZ', 'KARNATAKA': 'BLR', 'TELANGANA': 'HYD',
    'DELHI': 'DEL', 'HARYANA': 'DEL', 'PUNJAB': 'ATQ',
    'UTTAR PRADESH': 'LKO', 'WEST BENGAL': 'CCU', 'RAJASTHAN': 'JAI',
    'MADHYA PRADESH': 'IDR', 'KERALA': 'COK', 'ODISHA': 'BBI',
    'PUNJAB': 'ATQ', 'KARNATAKA': 'BLR'
}

gst_state_codes = {
    'ANDHRA PRADESH': '37', 'ARUNACHAL PRADESH': '12', 'ASSAM': '18', 'BIHAR': '10',
    'CHHATTISGARH': '22', 'GOA': '30', 'GUJARAT': '24', 'HARYANA': '06',
    'HIMACHAL PRADESH': '02', 'JHARKHAND': '20', 'KARNATAKA': '29', 'KERALA': '32',
    'MADHYA PRADESH': '23', 'MAHARASHTRA': '27', 'MANIPUR': '14', 'MEGHALAYA': '17',
    'MIZORAM': '15', 'NAGALAND': '13', 'ODISHA': '21', 'PUNJAB': '03',
    'RAJASTHAN': '08', 'SIKKIM': '11', 'TAMIL NADU': '33', 'TELANGANA': '36',
    'TRIPURA': '16', 'UTTAR PRADESH': '09', 'UTTARAKHAND': '05', 'WEST BENGAL': '19',
    'DELHI': '07', 'JAMMU AND KASHMIR': '01', 'LADAKH': '38', 'PUDUCHERRY': '34',
    'CHANDIGARH': '04', 'ANDAMAN AND NICOBAR ISLANDS': '35',
    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': '26', 'LAKSHADWEEP': '31'
}

metro_districts = {
    'mumbai', 'mumbai suburban', 'delhi', 'new delhi', 'central delhi', 'north delhi', 'south delhi', 'east delhi', 'west delhi',
    'bangalore', 'bengaluru', 'bangalore urban', 'bangalore rural',
    'chennai', 'kolkata', 'hyderabad', 'ghmc (hyd)', 'secunderabad',
    'ahmedabad', 'pune', 'surat', 'jaipur', 'lucknow', 'kanpur',
    'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'vadodara',
    'faridabad', 'ghaziabad', 'gurgaon', 'gurugram', 'noida', 'greater noida'
}

tier1_districts = {
    'coimbatore', 'madurai', 'tiruchirappalli', 'salem', 'erode', 'tirupur', 'vellore',
    'jodhpur', 'kota', 'ajmer', 'bikaner', 'udaipur',
    'rajkot', 'jamnagar', 'bhavnagar', 'gandhinagar', 'junagadh',
    'mysore', 'mysuru', 'hubli', 'dharwad', 'belgaum', 'mangalore',
    'cochin', 'kochi', 'ernakulam', 'thiruvananthapuram', 'kozhikode',
    'guwahati', 'dibrugarh', 'jamshedpur', 'dhanbad', 'bokaro', 'ranchi',
    'raipur', 'bhilai', 'bilaspur', 'korba',
    'amritsar', 'ludhiana', 'jalandhar', 'patiala',
    'allahabad', 'prayagraj', 'varanasi', 'gorakhpur', 'bareilly', 'moradabad',
    'dehradun', 'haridwar',
    'chandigarh', 'panchkula', 'mohali', 'sas nagar'
}

industrial_districts = {
    'mumbai', 'mumbai suburban', 'thane', 'raigad', 'pune', 'nashik', 'aurangabad', 'nagpur',
    'ahmedabad', 'vadodara', 'surat', 'rajkot', 'jamnagar', 'b', 'bhavnagar', 'ankleshwar', 'vapi', 'dahej',
    'chennai', 'kanchipuram', 'tiruvallur', 'coimbatore', 'tirupur', 'erode', 'hosur', 'sriperumbudur',
    'bangalore', 'bengaluru', 'bangalore urban', 'mysuru', 'hubli', 'dharwad', 'peenya', 'bommasandra',
    'hyderabad', 'rangareddy', 'medchal', 'sangareddy', 'jeedimetla', 'pashamylaram',
    'kolkata', 'howrah', 'north 24 parganas', 'south 24 parganas', 'hooghly',
    'delhi', 'new delhi', 'central delhi', 'north delhi', 'south delhi', 'east delhi', 'west delhi',
    'gurgaon', 'gurugram', 'faridabad', 'ghaziabad', 'noida', 'greater noida',
    'jaipur', 'jodhpur', 'udaipur', 'kota', 'bhiwadi', 'neemrana',
    'lucknow', 'kanpur', 'unnao', 'agra', 'varanasi',
    'visakhapatnam', 'vijayawada', 'guntur', 'nellore',
    'coimbatore', 'tirupur', 'erode', 'salem', 'hosur',
    'jamshedpur', 'dhanbad', 'bokaro', 'ramgarh',
    'raipur', 'bhilai', 'durg', 'korba', 'bilaspur'
}

state_to_port = {
    'MAHARASHTRA': 'JNPT', 'GUJARAT': 'MUNDRA', 'TAMIL NADU': 'CHENNAI',
    'ANDHRA PRADESH': 'VISAKHAPATNAM', 'ODISHA': 'PARADIP', 'WEST BENGAL': 'KOLKATA',
    'KERALA': 'COCHIN', 'KARNATAKA': 'NEW MANGALORE', 'GOA': 'MORMUGAO'
}

state_to_icd = {
    'MAHARASHTRA': 'MULUND', 'GUJARAT': 'AHMEDABAD', 'TAMIL NADU': 'IRUGATTUKOTTAI',
    'ANDHRA PRADESH': 'VISAKHAPATNAM', 'KARNATAKA': 'WHITEFIELD', 'TELANGANA': 'SANATHNAGAR',
    'DELHI': 'TUGHLAKABAD', 'HARYANA': 'GARHI HARSARU', 'PUNJAB': 'LUDHIANA',
    'UTTAR PRADESH': 'DADRI', 'WEST BENGAL': 'KOLKATA', 'RAJASTHAN': 'JAIPUR',
    'MADHYA PRADESH': 'INDORE', 'RAJASTHAN': 'JODHPUR', 'KERALA': 'COCHIN', 'ODISHA': 'PARADIP'
}

state_to_airport = {
    'MAHARASHTRA': 'BOM', 'GUJARAT': 'AMD', 'TAMIL NADU': 'MAA',
    'ANDHRA PRADESH': 'VTZ', 'KARNATAKA': 'BLR', 'TELANGANA': 'HYD',
    'DELHI': 'DEL', 'HARYANA': 'DEL', 'PUNJAB': 'ATQ',
    'UTTAR PRADESH': 'LKO', 'WEST BENGAL': 'CCU', 'RAJASTHAN': 'JAI',
    'MADHYA PRADESH': 'IDR', 'KERALA': 'COK', 'ODISHA': 'BBI',
    'PUNJAB': 'ATQ', 'KARNATAKA': 'BLR'
}

gst_state_codes = {
    'ANDHRA PRADESH': '37', 'ARUNACHAL PRADESH': '12', 'ASSAM': '18', 'BIHAR': '10',
    'CHHATTISGARH': '22', 'GOA': '30', 'GUJARAT': '24', 'HARYANA': '06',
    'HIMACHAL PRADESH': '02', 'JHARKHAND': '20', 'KARNATAKA': '29', 'KERALA': '32',
    'MADHYA PRADESH': '23', 'MAHARASHTRA': '27', 'MANIPUR': '14', 'MEGHALAYA': '17',
    'MIZORAM': '15', 'NAGALAND': '13', 'ODISHA': '21', 'PUNJAB': '03',
    'RAJASTHAN': '08', 'SIKKIM': '11', 'TAMIL NADU': '33', 'TELANGANA': '36',
    'TRIPURA': '16', 'UTTAR PRADESH': '09', 'UTTARAKHAND': '05', 'WEST BENGAL': '19',
    'DELHI': '07', 'JAMMU AND KASHMIR': '01', 'LADAKH': '38', 'PUDUCHERRY': '34',
    'CHANDIGARH': '04', 'ANDAMAN AND NICOBAR ISLANDS': '35',
    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': '26', 'LAKSHADWEEP': '31'
}

with open('pincode_db.json', 'r') as f:
    records = json.load(f)

for r in records:
    district = r['district'].lower().strip()
    state = r['state'].upper().strip()
    
    # Zone classification
    if district in metro_districts:
        r['deliveryZone'] = 'A'
    elif district in tier1_districts:
        r['deliveryZone'] = 'B'
    else:
        r['deliveryZone'] = 'C'
    
    # Industrial
    r['isIndustrial'] = district in industrial_districts
    
    # Port/ICD/Airport
    r['nearestPort'] = state_to_port.get(state, 'JNPT')
    r['nearestICD'] = state_to_icd.get(state, 'TUGHLAKABAD')
    r['nearestAirport'] = state_to_airport.get(state, 'DEL')
    
    # GST state code
    r['gstStateCode'] = gst_state_codes.get(r['state'].upper().strip(), '00')

with open('pincode_db.json', 'w') as f:
    json.dump(records, f, separators=(',', ':'))

print(f'Updated {len(records)} pincodes')

# Check zones again
zones = {}
for r in records:
    zones[r['deliveryZone']] = zones.get(r['deliveryZone'], 0) + 1
print('Delivery zone distribution:')
for z, count in sorted(zones.items()):
    print(f'  Zone {z}: {count}')

ind_counts = {'True': 0, 'False': 0}
for r in records:
    ind_counts[str(r['isIndustrial'])] += 1
print('Industrial distribution:', ind_counts)

# Check major metros
for r in records:
    if r['pincode'] in ['400001', '560001', '600001', '700001', '500001', '380001', '411001', '110001']:
        print(f"{r['pincode']} ({r['district']}, {r['state']}): Zone={r['deliveryZone']}, Industrial={r['isIndustrial']}")