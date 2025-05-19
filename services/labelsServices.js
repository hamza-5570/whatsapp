import Labels from "../models/labels.js";

class LabelsServices {
  createLabels = async (labelsData) => {
    try {
      console.log("Creating labels with data:", labelsData);
      const labels = await Labels.upsert(labelsData);
      return labels;
    } catch (error) {
      console.error("Error creating labels:", error);
      throw error;
    }
  };
}
export default new LabelsServices();
