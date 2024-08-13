import React from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import CustomerList from "./pages/CustomerList";
import Footer from "./components/Footer";
import SupplierList from "./pages/SupplierList";
import ShipList from "./pages/ShipList";
import MakeInquiry from "./pages/MakeInquiry";
import InquiryList from "./pages/InquiryList";
import { ThemeProvider } from "styled-components";
import theme from "./style/Theme";

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <ThemeProvider theme={theme}>
        <Header />
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/customerlist" element={<CustomerList />}></Route>
          <Route path="/supplierlist" element={<SupplierList />}></Route>
          <Route path="/shiplist" element={<ShipList />}></Route>
          <Route path="/makeinquiry" element={<MakeInquiry />}></Route>
          <Route
            path="/makeinquiry/:customerInquiryId"
            element={<MakeInquiry />}
          />
          <Route path="/inquirylist" element={<InquiryList />}></Route>
        </Routes>
        <Footer />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
