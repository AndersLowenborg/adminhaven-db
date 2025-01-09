import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import LoginPage from "@/pages/LoginPage";
import AdminPage from "@/pages/AdminPage";
import SessionPage from "@/pages/SessionPage";
import UserPage from "@/pages/UserPage";
import PresenterPage from "@/pages/PresenterPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/session/:id" element={<SessionPage />} />
        <Route path="/presenter/:id" element={<PresenterPage />} />
        <Route path="/user/:id" element={<UserPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;