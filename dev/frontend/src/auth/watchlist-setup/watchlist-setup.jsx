import { WatchlistSetupForm } from "@/components/watchlist-setup-form";
import "./watchlist-setup.css";

export default function WatchlistSetup() {
  return (
    <main className="watchlist-setup-page">
      <div className="watchlist-setup-shell">
        <WatchlistSetupForm />
      </div>
    </main>
  );
}
