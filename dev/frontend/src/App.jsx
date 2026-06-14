import Login from "./auth/login/login.jsx";
import ModelSetup from "./auth/model-setup/model-setup.jsx";
import SignUp from "./auth/signup/signup.jsx";
import Test from "./auth/test/test.jsx";
import VerifyEmail from "./auth/verify-email/verify-email.jsx";
import WatchlistSetup from "./auth/watchlist-setup/watchlist-setup.jsx";

export default function App() {
  if (window.location.pathname === "/login") {
    return <Login />;
  }

  if (window.location.pathname === "/verify-email") {
    return <VerifyEmail />;
  }

  if (window.location.pathname === "/model-setup") {
    return <ModelSetup />;
  }

  if (window.location.pathname === "/test") {
    return <Test />;
  }

  if (window.location.pathname === "/watchlist-setup") {
    return <WatchlistSetup />;
  }

  return <SignUp />;
}
