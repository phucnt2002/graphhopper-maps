/**
 * Webpack will replace this file with config-local.js if it exists
 */
const config = {
    // the url of the GraphHopper routing backend, either use graphhopper.com or point it to your own GH instance
    routingApi: 'http://localhost:8989/',
    // the url of the geocoding backend, either use graphhopper.com or point it to another geocoding service. use an empty string to disable the address search
    geocodingApi: 'http://localhost:8989/',
    // the tile layer used by default, see MapOptionsStore.ts for all options
    defaultTiles: 'OpenStreetMap',
    // various api keys used for the GH backend and the different tile providers
    keys: {
        graphhopper: '',
        maptiler: 'missing_api_key',
        omniscale: 'missing_api_key',
        thunderforest: 'missing_api_key',
        kurviger: 'missing_api_key',
    },
    // if true there will be an option to enable the GraphHopper routing graph and the urban density visualization in the layers menu
    routingGraphLayerAllowed: false,
    // parameters used for the routing request generation
    request: {
        details: [
            'road_class',
            'road_environment',
            'road_access',
            'surface',
            'max_speed',
            'average_speed',
            'toll',
        ],
        snapPreventions: ['ferry'],
    },
    // Use 'profiles' to define which profiles are visible and how. Useful if the /info endpoint contains too many or too "ugly" profile
    // names or in the wrong order. The key of each profile will be used as name and the given fields will overwrite the fields of the
    // default routing request. e.g.
    //
    // profiles: { my_car: { profile: 'raw_car' } }
    //
    // will add a profile named 'my_car' for which we send a request with profile=raw_car, and you could add other parameters like custom_model.
}

// this is needed for jest (with our current setup at least)
if (module) module.exports = config
