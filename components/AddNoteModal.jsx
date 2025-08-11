import { useNoteOperations } from "@/hooks/useNoteOperations";
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { formatErrorMessage, validateForm, VALIDATION_SCHEMAS } from "../utils/validation";

const AddNoteModal = ({ modalVisible, setModalVisible, newNote, setNewNote }) => {
  const { addNote, isLoading } = useNoteOperations();
     
  const handleSave = async () => {
    try {
      // Validate the note
      const validation = validateForm({ content: newNote }, VALIDATION_SCHEMAS.note);
      
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        Toast.show({
          type: 'error',
          text1: 'Validation Error',
          text2: firstError || 'Please enter a valid note',
        });
        return;
      }

      const result = await addNote(newNote);
      if (result.success) {
        // Removed success toast
        setNewNote("");
        setModalVisible(false);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: formatErrorMessage(result.error) || 'Failed to add note',
        });
      }
    } catch (error) {
      console.error('Error saving note:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: formatErrorMessage(error),
      });
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add a New Note</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type your note here..."
              multiline
              value={newNote}
              onChangeText={setNewNote}
            />
            <TouchableOpacity style={styles.button} onPress={handleSave} disabled={isLoading}>
              <Text style={styles.buttonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
    modalContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        zIndex: 1000,
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        fontSize: 20,
        color: '#666',
        fontWeight: 'bold',
    },
    formContainer: {
        padding: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
export default AddNoteModal;