# 2024-wisconsin-maps
A quick experiment in visualizing the Wisconsin Assembly Maps, comparing the 2022 map that was struck down by the Wisconsin Supreme Court to the version proposed by Governor Evers and ultimately enacted into law. 

See it in action at [https://epaulson.github.io/2024-wisconsin-maps/](https://epaulson.github.io/2024-wisconsin-maps/)

## Data

The Original districts are from here: 
https://gis-ltsb.hub.arcgis.com/pages/download-data

The 2024 Evers Maps were put together by [John D Johnson](https://twitter.com/jdjmke) of the Marquette Law School Lubar Center, available from [his github repository](https://github.com/jdjohn215/wi-legis-map-proposals-2024/)

The addresses were from the candidate tracking form managed by the [Wiscosnin Election Commission](https://web.archive.org/web/20220613190842/https://elections.wi.gov/sites/elections/files/2022-06/Candidates%20Tracking%20By%20Office%20as%20of%206.6.2022%20at%205pm_0.pdf) (That form is probably still on the WEC site but I just tracked it down on the Wayback Machine)

## Important Disclaimer
I make no warranties about how accurate the data is, in particular the geocoding.
Do not make important life or legal decisions based on where you see a particular legislator's marker on the map. 
Also note that the addresses are now nearly 21 months old and it's very likely that at least some of the members of the legislature have moved to new homes (hopefully somewhere in their district, but don't ask [Shannon Zimmerman where he lives.](https://www.wpr.org/politics/documents-suggest-assembly-lawmaker-lives-outside-district-violation-state-law)
## To build the data
To create the data you'll need Python, and the following packages:
- pandas
- geopandas
- shapley
- requests
- beautifulsoup4
- openpyxl

I cheated a little bit and this dataset isn't completely automated. Most of the data comes from the the 2022AsssemblyMembers-geocoded.xlsx file.
The original data for that spreadsheet came from the [Wikipedia page on the Wiscosnin Assembly](https://en.wikipedia.org/wiki/Wisconsin_State_Assembly) that I pasted into an Excel spreadsheet.
Then I copied out addresses from the Wiscosin Election Commission PDF and added them to the spreadsheet, and then used a Geocoding service to convert the addresses into lat/lon pairs and added them to the spreadsheet.
I wrote a quick script to grab the image files from the Wisconisn Assembly page, it's in `scrape-assembly-images.py` and it spits out a CSV of URLs. 
I just copied that column of CSVs into the 2022AssemblyMembers-geocoded.xlsx file.

I convert the Excel file into a Geojson using the `make-geojson.py` script. It takes no arguments and creates 2022AssemblyMembers.geojson

There is some processing of the 2024 district map that @jdjmke created in the `geoanalysis.py` script. (Please don't take the name too seriously, it's not doing anything interesting except counting.) The main thing it calculates is the number of candidates in each district. It reads in @jdjmke's original evers24_wsa.geojson mapfile, adds a few properties, and writes it back out as districts.geojson.

Because I was hacking this all together and iterating there's a little bit of a weird circular dependnce between make-geojson and geoanalysis. The geoanalysis.py script spits out a CSV that has for each candidate the 2024 district they're assigned to, using their 2022 district ID that it got from the 2022AssemblyMembers.geojson file. I then cut and paste that CSV back into 2022AssemblyMembers.xlsx, which unfortunately is the input to make-geojson and the source of 2022AssemblyMembers.geojson! 
Oops. 
For now I'm ignoring it, that column is 2022AssemblyMembers-geocoded.xlsx isn't read by anything in geoanalysis.py so as long it exists and doesn't crash make-geojson.py isn't not a big deal to just run it a 2nd time. 

The election results data came from the LTSB site, using the 2022 fall elections. 
At the moment the LTSB has not published an actual map of which wards makes make up which districts so I put one together.
You will need to download 2022_Election_Data_with_2022_Wards.geojson from the LTSB site, it is not included in this repo because it is a huge file.
(Important terminology note: in Wisconsin, a ward is what most other places call a precinct, Wisconsin doesn't use have precincts. What other places call a ward Wisconsin calls a district - our city council members represent districts, not wards) 
I am not looking for perfect legal accuracy and so as to not deal with slight imperfections in the different GIS files, I compute the centroid of the ward and use that for the spatial join, rather than using a spatial containment join with the polygons. 
This works except for two places where the centroid winds up being out in Lake Superior or Lake Winnebago so those are manually repaired. 
The workflow is in `evers24-wards.py` which takes the the 2024 district map and the 2022 election results and ward map and joins them and spits out 2022-processed-wards.geojson.
There are a handful of issues with the ward data that I'm ignoring, mostly around new wards that have been created since 2022 because of annexation or wards that were created as placeholders and don't yet have any voters in them. 

The last step is to convert the geojson district files into Geobuf. Geobuf is a binary file format for geojson that uses protobufs as the base format. 
They're much smaller on the wire and parse much faster so they're better for performance. You can create the files using the [geobuf package](https://www.npmjs.com/package/geobuf) from NPM. 

```sh
npx json2geobuf districts.geojson >evers24districts.pbf
npx json2geobuf original22_wsa.geojson >2022districts.pbf
npx json2geobuf 2022-processed-wards.geojson >2022-wards.pbf
```

## The website
The website uses Leaflet.JS to display the map. 
I don't expect this site to get many visitors so I'm slumming off the OpenStreetMap tileserver.
You can find the source in index.html and main.js

## License
I dunno, I guess MIT? Most of this code was written by Github CoPilot so lol at what the copyright really is anyway.
