import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import EvaluatePage from "./components/EvaluatePage";
import StudentDashboard from "./components/StudentDashboard";
import UploadPage from "./components/UploadStud";
import EvaluationPanel from "./components/EvaluationPanel";
import StudentView from "./components/StudentView";
import Login from "./components/Login";
import AnswerKeyUpload from "./components/AnswerKeyUpload";
import Signup from "./components/Registration";



function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Login />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/upload" element={<UploadPage />} /> 
        <Route path="/teacher/dashboard" element={<EvaluatePage />} /> 
        <Route path="/teacher/evaluate/:id" element={<EvaluationPanel />} /> 
        <Route path="/student/view/:id" element={<StudentView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/teacher/answer-keys" element={<AnswerKeyUpload />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
