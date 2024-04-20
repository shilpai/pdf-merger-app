import React from "react";
import PdfMerger from "./components/PdfMerger";
import { CssBaseline, Container } from "@mui/material";
import Header from "./components/Header"
import './App.css'

function App() {
  return (
    <React.Fragment>
      <Header/>
      <CssBaseline />
      <Container maxWidth="sm" >
        <PdfMerger />
      </Container>
    </React.Fragment>
  );
}

export default App;
