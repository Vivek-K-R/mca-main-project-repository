import Student from "../models/Student.js";

export const getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addStudent = async (req, res) => {
  try {
    const { name, email } = req.body;
    const newStudent = new Student({ name, email });
    await newStudent.save();
    res.json({ message: "Student added successfully", student: newStudent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
