import { createContext, useContext, useEffect, useState } from "react";
import { hideGlobalLoader, showGlobalLoader, subscribeLoader } from "./loaderStore";

const LoaderContext = createContext(null);

export function LoaderProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => subscribeLoader(setIsLoading), []);

  return (
    <LoaderContext.Provider
      value={{
        isLoading,
        showLoader: showGlobalLoader,
        hideLoader: hideGlobalLoader,
      }}
    >
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  const loader = useContext(LoaderContext);

  if (!loader) {
    throw new Error("useLoader must be used inside LoaderProvider");
  }

  return loader;
}
