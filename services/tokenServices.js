import tokenService from "../models/token.js";

class TokenServices {
  createToken = async (tokenData) => {
    try {
      const token = await tokenService.create(tokenData);
      return token;
    } catch (error) {
      console.error("Error creating token:", error);
      throw error;
    }
  };

  getTokenByUserId = async (query) => {
    try {
      const token = await tokenService.findOne({
        where: query,
      });
      return token;
    } catch (error) {
      console.error("Error fetching token by user ID:", error);
      throw error;
    }
  };

  updateToken = async (query, tokenData) => {
    try {
      const token = await tokenService.update(tokenData, {
        where: query,
      });
      return token;
    } catch (error) {
      console.error("Error updating token:", error);
      throw error;
    }
  };
}

export default new TokenServices();
