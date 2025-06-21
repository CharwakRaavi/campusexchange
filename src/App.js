import "./App.css";

import Loginpage from "./pages/Loginpage.jsx";
import Signuppage from "./pages/Signuppage.jsx";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Myorders from "./Myorders.jsx";
import ImageGallery from "./Frontendpage.jsx";

const sampleImages = [
  { id: "1", url: "path/to/textbook.jpg", title: "Textbook", description: "Engineering Textbooks", price: 400 },
  // Add more images as needed
];

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/SignUp" element={<Signuppage />} />
        <Route path="/Login" element={<Loginpage />} />
        <Route path="/SignUp/Login" element={<Loginpage />} /> {/* Consider removing */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/user/dashboard" element={<Dashboard />} />
        <Route path="/myorders" element={<Myorders />} />
        <Route path="/gallery" element={<ImageGallery images={sampleImages} />} />
      </Routes>
    </div>
  );
}

export default App;