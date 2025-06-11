import userService from "../models/user.js";

class UserServices {
  createUser = async (userData) => {
    try {
      const user = await userService.create(userData);
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

  getUserById = async (query) => {
    try {
      const user = await userService.findOne({
        where: { ...query },
      });
      return user;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
  };

  getAllUsers = async (query) => {
    try {
      const users = await userService.findAll({
        where: { ...query },
      });
      return users;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  };

  updateUser = async (data, query) => {
    try {
      const user = await userService.update(data, {
        where: query,
      });
      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };
}
export default new UserServices();
