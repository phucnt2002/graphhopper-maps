import { useEffect, useState } from 'react'
import PathDetails from '@/pathDetails/PathDetails'
import styles from './App.module.css'
import {
    getApiInfoStore,
    getErrorStore,
    getMapFeatureStore,
    getMapOptionsStore,
    getPathDetailsStore,
    getQueryStore,
    getRouteStore,
    getSettingsStore,
} from '@/stores/Stores'
import MapComponent from '@/map/MapComponent'
import MapOptions from '@/map/MapOptions'
import MobileSidebar from '@/sidebar/MobileSidebar'
import { useMediaQuery } from 'react-responsive'
import RoutingResults from '@/sidebar/RoutingResults'
import PoweredBy from '@/sidebar/PoweredBy'
import { QueryStoreState, RequestState } from '@/stores/QueryStore'
import { RouteStoreState } from '@/stores/RouteStore'
import { MapOptionsStoreState } from '@/stores/MapOptionsStore'
import { ErrorStoreState } from '@/stores/ErrorStore'
import Search from '@/sidebar/search/Search'
import ErrorMessage from '@/sidebar/ErrorMessage'
import useBackgroundLayer from '@/layers/UseBackgroundLayer'
import useQueryPointsLayer from '@/layers/UseQueryPointsLayer'
import usePathsLayer from '@/layers/UsePathsLayer'
import ContextMenu from '@/layers/ContextMenu'
import usePathDetailsLayer from '@/layers/UsePathDetailsLayer'
import { Map } from 'ol'
import { getMap } from '@/map/map'
import CustomModelBox from '@/sidebar/CustomModelBox'
import useRoutingGraphLayer from '@/layers/UseRoutingGraphLayer'
import useUrbanDensityLayer from '@/layers/UseUrbanDensityLayer'
import useMapBorderLayer from '@/layers/UseMapBorderLayer'
import { ShowDistanceInMilesContext } from '@/ShowDistanceInMilesContext'
import RoutingProfiles from '@/sidebar/search/routingProfiles/RoutingProfiles'
import MapPopups from '@/map/MapPopups'
import Menu from '@/sidebar/menu.svg'
import Cross from '@/sidebar/times-solid.svg'
import PlainButton from '@/PlainButton'
import useAreasLayer from '@/layers/UseAreasLayer'
import useExternalMVTLayer from '@/layers/UseExternalMVTLayer'
import LocationButton from '@/map/LocationButton'
import Dispatcher from './stores/Dispatcher'
import { ClearRoute, SetHeadings } from './actions/Actions'

export const POPUP_CONTAINER_ID = 'popup-container'
export const SIDEBAR_CONTENT_ID = 'sidebar-content'

