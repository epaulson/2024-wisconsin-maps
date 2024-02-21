import warnings
warnings.simplefilter(action='ignore', category=DeprecationWarning)
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

# Load the data
df = pd.read_excel('2022AssemblyMembers-Geocoded.xlsx')

# Create a list to store the GeoDataFrames
gdfs = []

# Iterate over DataFrame rows
for index, row in df.iterrows():
    # Check if geocoordinates is not NaN
    if pd.notna(row['geocoordinates']):
        # Split the geocoordinates into latitude and longitude and flip them
        lat, lon = map(float, row['geocoordinates'].split(','))
        
        # Create a GeoDataFrame with the geocoordinates and other properties
        gdf = gpd.GeoDataFrame(
            {'District': [row['District']],
             'Name': [row['Name']],
             'Address': [row['Address']],
             'Party': [row['Party']],
             'Age': [row['Age']],
             'City': [row['City']],
             'FirstElected': [row['FirstElected']],
             'Retiring': [row['Retiring']],
             'DistrictWikipediaPage': [row['DistrictWikipediaPage']],
             'WikipediaPage': [row['WikipediaPage']],
             'CityWikipediaPage': [row['CityWikipediaPage']],
             'imageURL': [row['imageURL']],
             'EversDistrict': [row['EversDistrict']],},
            geometry=[Point(lon, lat)]
        )
        
        # Add the GeoDataFrame to the list
        gdfs.append(gdf)

# Concatenate all the GeoDataFrames
geo_df = pd.concat(gdfs, ignore_index=True)

# Convert the GeoDataFrame to a GeoJSON file
geo_df.to_file('2022AssemblyMembers.geojson', driver='GeoJSON')