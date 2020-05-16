import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Box } from '@material-ui/core';

import { AppLayout } from './layouts';

import './App.css';

function App() {
  return (
    <Router>
      <Box className="App">
        <AppLayout />
      </Box>
    </Router>

  );
}

export default App;
