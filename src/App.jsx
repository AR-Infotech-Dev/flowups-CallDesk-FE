import { BrowserRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import AuthProvider from "@auth/components/AuthProvider";
import { LoaderProvider } from "@context/LoaderContext";
import MainRoutes from "@routes/MainRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FlowupSLoader from "./components/ui/FlowupsLoader";


function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <FlowupSLoader />;
  }

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
