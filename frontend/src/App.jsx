import { useEffect } from "react";
import Home from "./components/Home/Home";
import { TypewriterEffectSmoothDemo } from "./components/Landing/TypewriterEffectSmoothDemo";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";

const App = () => {

  useEffect(() => {
    const wakeUpCall = async () => {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/ping`);
      console.log(response.data.message);
    }
    wakeUpCall();
  }, []); 
  
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<TypewriterEffectSmoothDemo />}></Route>
          <Route path="/Home" element={<Home />}></Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
