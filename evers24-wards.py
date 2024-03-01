import geopandas as gpd
import pandas as pd

# Adjust pandas print options
pd.set_option('display.max_rows', None)
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.max_colwidth', None)

# Load the geojson files
wards = gpd.read_file('2022_Election_Data_with_2022_Wards.geojson')
districts = gpd.read_file('evers24_wsa.geojson')

# Change the CRS of the districts
districts = districts.to_crs(epsg=4326)

# Keep the original ward geometry in a column before we add in the centroids
wards['original_geometry'] = wards['geometry']

# Project the wards to a suitable UTM zone before computing centroids
wards = wards.to_crs(epsg=32616)
wards['geometry'] = wards['geometry'].centroid

# Project the wards back to the original CRS
wards = wards.to_crs(epsg=4326)

# Perform a spatial join
wards_in_districts = gpd.sjoin(wards, districts, how='left', predicate='within')

# Swap the original geometry back in place of the centroids
wards_in_districts['geometry'] = wards_in_districts['original_geometry']
del wards_in_districts['original_geometry']

# Filter out the wards that have spaces as their WARDJuly22 property
wards_in_districts = wards_in_districts[wards_in_districts['WARDJuly22'] != ' ']

# Add in to each ward an 'ASM2024' property which is the district we joined into wards_in_districts
wards_in_districts['ASM2024'] = wards_in_districts['evers24_wsa']

# Update two wards that are unassigned
wards_in_districts.loc[wards_in_districts['WARDJuly22'] == '55031786500011', 'ASM2024'] = '73'
wards_in_districts.loc[wards_in_districts['WARDJuly22'] == '55139605250004', 'ASM2024'] = '54'

# Write the updated wards table out to the 2022-processsed-wards.geojson file
# Only keep the geometry and the following properties
properties_to_keep = ['geometry', 'GOVTOT22', 'GOVREP22', 'GOVDEM22', 'USSTOT22', 'USSDEM22', 'USSREP22', 'WARDJuly22', 'LABEL', 'ASM2021', 'ASM2024', 'RU', 'Shape__Area', 'Shape__Length', 'PERSONS18']
wards_in_districts = wards_in_districts[properties_to_keep]
wards_in_districts.to_file('2022-processed-wards.geojson', driver='GeoJSON')
