import { NotesProvider } from "@/context/NotesContext";
import { AuthProvider } from "@/context/AuthContext"; // make sure this file exists
import { Stack } from "expo-router";

const NoteLayout = () => {
  return (
    <AuthProvider>
      <NotesProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </NotesProvider>
    </AuthProvider>
  );
};

export default NoteLayout;
