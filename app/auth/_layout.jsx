import { NotesProvider } from "@/context/NotesContext";
import { Stack } from "expo-router";
const AuthLayout = () => {
    return (
         <NotesProvider>
             <Stack 
             screenOptions={{
                 headerShown: false,
             }}
             />
         </NotesProvider>

    );
}
export default AuthLayout;