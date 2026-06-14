import Login from "./auth/login/login.jsx";
import ModelSetup from "./config_setup/model-setup/model-setup.jsx";
import SignUp from "./auth/signup/signup.jsx";
import Test from "./auth/test/test.jsx";
import VerifyEmail from "./auth/verify-email/verify-email.jsx";
import WatchlistSetup from "./config_setup/watchlist-setup/watchlist-setup.jsx";
import WatchlistSaving from "./config_setup/watchlist-save/watchlist-save.jsx";
import { getSessionToken } from "./utilities/api.js";

function requireSession(page) {
  if (!getSessionToken()) {
    window.location.href = "/signup";
    return null;
  }

  return page;
}

export default function App() {
  if (window.location.pathname === "/signup") {
    return <SignUp />;
  }

  if (window.location.pathname === "/login") {
    return <Login />;
  }

  if (window.location.pathname === "/verify-email") {
    return <VerifyEmail />;
  }

  if (window.location.pathname === "/model-setup") {
    return requireSession(<ModelSetup />);
  }

  if (window.location.pathname === "/test") {
    return <Test />;
  }

  if (window.location.pathname === "/watchlist-setup") {
    return requireSession(<WatchlistSetup />);
  }
  if (window.location.pathname === "/watchlist-save") {
    return requireSession(<WatchlistSaving />);
  }

  return <SignUp />;
}
