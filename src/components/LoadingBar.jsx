import { useLoader } from "../context/LoaderContext";

function LoadingBar() {
  const { isLoading } = useLoader();

  return (
    <div className={`global-loading-bar ${!isLoading ? "hidden" : ""}`}>
      <div className="global-loading-track"></div>
    </div>
  );
}

export default LoadingBar;