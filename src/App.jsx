import { BrowserRouter } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import MainRoutes from "./routes/MainRoutes";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LoaderProvider } from "./context/LoaderContext";


function App() {
  return (
    <BrowserRouter>
      <LoaderProvider>
        <AuthProvider>
          <ToastContainer
            position="top-right" // Position of the toast
            autoClose={2000}    // Close after 3s
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"     // light, dark, or colored
          />
          <MainRoutes />
        </AuthProvider>
      </LoaderProvider>
    </BrowserRouter>
  );
}

export default App;
