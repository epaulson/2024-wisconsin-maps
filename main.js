

// Initialize the map
let map = L.map('mapid').setView([44.5173377,-89.5699163], 7);
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
    }
).addTo(map);

let defaultFillOpacity = 0.0;
let defaultEversColor = '#3388ff';
let defaultEversOpen = 'green';
let defaultEversMultiple = 	'#FF3B58';
let showOpenDistricts = false;
let showMultiCandidateDistricts = false;
let currentMarker = null;
let showWards = false;

function computeEversColors(feature) {
    let computedColor = defaultEversColor;
    let computedOpacity = defaultFillOpacity;
    if (showOpenDistricts) {
        if (feature.properties.candidateCountTotal == 0) { computedColor = defaultEversOpen, computedOpacity = 0.3}
    }
    if(showMultiCandidateDistricts) {
        if (feature.properties.candidateCountTotal > 1) { computedColor = defaultEversMultiple, computedOpacity = 0.3}
    }
    return { fillOpacity: computedOpacity, color: computedColor, weight: 3 };
}

function computeWardStyle(matchType) {
    return {
        opacity: matchType === '2022_match' || matchType === '2024_match' ? 1.0 : 0.0
    };
}

setMapContainerHeight();
window.addEventListener('resize', setMapContainerHeight);

document.getElementById('showOpenDistricts').addEventListener('change', function() {
    showOpenDistricts = this.checked;
    clearAllFields();
    // Invalidate the map to redraw it
    map.invalidateSize();
});

document.getElementById('showMultiCandidateDistricts').addEventListener('change', function() {
    showMultiCandidateDistricts = this.checked;
    clearAllFields();
    // Invalidate the map to redraw it
    map.invalidateSize();
});

document.getElementById('showWards').addEventListener('change', (event) => {
    showWards = event.target.checked;
    if(showWards) {
        wardsLayer.addTo(map);
        wardsLayer.bringToBack();
    } else {
        map.removeLayer(wardsLayer);
    }
    map.invalidateSize();
});

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
            style: computeEversColors,
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

let wardsLayer;
let wardsLoaded = false;

let wards2022 = {};
let wardsEvers = {};

function add2022Wards() {
    fetch('2022-wards.pbf')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        let geojson = geobuf.decode(new Pbf(buffer));
    
        // Add the data to the map as an invisible layer
        wardsLayer = L.geoJSON(geojson, {
            style: {
                color: 'purple', // purple
                weight: 3,
                opacity: 0,
                fillOpacity: 0
            },
            onEachFeature: function (feature, layer) {
                let wardId = feature.properties.WARDJuly22;
                let asm2021 = feature.properties.ASM2021;
                let asm2024 = feature.properties.ASM2024;

                // Add the ward ID to the wards2022 and wardsEvers indexes
                if (!wards2022[asm2021]) {
                    wards2022[asm2021] = [];
                }
                wards2022[asm2021].push(wardId);

                if (!wardsEvers[asm2024]) {
                    wardsEvers[asm2024] = [];
                }
                wardsEvers[asm2024].push(wardId);
            }
        })
        //wardsLayer.bringToBack();

        document.getElementById('showWards').disabled = false;
        wardsLoaded = true;
    });
}

function getWardCategory(wardId, asm2021, asm2024) {
    let in2022 = wards2022[asm2021] && wards2022[asm2021].includes(wardId);
    let inEvers = wardsEvers[asm2024] && wardsEvers[asm2024].includes(wardId);

    if (in2022 && inEvers) {
        return 'both';
    } else if (in2022) {
        return 'only2022';
    } else if (inEvers) {
        return 'onlyEvers';
    } else {
        return 'none';
    }
}

