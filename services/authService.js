import { ID } from "appwrite";
import { account } from "./noteService";

const authService = {
  async login(email, password) {
    try {
      await account.deleteSession("current").catch(() => { });
      const session = await account.createEmailPasswordSession(email, password);
      console.log("Login successful:", session);
      return session;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async register(email, password, name) {
    try {
      await account.create(ID.unique(), email, password);
      await account.updateName(name);
      const updatedUser = await account.get(); // 🔁 fetch updated info
      console.log(updatedUser)
      return updatedUser;
      
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  async getUser() {
    try {
      const user = await account.get();
      console.log("User fetched successfully:", user);
      return user;
    } catch (error) {
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('missing scope (account)') ||
        errorMessage.includes('guests') ||
        errorMessage.includes('User (role: guests)') ||
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized')
      ) {
        return null;
      }
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  async logout() {
    try {
      await account.deleteSession("current");
      console.log("Logout successful");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  },
};

export { authService };

