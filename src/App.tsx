import { HashRouter, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Landing from './pages/Landing';
import Simulator from './pages/Simulator';
import ModelExplainer from './pages/ModelExplainer';
import Results from './pages/Results';

export default function App() {
  return (
    <HashRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        <Nav />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"          element={<Landing />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/model"     element={<ModelExplainer />} />
            <Route path="/results"   element={<Results />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
