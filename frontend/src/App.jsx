import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import DescriptionPage from "./components/DescriptionPage";
import ImageNotFound from "./components/ImageNotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/description" element={<DescriptionPage />} />
      <Route path="/image-not-found" element={<ImageNotFound />} />
    </Routes>
  );
}

export default App;
