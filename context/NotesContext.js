import { useAuth } from "@/context/AuthContext";
import noteService from "@/services/noteService";
import { createContext, useContext, useEffect, useState } from "react";
const NotesContext = createContext();

// Add localStorage utility for offline notes
const LOCAL_NOTES_KEY = 'offline_notes';
function getOfflineNotes() {
  try {
    const notes = localStorage.getItem(LOCAL_NOTES_KEY);
    return notes ? JSON.parse(notes) : [];
  } catch {
    return [];
  }
}

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchNotes = async () => {
    setLoading(true);
    try {
      if (!navigator.onLine) {
        // Load from localStorage if offline
        setNotes(getOfflineNotes());
        return;
      }
      await new Promise((res) => setTimeout(res, 1000)); // Reduced delay
      const data = await noteService.getNote();
      setNotes(data);
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }
    fetchNotes();
  }, [user]);

  return (
    <NotesContext.Provider value={{ notes, setNotes, loading, setLoading }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => useContext(NotesContext);
