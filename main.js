

// Initialize the map
let map = L.map('mapid').setView([44.5173377,-89.5699163], 7);
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
    }
).addTo(map);

setMapContainerHeight();
window.addEventListener('resize', setMapContainerHeight);

function setMapContainerHeight() {
    const bottombarHeight = document.getElementById('bottombar').offsetHeight;
    const mapContainer = document.getElementById('map-container');
    mapContainer.style.height = window.innerHeight - bottombarHeight + 'px';
}
// Load the geobuf file
let eversDistrictsLayer;
fetch('evers24districts.pbf')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        let geojson = geobuf.decode(new Pbf(buffer));

        // Add the data to the map
        eversDistrictsLayer = L.geoJSON(geojson, {
            onEachFeature: function (feature, layer) {
                layer.on({
                    mouseover: function (e) {
                        document.getElementById('district').innerText = '2024 District: ' + feature.properties.evers24_wsa;
                    },
                    click: function (e) {
                        document.getElementById('district').innerText = '2024 District: ' + feature.properties.evers24_wsa;
                    }
                });
            }
        }).addTo(map);
        add2022Districts();
        
    });
let districtsLayer;
function add2022Districts() {
    fetch('2022districts.pbf')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        let geojson = geobuf.decode(new Pbf(buffer));

        // Add the data to the map as an invisible layer
        districtsLayer = L.geoJSON(geojson, {
            style: {
                color: '#FF6600', // blaze orange
                weight: 2,
                opacity: 0,
                fillOpacity: 0
            }
        }).addTo(map);
        districtsLayer.bringToBack();
        addMembers();
    });
}

// Load the 2022AssemblyMembers.geojson file
// Load the 2022AssemblyMembers.geojson file
function addMembers() {
fetch('2022AssemblyMembers.geojson')
    .then(response => response.json())
    .then(geojson => {
        // Create a new layer and add it to the map
        let membersLayer = L.geoJSON(geojson, {
            // Create a circle marker for each point
            pointToLayer: function (feature, latlng) {
                let color = feature.properties.Party === 'Rep' ? 'red' : 'blue';
                return L.circleMarker(latlng, { color: color });
            },
            // Add event listeners to each marker
            onEachFeature: function (feature, layer) {
                layer.on({
                    click: function (e) {
                        // Store the properties for later use
                        L.DomEvent.stopPropagation(e);
                        e.target.properties = feature.properties;
                        //console.log("Fired at all");
                        //console.log(e.target.properties);
                        let district_2022 = e.target.feature.properties.District;
                        let district_evers = e.target.feature.properties.EversDistrict;
                        
                        // Update the infobar
                        document.getElementById('member-name').textContent = feature.properties.Name;
                        document.getElementById('member-party').textContent = 'Party: ' + feature.properties.Party;
                        document.getElementById('member-district').textContent = '2022 District: ' + feature.properties.District;
                        document.getElementById('member-evers-district').textContent = 'Evers District: ' + feature.properties.EversDistrict;
                        document.getElementById('member-year-elected').textContent = 'Year First Elected: ' + feature.properties.FirstElected;
                        document.getElementById('member-age').textContent = 'Age: ' + feature.properties.Age;
                        document.getElementById('member-retirement-status').textContent = 'Retiring in 2024: ' + (feature.properties.Retiring ? 'Yes' : 'No');
                        document.getElementById('member-wikipedia-link').href = feature.properties.WikipediaPage;
                        document.getElementById('memberPhoto').src = feature.properties.imageURL;
                        
                        districtsLayer.eachLayer(function(layer) {
                            if (layer.feature.properties.ASM2021 == district_2022) {
                                // Set the style of this feature to be visible and color its outline blaze orange
                                layer.setStyle({
                                    opacity: 1,
                                    fillOpacity: 0.3
                                });
            
                                // Zoom to the feature
                                map.fitBounds(layer.getBounds());
                            } else {
                                // Set the style of other features to be invisible
                                layer.setStyle({
                                    opacity: 0,
                                    fillOpacity: 0
                                });
                            }
                        });
                        eversDistrictsLayer.eachLayer(function(layer) {
                            if (layer.feature.properties.evers24_wsa == district_evers) {
                                // Set the style of this feature to be visible and color its outline blaze orange
                                layer.setStyle({
                                    fillOpacity: 0.3,
                                    weight: 6
                                });
            
                            } else {
                                // Set the style of other features to be invisible
                                layer.setStyle({
                                    fillOpacity: 0.2,
                                    weight: 3
                                });
                            }
                        });
                    }
                });
            }
        }).addTo(map);

        // Add a click event listener to the map to clear all fields
        map.on('click', function (e) {
            if (!e.target.properties) {
                document.getElementById('member-name').textContent = '';
                document.getElementById('member-party').textContent = 'Party: ';
                document.getElementById('member-district').textContent = '2022 District: ';
                document.getElementById('member-evers-district').textContent = 'Evers District: '
                document.getElementById('member-year-elected').textContent = 'Year First Elected: ';
                document.getElementById('member-age').textContent = 'Age: ';
                document.getElementById('member-retirement-status').textContent = 'Retiring in 2024: ';
                document.getElementById('member-wikipedia-link').href = 'https://en.wikipedia.org';
                document.getElementById('memberPhoto').src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

                districtsLayer.eachLayer(function(layer) {
                    layer.setStyle({
                        opacity: 0,
                        fillOpacity: 0
                    });
                });
                eversDistrictsLayer.eachLayer(function(layer) {
                    layer.setStyle({
                        fillOpacity: 0.2,
                        weight: 3
                    });
                });
            }
        });
    });
}