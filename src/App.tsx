import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header";
import CustomerList from "./pages/CustomerList";
import Footer from "./components/Footer";
import SupplierList from "./pages/SupplierList";
import ShipList from "./pages/ShipList";
import MakeInquiry from "./pages/MakeInquiry";
import CustomerInquiryList from "./pages/CustomerInquiryList";
import MakeOffer from "./pages/MakeOffer";
import UserLogin from "./pages/UserLogin";
import { ThemeProvider } from "styled-components";
import theme from "./style/Theme";
import { refreshToken, removeTokens } from "./api/auth";
import LoadingSpinner from "./components/LoadingSpinner";
import OfferList from "./pages/OfferList";
import TrashList from "./pages/TrashList";
import OrderList from "./pages/OrderList";
import AddSupplierOnInquiry from "./pages/AddSupplierOnInquiry";
import UserSignUp from "./pages/UserSignUp";
import MakeComplexInquiry from "./pages/MakeComplexInquiry";
import OrderDetail from "./pages/OrderDetail";
import InvoiceList from "./pages/InvoiceList";
import InvoiceDetail from "./pages/InvoiceDetail";
import LogisticsList from "./pages/LogisticsList";
import LogisticsDetail from "./pages/LogisticsDetail";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 리프레시 토큰을 이용해 액세스 토큰을 갱신
        const newAccessToken = await refreshToken();
        // 액세스 토큰이 성공적으로 갱신되면 인증 상태를 설정
        if (newAccessToken) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        // 리프레시 토큰 갱신 실패 시 인증 상태를 false로 설정
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    removeTokens(); // 토큰 제거
  };

  if (loading) {
    return <LoadingSpinner />; // 로딩 중 화면
  }

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <CustomerInquiryList />
              ) : (
                <Navigate to="/userlogin" />
              )
            }
          />
          <Route
            path="/userlogin"
            element={<UserLogin onLogin={handleLogin} />}
          />
          <Route path="/usersignup" element={<UserSignUp />} />
          <Route
            path="/home"
            element={isAuthenticated ? <Home /> : <Navigate to="/home" />}
          />
          <Route
            path="/customerlist"
            element={
              isAuthenticated ? <CustomerList /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/supplierlist"
            element={
              isAuthenticated ? <SupplierList /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/shiplist"
            element={
              isAuthenticated ? <ShipList /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/makeinquiry"
            element={
              isAuthenticated ? <MakeInquiry /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/addsupplierininquiry/:documentNumber"
            element={
              isAuthenticated ? (
                <AddSupplierOnInquiry />
              ) : (
                <Navigate to="/userlogin" />
              )
            }
          />
          <Route
            path="/makeinquiry/:customerInquiryId"
            element={
              isAuthenticated ? <MakeInquiry /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/customerInquirylist"
            element={
              isAuthenticated ? (
                <CustomerInquiryList />
              ) : (
                <Navigate to="/userlogin" />
              )
            }
          />
          <Route
            path="/supplierInquirylist"
            element={
              isAuthenticated ? <OfferList /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/makeoffer/:documentId"
            element={
              isAuthenticated ? <MakeOffer /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/orderlist"
            element={
              isAuthenticated ? <OrderList /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/order/:orderId"
            element={
              isAuthenticated ? <OrderDetail /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/logisticslist"
            element={
              isAuthenticated ? <LogisticsList /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/logistics/:logisticsId"
            element={
              isAuthenticated ? (
                <LogisticsDetail />
              ) : (
                <Navigate to="/userlogin" />
              )
            }
          />
          <Route
            path="/invoiceList"
            element={
              isAuthenticated ? <InvoiceList /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/invoice/:invoiceId"
            element={
              isAuthenticated ? <InvoiceDetail /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/trashlist"
            element={
              isAuthenticated ? <TrashList /> : <Navigate to="/userlogin" />
            }
          />
          <Route
            path="/makecomplexinquiry"
            element={
              isAuthenticated ? (
                <MakeComplexInquiry />
              ) : (
                <Navigate to="/userlogin" />
              )
            }
          />
          <Route
            path="/makecomplexinquiry/:complexInquiryId"
            element={
              isAuthenticated ? (
                <MakeComplexInquiry />
              ) : (
                <Navigate to="/userlogin" />
              )
            }
          />
        </Routes>
        <Footer />
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
