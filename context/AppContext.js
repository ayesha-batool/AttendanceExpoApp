import React, { createContext, useContext, useEffect, useState } from "react";
import { dataService, useNetworkStatus } from "../services/unifiedDataService";

// Create context
const AppContext = createContext();

// Provider
export const AppProvider = ({ children }) => {
    const [Items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [currentCollection, setCurrentCollection] = useState("employees");
    const isConnected = useNetworkStatus();

    const fetchItems = async (collectionId) => {
        setIsLoading(true);
        let data = []; // ✅ Declare it here so it's available outside try block
    
        try {
            data = await dataService.getItems(collectionId);
            setItems(data);
            setFilteredItems(data);
            if (collectionId) {
                setCurrentCollection(collectionId);
            }
        } catch (err) {
            console.error("Fetch failed:", err);
        } finally {
            setIsLoading(false);
        }
    };
    

    const filterItems = (query) => {
        setSearchQuery(query);
        if (!query.trim()) return setFilteredItems(Items);

        const lower = query.toLowerCase();
        const filtered = Items.filter((emp) =>
            (emp.fullName && emp.fullName.toLowerCase().includes(lower)) ||
            (emp.phone && emp.phone.includes(lower))
        );
        setFilteredItems(filtered);
    };

    const deleteItem = async (docId) => {
        try {
            await dataService.deleteData(`Items_${docId}`, docId, currentCollection);
            await fetchItems(currentCollection);
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };


    useEffect(() => {
        if (isConnected) {
            dataService.syncPendingData();
        }
    }, [isConnected]);

    return (
        <AppContext.Provider
            value={{
                Items,
                filteredItems,
                searchQuery,
                selectedItem,
                setSelectedItem,
                setSearchQuery,
                filterItems,
                isLoading,
                fetchItems,
                deleteItem,
                isConnected,
                currentCollection,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

// Hook
export const useApp = () => useContext(AppContext);