export default function App() {
    const [settings, setSettings] = useState(getSettingsStore().state)
    const [query, setQuery] = useState(getQueryStore().state)
    const [info, setInfo] = useState(getApiInfoStore().state)
    const [route, setRoute] = useState(getRouteStore().state)
    const [error, setError] = useState(getErrorStore().state)
    const [mapOptions, setMapOptions] = useState(getMapOptionsStore().state)
    const [pathDetails, setPathDetails] = useState(getPathDetailsStore().state)
    const [mapFeatures, setMapFeatures] = useState(getMapFeatureStore().state)

    const map = getMap()

    useEffect(() => {
        const onSettingsChanged = () => setSettings(getSettingsStore().state)
        const onQueryChanged = () => setQuery(getQueryStore().state)
        const onInfoChanged = () => setInfo(getApiInfoStore().state)
        const onRouteChanged = () => setRoute(getRouteStore().state)
        const onErrorChanged = () => setError(getErrorStore().state)
        const onMapOptionsChanged = () => setMapOptions(getMapOptionsStore().state)
        const onPathDetailsChanged = () => setPathDetails(getPathDetailsStore().state)
        const onMapFeaturesChanged = () => setMapFeatures(getMapFeatureStore().state)

        getSettingsStore().register(onSettingsChanged)
        getQueryStore().register(onQueryChanged)
        getApiInfoStore().register(onInfoChanged)
        getRouteStore().register(onRouteChanged)
        getErrorStore().register(onErrorChanged)
        getMapOptionsStore().register(onMapOptionsChanged)
        getPathDetailsStore().register(onPathDetailsChanged)
        getMapFeatureStore().register(onMapFeaturesChanged)

        onQueryChanged()
        onInfoChanged()
        onRouteChanged()
        onErrorChanged()
        onMapOptionsChanged()
        onPathDetailsChanged()
        onMapFeaturesChanged()

        return () => {
            getSettingsStore().register(onSettingsChanged)
            getQueryStore().deregister(onQueryChanged)
            getApiInfoStore().deregister(onInfoChanged)
            getRouteStore().deregister(onRouteChanged)
            getErrorStore().deregister(onErrorChanged)
            getMapOptionsStore().deregister(onMapOptionsChanged)
            getPathDetailsStore().deregister(onPathDetailsChanged)
            getMapFeatureStore().deregister(onMapFeaturesChanged)
        }
    }, [])

    // our different map layers
    useBackgroundLayer(map, mapOptions.selectedStyle)
    useExternalMVTLayer(map, mapOptions.externalMVTEnabled)
    useMapBorderLayer(map, info.bbox)
    useAreasLayer(map, settings.drawAreasEnabled, query.customModelStr, query.customModelEnabled)
    useRoutingGraphLayer(map, mapOptions.routingGraphEnabled)
    useUrbanDensityLayer(map, mapOptions.urbanDensityEnabled)
    usePathsLayer(map, route.routingResult.paths, route.selectedPath, query.queryPoints)
    useQueryPointsLayer(map, query.queryPoints)
    usePathDetailsLayer(map, pathDetails)
    const isSmallScreen = useMediaQuery({ query: '(max-width: 44rem)' })
    return (
        <ShowDistanceInMilesContext.Provider value={settings.showDistanceInMiles}>
            <div className={styles.appWrapper}>
                <MapPopups map={map} pathDetails={pathDetails} mapFeatures={mapFeatures} />
                <ContextMenu map={map} route={route} queryPoints={query.queryPoints} />
                {isSmallScreen ? (
                    <SmallScreenLayout
                        query={query}
                        route={route}
                        map={map}
                        mapOptions={mapOptions}
                        error={error}
                        encodedValues={info.encoded_values}
                        drawAreas={settings.drawAreasEnabled}
                    />
                ) : (
                    <LargeScreenLayout
                        query={query}
                        route={route}
                        map={map}
                        mapOptions={mapOptions}
                        error={error}
                        encodedValues={info.encoded_values}
                        drawAreas={settings.drawAreasEnabled}
                    />
                )}
            </div>
        </ShowDistanceInMilesContext.Provider>
    )
}

interface LayoutProps {
    query: QueryStoreState
    route: RouteStoreState
    map: Map
    mapOptions: MapOptionsStoreState
    error: ErrorStoreState
    encodedValues: object[]
    drawAreas: boolean
}