function computeVotingInfo(asm2021, asm2024) {
    let wards2022List = wards2022[asm2021] || [];
    let wardsEversList = wardsEvers[asm2024] || [];

    let votingInfo = {
        only2022: { GOVREP22: 0, GOVDEM22: 0, USSREP22: 0, USSDEM22: 0 },
        onlyEvers: { GOVREP22: 0, GOVDEM22: 0, USSREP22: 0, USSDEM22: 0 },
        both: { GOVREP22: 0, GOVDEM22: 0, USSREP22: 0, USSDEM22: 0 },
        commonPlusEvers: { GOVREP22: 0, GOVDEM22: 0, USSREP22: 0, USSDEM22: 0 },
        commonPlus2022: { GOVREP22: 0, GOVDEM22: 0, USSREP22: 0, USSDEM22: 0 }
    };

    wardsLayer.eachLayer(function(layer) {
        let wardId = layer.feature.properties.WARDJuly22;
        let category = getWardCategory(wardId, asm2021, asm2024);
        if (category !== 'none') {
            ['GOVREP22', 'GOVDEM22', 'USSREP22', 'USSDEM22'].forEach(function(voteType) {
                votingInfo[category][voteType] += layer.feature.properties[voteType];
                if (category !== 'onlyEvers') {
                    votingInfo['commonPlus2022'][voteType] += layer.feature.properties[voteType];
                }
                if (category !== 'only2022') {
                    votingInfo['commonPlusEvers'][voteType] += layer.feature.properties[voteType];
                }
            });
        }
    });

    // Compute percentages
    ['only2022', 'onlyEvers', 'both', 'commonPlusEvers', 'commonPlus2022'].forEach(function(category) {
        votingInfo[category]['GOVREP22Percent'] = (votingInfo[category]['GOVREP22'] / (votingInfo[category]['GOVREP22'] + votingInfo[category]['GOVDEM22']) * 100).toFixed(1);
        votingInfo[category]['GOVDEM22Percent'] = (votingInfo[category]['GOVDEM22'] / (votingInfo[category]['GOVREP22'] + votingInfo[category]['GOVDEM22']) * 100).toFixed(1);
        votingInfo[category]['USSREP22Percent'] = (votingInfo[category]['USSREP22'] / (votingInfo[category]['USSREP22'] + votingInfo[category]['USSDEM22']) * 100).toFixed(1);
        votingInfo[category]['USSDEM22Percent'] = (votingInfo[category]['USSDEM22'] / (votingInfo[category]['USSREP22'] + votingInfo[category]['USSDEM22']) * 100).toFixed(1);
    });

    return votingInfo;
}

function formatVotingInfoAsHtml(votingInfo) {
    // Define the keys for each row

    // Define the column keys
    var columnKeys = [
        'only2022',
        'both',
        'onlyEvers',
        'commonPlus2022',
        'commonPlusEvers'
    ];

    // Start the table body
    var tableBodyHtml = '';


    tableBodyHtml += '<tr><td>Evers/<br>Michaels</td>';

    // Loop through each column
    for (var j = 0; j < columnKeys.length; j++) {
        cellObj = votingInfo[columnKeys[j]]

        
        // Get the data for this cell
        var cellData = cellObj['GOVDEM22'] + '/' + cellObj['GOVREP22'];
        cellData += '<br>(' + cellObj['GOVDEM22Percent'] + '%/' + cellObj['GOVREP22Percent'] + '%)';

        // Add the cell data to the row
        tableBodyHtml += '<td>' + cellData + '</td>';
    }

    // End the row
    tableBodyHtml += '</tr>';

    tableBodyHtml += '<tr><td>Barnes/<br>Johnson</td>';
        // Loop through each column
        for (var j = 0; j < columnKeys.length; j++) {
            cellObj = votingInfo[columnKeys[j]]

            // Get the data for this cell
            var cellData = cellObj['USSDEM22'] + '/' + cellObj['USSREP22'];
            cellData += '<br>(' + cellObj['USSDEM22Percent'] + '%/' + cellObj['USSREP22Percent']+ '%)';
    
    
            // Add the cell data to the row
            tableBodyHtml += '<td>' + cellData + '</td>';
        }
    
        // End the row
        tableBodyHtml += '</tr>';
    
    // Replace the table body with the new HTML
    document.querySelector('.table tbody').innerHTML = tableBodyHtml;
}

