import { WatchlistSavingForm } from "@/components/watchlist-saving-form";
import "./watchlist-save.css";

export default function WatchlistSaving() {
  return (
    <main className="watchlist-save-page">
      <div className="watchlist-save-shell">
        <WatchlistSavingForm />
      </div>
    </main>
  );
}
