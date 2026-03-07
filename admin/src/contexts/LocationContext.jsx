import { createContext, useContext, useState } from 'react'

export const LOCATIONS = [
    { id: 'north-capitol', name: 'North Capitol' },
    { id: 'mt-pleasant', name: 'Mt Pleasant' },
    { id: 'georgia-ave', name: 'Georgia Ave' },
    { id: 'columbia-rd', name: 'Columbia Rd' },
]

const STORAGE_KEY = 'selectedLocation'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
    const [selectedLocation, setSelectedLocationState] = useState(
        () => localStorage.getItem(STORAGE_KEY) || 'north-capitol'
    )

    const setSelectedLocation = (id) => {
        localStorage.setItem(STORAGE_KEY, id)
        setSelectedLocationState(id)
    }

    const currentLocation = LOCATIONS.find((l) => l.id === selectedLocation) || LOCATIONS[0]

    return (
        <LocationContext.Provider value={{ selectedLocation, setSelectedLocation, currentLocation, LOCATIONS }}>
            {children}
        </LocationContext.Provider>
    )
}

export function useLocation() {
    return useContext(LocationContext)
}
