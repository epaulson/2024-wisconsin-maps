import geopandas as gpd
import pandas as pd

# change the global options that Geopandas inherits from
pd.set_option('display.max_rows',None)

# Load the district and people data
districts = gpd.read_file('evers24_wsa.geojson')
people = gpd.read_file('2022AssemblyMembers.geojson')
districts = districts.to_crs(epsg=4326)


# Perform a spatial join to associate each person with a district
people_in_districts = gpd.sjoin(people, districts, op='within')

# Count the total number of people in each district
districts['candidateCountTotal'] = people_in_districts.groupby('index_right').size()

# Filter out the people who are retiring
active_people = people_in_districts[people_in_districts['Retiring'] != 'Yes']

# Count the number of active people in each district
districts['activeCandidateCountTotal'] = active_people.groupby('index_right').size()

# Fill NaN values with 0
districts[['candidateCountTotal', 'activeCandidateCountTotal']] = districts[['candidateCountTotal', 'activeCandidateCountTotal']].fillna(0)

# Save the districts GeoDataFrame as a GeoJSON file
districts.to_file('districts.geojson', driver='GeoJSON')

# Extract the required columns and sort by 'District'
assignments = people_in_districts[['District', 'Name', 'evers24_wsa']].sort_values('District')
#print(people_in_districts.head(100))

# Save the assignments DataFrame as a CSV file
assignments.to_csv('2024_assignments.csv', index=False)