function clearTableBody() {
    // Define the default table body HTML
    var defaultTableBodyHtml = `
        <tr>
            <td>Evers/<br>Michaels</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
        <tr>
            <td>Barnes/<br>Johnson</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        </tr>
    `;

    // Replace the table body with the default HTML
    document.querySelector('.table tbody').innerHTML = defaultTableBodyHtml;
}

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
                weight: 3,
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
                        e.target.properties = feature.properties;
                        L.DomEvent.stopPropagation(e);

                        if (currentMarker) {
                            currentMarker.setStyle({ color: currentMarker.properties.Party === 'Rep' ? 'red' : 'blue', fillOpacity: 0.5 });
                            clearTableBody();
                        }

                                    // Change the style of the clicked marker
                        let marker = e.target;
                        marker.setStyle({ color: 'yellow', fillOpacity: 1 });

                        // Store the clicked marker
                        currentMarker = marker;

                        let district_2022 = e.target.feature.properties.District;
                        let district_evers = e.target.feature.properties.EversDistrict;

                        document.getElementById('district').innerText = '2024 District: ' + district_evers;
                        
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
                        
                        let district22clicked, districtEversClicked;
                        districtsLayer.eachLayer(function(layer) {
                            if (layer.feature.properties.ASM2021 == district_2022) {
                                // Set the style of this feature to be visible and color its outline blaze orange
                                layer.setStyle({
                                    opacity: 1,
                                    fillOpacity: 0.3
                                });
            
                                district22clicked = layer;
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
                                layer.setStyle({
                                    fillOpacity: 0.3,
                                    weight: 9,
                                    color: defaultEversColor
                                });
                                districtEversClicked = layer;
            
                            } else {
                                // Set the style of other features to be invisible
                                layer.setStyle(computeEversColors(layer.feature));
                            }
                        });

                        if (wardsLoaded && showWards) {
                            wardsLayer.eachLayer(function(layer) {
                                if (layer.feature.properties.ASM2021 == district_2022) {
                                    layer.setStyle(computeWardStyle('2022_match'));
                                } else if (layer.feature.properties.ASM2024 == district_evers) {
                                    layer.setStyle(computeWardStyle('2024_match'));
                                } else {
                                    layer.setStyle({ opacity: 0.0 });
                                }
                            });
                        }
                        // Create a new bounds object from the first layer's bounds
                        let bounds = district22clicked.getBounds();

                        // Extend the bounds to include the second layer's bounds
                        bounds.extend(districtEversClicked.getBounds());

                        // Fit the map to the combined bounds
                        map.fitBounds(bounds);
                        //console.log(computeVotingInfo(district_2022, district_evers));
                        if(wardsLoaded) {
                        votingInfo = computeVotingInfo(district_2022, district_evers);
                        formatVotingInfoAsHtml(votingInfo);
                        }
                    }
                });
            }
        }).addTo(map);

        // Add a click event listener to the map to clear all fields
        map.on('click', function (e) {
            //L.DomEvent.stopPropagation(e);
            if (!e.target.properties) {
                if (currentMarker) {
                    currentMarker.setStyle({ color: currentMarker.properties.Party === 'Rep' ? 'red' : 'blue', fillOpacity: 0.5 });
                    currentMarker = null;
                }
                clearAllFields();
            }
        });
    });
}

function clearAllFields() {
    
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
        layer.setStyle(computeEversColors(layer.feature));
    });
    if(wardsLoaded) {
        wardsLayer.eachLayer(function(layer) {   
           layer.setStyle({ opacity: 0.0 });
        })
    };
    clearTableBody();
}

add2022Wards()