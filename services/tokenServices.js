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
  getAllTokens = async (query) => {
    try {
      const tokens = await tokenService.findAll({
        where: query,
      });
      return tokens;
    } catch (error) {
      console.error("Error fetching all tokens:", error);
      throw error;
    }
  };
  updateToken = async (query) => {
    try {
      const token = await tokenService.upsert(query);
      return token;
    } catch (error) {
      console.error("Error updating token:", error);
      throw error;
    }
  };
}

export default new TokenServices();
