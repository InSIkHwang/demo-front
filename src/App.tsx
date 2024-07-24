import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import CustomerList from "./pages/CustomerList";
import Footer from "./components/Footer";

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Header />
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/customerlist" element={<CustomerList />}></Route>
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
