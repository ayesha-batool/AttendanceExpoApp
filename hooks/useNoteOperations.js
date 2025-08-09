import { useNotes } from '@/context/NotesContext';
import noteService from '@/services/noteService';
import React, { useState } from 'react'; // Added missing import for React

// Utility functions for localStorage
const LOCAL_NOTES_KEY = 'offline_notes';

function getOfflineNotes() {
  try {
    const notes = localStorage.getItem(LOCAL_NOTES_KEY);
    return notes ? JSON.parse(notes) : [];
  } catch {
    return [];
  }
}

function setOfflineNotes(notes) {
  localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
}

function clearOfflineNotes() {
  localStorage.removeItem(LOCAL_NOTES_KEY);
}

// Sync offline notes to Appwrite when online
async function syncOfflineNotes(setNotes) {
  const offlineNotes = getOfflineNotes();
  if (offlineNotes.length === 0) return;
  for (const note of offlineNotes) {
    try {
      const newNote = await noteService.addNote(note.text);
      setNotes(prev => [...prev, newNote]);
    } catch (e) {
      // If sync fails, keep the note in localStorage
      return;
    }
  }
  clearOfflineNotes();
}

export const useNoteOperations = () => {
  const { setNotes } = useNotes();
  const [isLoading, setIsLoading] = useState(false);

  // Sync offline notes when online
  React.useEffect(() => {
    function handleOnline() {
      syncOfflineNotes(setNotes);
    }
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      syncOfflineNotes(setNotes);
    }
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [setNotes]);

  const executeOperation = async (operation, fallback) => {
    setIsLoading(true);
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      if (fallback) {
        fallback();
        return { success: true, data: null, offline: true };
      }
      console.error('Operation failed:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = async (text) => {
    if (!text.trim()) return { success: false, error: 'Note cannot be empty' };
    if (!navigator.onLine) {
      // Store offline
      const offlineNotes = getOfflineNotes();
      const newNote = { text, $id: `offline-${Date.now()}` };
      setOfflineNotes([...offlineNotes, newNote]);
      setNotes(prevNotes => [...prevNotes, newNote]);
      return { success: true, data: newNote, offline: true };
    }
    return executeOperation(async () => {
      const newNote = await noteService.addNote(text);
      setNotes(prevNotes => [...prevNotes, newNote]);
      return newNote;
    });
  };

  const editNote = async (noteId, newText) => {
    if (!newText.trim()) return { success: false, error: 'Note cannot be empty' };
    if (!navigator.onLine && noteId.startsWith('offline-')) {
      // Edit offline note
      const offlineNotes = getOfflineNotes();
      const updatedNotes = offlineNotes.map(note => note.$id === noteId ? { ...note, text: newText } : note);
      setOfflineNotes(updatedNotes);
      setNotes(prevNotes => prevNotes.map(note => note.$id === noteId ? { ...note, text: newText } : note));
      return { success: true, data: { $id: noteId, text: newText }, offline: true };
    }
    return executeOperation(async () => {
      const updatedNote = await noteService.editNote(noteId, newText);
      setNotes(prevNotes => 
        prevNotes.map(note => note.$id === noteId ? updatedNote : note)
      );
      return updatedNote;
    });
  };

  const deleteNote = async (noteId) => {
    if (!navigator.onLine && noteId.startsWith('offline-')) {
      // Delete offline note
      const offlineNotes = getOfflineNotes();
      const updatedNotes = offlineNotes.filter(note => note.$id !== noteId);
      setOfflineNotes(updatedNotes);
      setNotes(prevNotes => prevNotes.filter(note => note.$id !== noteId));
      return { success: true, offline: true };
    }
    return executeOperation(async () => {
      await noteService.deleteNote(noteId);
      setNotes(prevNotes => prevNotes.filter(note => note.$id !== noteId));
    });
  };

  return { addNote, editNote, deleteNote, isLoading };
}; 