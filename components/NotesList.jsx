import { FlatList } from "react-native";
import NoteItem from "./NoteItem";

const NotesList = ({ notes }) => (
  <FlatList
    data={notes}
    keyExtractor={(item) => item?.$id?.toString() || Math.random().toString()}
    renderItem={({ item }) => <NoteItem note={item} />}
    style={{ flex: 1, padding: 0 }}
  />
);

export default NotesList;
