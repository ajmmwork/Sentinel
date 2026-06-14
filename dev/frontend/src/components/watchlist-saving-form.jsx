import { useEffect, useRef, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { save_watchlist } from "@/utilities/api";

export function WatchlistCardRow({ children, itemCount }) {
    const cardCount = Math.min(Math.max(itemCount, 1), 5);

    return (
        <div
            className="sentinel-watchlist-save-card-row"
            style={{ "--watchlist-card-count": cardCount }}
        >
            {children}
        </div>
    );
}

function getMatchStatusClass(asset) {
    const matchCount = asset.matches?.length ?? 0;

    if (matchCount > 1) {
        return "has-multiple-matches";
    }

    if (matchCount === 1) {
        return "has-one-match";
    }

    return "has-no-matches";
}

function getMatchStatusText(asset) {
    const matchCount = asset.matches?.length ?? 0;

    if (matchCount > 1) {
        return `${matchCount} possible matches`;
    }

    if (matchCount === 1) {
        return "Exact match found";
    }

    return "No match found";
}

export function WatchlistSavingForm() {

    const [watchlist, setWatchList] = useState([])
    const [selectedMatches, setSelectedMatches] = useState({})
    const [showIncompleteAlert, setShowIncompleteAlert] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [isMessageFading, setIsMessageFading] = useState(false)
    const [isSavingWatchlist, setIsSavingWatchlist] = useState(false)
    const messageTimerRef = useRef(null)
    const messageFadeTimerRef = useRef(null)
    const matchedAssetCount = watchlist.filter((asset) => (asset.matches?.length ?? 0) > 0).length;

    useEffect(() => {
        const savedData = sessionStorage.getItem("sentinel_validated_watchlist");

        if (savedData) {
            setWatchList(JSON.parse(savedData))
        }
    }, [])

    useEffect(() => {
        return () => {
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current)
            }
            if (messageFadeTimerRef.current) {
                clearTimeout(messageFadeTimerRef.current)
            }
        }
    }, [])

    function clearMessageTimers() {
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current)
        }
        if (messageFadeTimerRef.current) {
            clearTimeout(messageFadeTimerRef.current)
        }
    }

    function showTimedMessage(message, type) {
        clearMessageTimers()
        setIsMessageFading(false)

        if (type === "success") {
            setSuccessMessage(message)
            setErrorMessage("")
        } else {
            setErrorMessage(message)
            setSuccessMessage("")
        }

        messageFadeTimerRef.current = setTimeout(() => {
            setIsMessageFading(true)
        }, 4300)

        messageTimerRef.current = setTimeout(() => {
            setErrorMessage("")
            setSuccessMessage("")
            setIsMessageFading(false)
            messageTimerRef.current = null
            messageFadeTimerRef.current = null
        }, 5000)
    }

    function showError(message) {
        showTimedMessage(message, "error")
    }

    function showSuccess(message) {
        showTimedMessage(message, "success")
    }

    function clearMessages() {
        clearMessageTimers()
        setErrorMessage("")
        setSuccessMessage("")
        setIsMessageFading(false)
    }

    function getSelectedMatch(asset) {
        const matches = asset.matches ?? [];

        if (matches.length === 0) {
            return null;
        }

        const selectedMatchIndex = selectedMatches[asset.symbol] ?? 0;
        return matches[selectedMatchIndex] ?? matches[0];
    }

    function handleMatchSelect(symbol, selectedMatchIndex) {
        if (isSavingWatchlist) {
            return
        }

        clearMessages()
        setSelectedMatches((currentSelections) => ({
            ...currentSelections,
            [symbol]: Number(selectedMatchIndex),
        }));
    }

    function handleEditWatchlist() {
        if (isSavingWatchlist) {
            return
        }

        window.location.href = "/watchlist-setup";
    }

    function buildSelectedWatchlistPayload() {
        return watchlist
            .map((asset) => {
                const selectedMatch = getSelectedMatch(asset);

                if (!selectedMatch) {
                    return null;
                }

                return {
                    symbol: asset.symbol,
                    name: selectedMatch.name,
                    exchange: selectedMatch.exchange,
                    currency: selectedMatch.currency,
                };
            })
            .filter(Boolean);
    }

    async function saveSelectedWatchlist() {
        if (isSavingWatchlist) {
            return;
        }

        const selectedWatchlist = buildSelectedWatchlistPayload();

        if (selectedWatchlist.length === 0) {
            showError("No valid assets found in your watchlist. Please go back to watchlist setup.");
            return;
        }

        setIsSavingWatchlist(true);
        setShowIncompleteAlert(false);
        clearMessages();

        try {
            const result = await save_watchlist(selectedWatchlist);

            if (!result.ok) {
                showError(result.data?.detail || "Watchlist saving failed. Please try again.");
                return;
            }

            showSuccess(result.data?.detail || "Your watchlist has been saved.");
            window.location.href = "/";
        } catch {
            showError("Unable to reach the server. Please try again.");
        } finally {
            setIsSavingWatchlist(false);
        }
    }

    async function handleStartWatching() {
        if (isSavingWatchlist) {
            return;
        }

        if (matchedAssetCount === 0) {
            showError("No valid assets found in your watchlist. Please go back to watchlist setup.");
            return;
        }

        if (matchedAssetCount < 5) {
            setShowIncompleteAlert(true);
            return;
        }

        await saveSelectedWatchlist();
    }

    async function handleContinueAnyway() {
        await saveSelectedWatchlist();
    }

    function handleKeepEditing() {
        if (isSavingWatchlist) {
            return
        }

        setShowIncompleteAlert(false);
    }

    return (
        <Card className="sentinel-watchlist-save-card">
            <CardHeader className="sentinel-watchlist-save-header">
                <div className="sentinel-watchlist-save-brand">
                    <p className="sentinel-watchlist-save-name">SENTINEL</p>
                    <p className="sentinel-watchlist-save-tagline">Market intelligence with AI</p>
                </div>
                <CardTitle className="sentinel-watchlist-save-title">Confirm Your Watchlist</CardTitle>
                <CardDescription className="sentinel-watchlist-save-description">
                    Pick the matching security for each symbol.
                </CardDescription>
            </CardHeader>
            <CardContent className="sentinel-watchlist-save-content">
                {errorMessage && (
                    <Alert className={`sentinel-watchlist-save-message sentinel-watchlist-save-error${isMessageFading ? " is-fading" : ""}`}>
                        <AlertTitle>Check your watchlist</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                )}
                {successMessage && (
                    <Alert className={`sentinel-watchlist-save-message sentinel-watchlist-save-success${isMessageFading ? " is-fading" : ""}`}>
                        <AlertTitle>Watchlist ready</AlertTitle>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}
                <WatchlistCardRow itemCount={watchlist.length}>
                    {watchlist.map((asset) => (
                        (() => {
                            const selectedMatch = getSelectedMatch(asset);

                            return (
                                <Card
                                    key={asset.symbol}
                                    className={`sentinel-watchlist-match-card ${getMatchStatusClass(asset)}`}
                                >
                                    <CardHeader className="sentinel-watchlist-match-header">
                                        <p className="sentinel-watchlist-match-kicker">Symbol</p>
                                        <CardTitle className="sentinel-watchlist-match-symbol">
                                            {asset.symbol}
                                        </CardTitle>
                                        <CardDescription className="sentinel-watchlist-match-status">
                                            {getMatchStatusText(asset)}
                                        </CardDescription>
                                        {asset.matches?.length > 1 && (
                                            <select
                                                className="sentinel-watchlist-match-select"
                                                value={selectedMatches[asset.symbol] ?? 0}
                                                onChange={(event) => handleMatchSelect(asset.symbol, event.target.value)}
                                                aria-label={`Select match for ${asset.symbol}`}
                                                disabled={isSavingWatchlist}
                                            >
                                                {asset.matches.map((match, matchIndex) => (
                                                    <option
                                                        key={`${asset.symbol}-${match.exchange}-${match.name}`}
                                                        value={matchIndex}
                                                    >
                                                        {match.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {selectedMatch && (
                                            <div className="sentinel-watchlist-match-details">
                                                <p className="sentinel-watchlist-match-company">
                                                    {selectedMatch.name}
                                                </p>
                                                <div className="sentinel-watchlist-match-meta">
                                                    <span>{selectedMatch.exchange}</span>
                                                    <span>{selectedMatch.currency}</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardHeader>

                                </Card>
                            );
                        })()
                    ))}
                </WatchlistCardRow>
                <div className={`sentinel-watchlist-save-signal${matchedAssetCount > 0 ? " is-ready" : ""}`}>
                    {matchedAssetCount > 0 ? `${matchedAssetCount} symbol${matchedAssetCount === 1 ? "" : "s"} ready` : "Waiting for valid symbols"}
                </div>
                {showIncompleteAlert && (
                    <Alert className="sentinel-watchlist-save-confirm-alert">
                        <AlertTitle>Continue with fewer than five?</AlertTitle>
                        <AlertDescription>
                            You can add symbols later, but new additions will not be included until the next daily brief.
                        </AlertDescription>
                        <div className="sentinel-watchlist-save-alert-actions">
                            <Button
                                className="sentinel-watchlist-save-alert-primary"
                                type="button"
                                onClick={handleContinueAnyway}
                                disabled={isSavingWatchlist}
                            >
                                {isSavingWatchlist ? "Saving..." : "Continue"}
                            </Button>
                            <Button
                                className="sentinel-watchlist-save-alert-secondary"
                                type="button"
                                variant="outline"
                                onClick={handleKeepEditing}
                                disabled={isSavingWatchlist}
                            >
                                Not yet
                            </Button>
                        </div>
                    </Alert>
                )}
                <div className="sentinel-watchlist-save-actions">
                    <Button
                        className="sentinel-watchlist-save-back"
                        type="button"
                        variant="outline"
                        onClick={handleEditWatchlist}
                        disabled={isSavingWatchlist}
                    >
                        Edit watchlist
                    </Button>
                    <Button
                        className="sentinel-watchlist-save-primary"
                        type="button"
                        onClick={handleStartWatching}
                        disabled={isSavingWatchlist}
                    >
                        {isSavingWatchlist ? "Saving..." : "Start watching"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
