import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./pages/Auth/signup.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
