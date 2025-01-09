import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import PresenterPage from './pages/PresenterPage';
import SessionPage from './pages/SessionPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/session/:id" element={<SessionPage />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/presenter" element={<PresenterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
