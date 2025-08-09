import LoadingOverlay from "@/components/LoadingOverlay";
import NoteList from "@/components/NotesList";
import { useNotes } from "@/context/NotesContext";
import { useNoteOperations } from "@/hooks/useNoteOperations";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
const NoteScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [newNote, setNewNote] = useState("");
  
  const { notes, loading } = useNotes();
  const { isLoading } = useNoteOperations();

  return (
    <View style={styles.container}>
      {/* <CentralBox /> */}
      <NoteList notes={notes} />
      
      {/* <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Add Note</Text>
      </TouchableOpacity>

      <AddNoteModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        newNote={newNote}
        setNewNote={setNewNote}
      /> */}
      
      {(loading || isLoading) && <LoadingOverlay />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  button: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 34,
  },
});

export default NoteScreen;