function LargeScreenLayout({ query, route, map, error, mapOptions, encodedValues, drawAreas }: LayoutProps) {
    const [showSidebar, setShowSidebar] = useState(true)
    const [showCustomModelBox, setShowCustomModelBox] = useState(false)
    const [heading1, setHeading1] = useState('')
    const [heading2, setHeading2] = useState('')
    const areHeadingsValid = () => {
        if (heading1 === '' || heading2 === '') return false
        return true
    }
    // const handleHeadingChange = (index: number, value: string) => {
    //     if (index === 0) {
    //         // console.log(value)
    //         setHeading1(value)
    //         // console.log(heading1)
    //     } else if (index === 1) {
    //         // console.log(value)
    //         setHeading2(value)
    //     }

    //     if (areHeadingsValid()) {
    //         // console.log('heading1' + heading1)
    //         // console.log('heading2' + heading2)
    //         const newHeadings = [parseFloat(heading1), parseFloat(heading2)]
    //         query = { ...query, headings: newHeadings }
    //         // console.log(query)
    //         Dispatcher.dispatch(new SetHeadings(query.headings))
    //     }
    // }
    const handleHeadingChange = () => {
        if (areHeadingsValid()) {
            // console.log('heading1' + heading1)
            // console.log('heading2' + heading2)
            const newHeadings = [parseFloat(heading1), parseFloat(heading2)]
            query = { ...query, headings: newHeadings }
            // console.log(query)
            Dispatcher.dispatch(new SetHeadings(query.headings))
        } else {
            query = { ...query, headings: [] }

            Dispatcher.dispatch(new SetHeadings(query.headings))
        }
    }
    return (
        <>
            {showSidebar ? (
                <div className={styles.sidebar}>
                    <div className={styles.sidebarContent} id={SIDEBAR_CONTENT_ID}>
                        <PlainButton onClick={() => setShowSidebar(false)} className={styles.sidebarCloseButton}>
                            <Cross />
                        </PlainButton>
                        <RoutingProfiles
                            routingProfiles={query.profiles}
                            selectedProfile={query.routingProfile}
                            showCustomModelBox={showCustomModelBox}
                            toggleCustomModelBox={() => setShowCustomModelBox(!showCustomModelBox)}
                            customModelBoxEnabled={query.customModelEnabled}
                        />
                        {showCustomModelBox && (
                            <CustomModelBox
                                customModelEnabled={query.customModelEnabled}
                                encodedValues={encodedValues}
                                customModelStr={query.customModelStr}
                                queryOngoing={query.currentRequest.subRequests[0]?.state === RequestState.SENT}
                                drawAreas={drawAreas}
                            />
                        )}
                        <Search points={query.queryPoints} />
                        <input
                            type="number"
                            placeholder="Heading 1"
                            // onKeyPress={e => {
                            //     if (e.key === 'Enter') {
                            //         handleHeadingChange(0, e.currentTarget.value)
                            //     }
                            // }}
                            onChange={e => {
                                setHeading1(e.currentTarget.value)
                            }}
                        />
                        <input
                            type="number"
                            placeholder="Heading 2"
                            // onKeyPress={e => {
                            //     if (e.key === 'Enter') {
                            //         handleHeadingChange(1, e.currentTarget.value)
                            //     }
                            // }}
                            onChange={e => {
                                setHeading2(e.currentTarget.value)
                            }}
                        />
                        {!areHeadingsValid() && (
                            <div style={{ color: 'red' }}>Headings must both have values or both be empty.</div>
                        )}
                        <button
                            onClick={e => {
                                handleHeadingChange()
                            }}
                        >
                            Apply
                        </button>
                        <div>{!error.isDismissed && <ErrorMessage error={error} />}</div>
                        <RoutingResults
                            info={route.routingResult.info}
                            paths={route.routingResult.paths}
                            selectedPath={route.selectedPath}
                            currentRequest={query.currentRequest}
                            profile={query.routingProfile.name}
                        />
                        <div>
                            <PoweredBy />
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.sidebarWhenClosed} onClick={() => setShowSidebar(true)}>
                    <PlainButton className={styles.sidebarOpenButton}>
                        <Menu />
                    </PlainButton>
                </div>
            )}
            <div className={styles.popupContainer} id={POPUP_CONTAINER_ID} />
            <div className={styles.onMapRightSide}>
                <MapOptions {...mapOptions} />
                <LocationButton queryPoints={query.queryPoints} />
            </div>
            <div className={styles.map}>
                <MapComponent map={map} />
            </div>

            <div className={styles.pathDetails}>
                <PathDetails selectedPath={route.selectedPath} />
            </div>
        </>
    )
}

function SmallScreenLayout({ query, route, map, error, mapOptions, encodedValues, drawAreas }: LayoutProps) {
    return (
        <>
            <div className={styles.smallScreenSidebar}>
                <MobileSidebar
                    query={query}
                    route={route}
                    error={error}
                    encodedValues={encodedValues}
                    drawAreas={drawAreas}
                />
            </div>
            <div className={styles.smallScreenMap}>
                <MapComponent map={map} />
            </div>
            <div className={styles.smallScreenMapOptions}>
                <div className={styles.onMapRightSide}>
                    <MapOptions {...mapOptions} />
                    <LocationButton queryPoints={query.queryPoints} />
                </div>
            </div>

            <div className={styles.smallScreenRoutingResult}>
                <RoutingResults
                    info={route.routingResult.info}
                    paths={route.routingResult.paths}
                    selectedPath={route.selectedPath}
                    currentRequest={query.currentRequest}
                    profile={query.routingProfile.name}
                />
            </div>

            <div className={styles.smallScreenPoweredBy}>
                <PoweredBy />
            </div>
        </>
    )
}
