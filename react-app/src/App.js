import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { Container } from '@material-ui/core';

import { AppLayout } from './layouts';

import './App.css';



function App() {
  return (
    <Router>
      <Container className="App">
        <AppLayout />
      </Container>
    </Router>

  );
}

export default App;
