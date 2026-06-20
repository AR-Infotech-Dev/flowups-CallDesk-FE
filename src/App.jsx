import { BrowserRouter } from "react-router-dom";
import AuthProvider from "@auth/components/AuthProvider";
import { LoaderProvider } from "@context/LoaderContext";
import MainRoutes from "@routes/MainRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
  return (
    <BrowserRouter>
      <LoaderProvider>
        <AuthProvider>
          <ToastContainer
            position="top-right"
            autoClose={1800}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            className="toast-container-compact"
            toastClassName="toast-item-compact"
            bodyClassName="toast-body-compact"
            progressClassName="toast-progress-compact"
          />
          <MainRoutes />
        </AuthProvider>
      </LoaderProvider>
    </BrowserRouter>
  );
}

export default App;
