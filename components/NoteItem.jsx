import { useNoteOperations } from "@/hooks/useNoteOperations";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

const NoteItem = ({ note }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(note.text);
  const { editNote, deleteNote } = useNoteOperations();

  const handleSave = async () => {
    const result = await editNote(note.$id, editedText);
    if (result.success) {
      setIsEditing(false);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Failed to update note',
      });
      setEditedText(note.text);
    }
  };

  const handleDelete = async () => {
    const result = await deleteNote(note.$id);
    if (!result.success) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Failed to delete note',
      });
    }
  };

  return (
    <View style={styles.noteContainer}>
      {isEditing ? (
        <TextInput
          style={styles.text}
          value={editedText}
          onChangeText={setEditedText}
          autoFocus
          onSubmitEditing={handleSave}
          returnKeyType="done"
        />
      ) : (
        <Text style={styles.text}>{note.text}</Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={isEditing ? handleSave : () => setIsEditing(true)}>
          <Text>{isEditing ? "✅" : "✏️"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text>❌</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  noteContainer: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    borderWidth: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    borderColor: "#ddd",
  },
  text: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});

export default NoteItem;
