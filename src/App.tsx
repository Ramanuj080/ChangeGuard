import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import UploadProject from './pages/UploadProject';
import Analyze from './pages/Analyze';
import Results from './pages/Results';
import Architecture from './pages/Architecture';
import Incidents from './pages/Incidents';

function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="upload" element={<UploadProject />} />
          <Route path="analyze" element={<Analyze />} />
          <Route path="results" element={<Results />} />
          <Route path="architecture" element={<Architecture />} />
          <Route path="incidents" element={<Incidents />} />
        </Route>
      </Routes>
    </ProjectProvider>
  );
}

export default App;
