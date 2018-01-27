/*
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'your.mapbox.access.token'
}).addTo(mymap)
*/

let campusMap = {
    // Leaflet map object
    map: L.map('campusMap').setView([-27.476167, 153.027482], 17),
    // List of map data local urls
    maps: {
        GP: {
            maincoords: [-27.477054, 153.028018],
            lines: "data/map_GP/lines.geojson",
            multipolygons: "data/map_GP/multipolygons.geojson"
        }
    },
    // Grabs local map data saved in extension package
    retrieveMap : (campus, type, promise)=>{
        $.get(chrome.runtime.getURL(campusMap.maps[campus][type]), (data)=>{
	       promise(JSON.parse(data))
        })
    },
    //
    extractQUT: (geodata) => {
        geodata.features = geodata.features.filter(feature => (feature.properties.name !== null ? 
            feature.properties.name.includes("Block") || feature.properties.name.length === 1 :
            false))
    },
    //
    renderGEOJSON: (campus) => {
        campusMap.retrieveMap(campus, "multipolygons", (data)=>{
            console.log(campusMap.extractQUT(data));
            L.geoJSON(data).addTo(campusMap.map);
        })
    },
    setup: () => {
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(campusMap.map);
    },
    render: (campus) => {
        campusMap.map.setView(campusMap.maps[campus].maincoords, 17);
    }
}
campusMap.setup()
campusMap.render("GP")
campusMap.renderGEOJSON("GP")