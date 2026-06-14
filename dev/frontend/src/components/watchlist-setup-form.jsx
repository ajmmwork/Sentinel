import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup } from "./ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useRef, useState } from "react";
import { validate_assets } from "@/utilities/api";

const REDIRECT_DELAY_MS = 3000;
const WATCHLIST_SLOT_COUNT = 5;
const WATCHLIST_DRAFT_KEY = "sentinel_watchlist_draft";
const WATCHLIST_VALIDATED_KEY = "sentinel_validated_watchlist";

export function WatchlistSetupForm() {
  const [assets, setAssets] = useState(Array(WATCHLIST_SLOT_COUNT).fill(""))
  const [isValidating, setIsValidating] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isMessageFading, setIsMessageFading] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [isInfoFading, setIsInfoFading] = useState(false)
  const infoTimerRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const messageTimerRef = useRef(null);
  const messageFadeTimerRef = useRef(null);
  const enteredAssets = assets
    .map((asset) => asset.trim())
    .filter(Boolean);
  const duplicateAssets = enteredAssets.filter(
    (asset, assetIndex) => enteredAssets.indexOf(asset) !== assetIndex
  );
  const hasAtLeastOneAsset = enteredAssets.length > 0;
  const hasDuplicateAssets = duplicateAssets.length > 0;

  useEffect(() => {
    const savedDraft = sessionStorage.getItem(WATCHLIST_DRAFT_KEY);

    if (!savedDraft) {
      return;
    }

    try {
      const parsedDraft = JSON.parse(savedDraft);

      if (Array.isArray(parsedDraft)) {
        setAssets([
          ...parsedDraft.slice(0, WATCHLIST_SLOT_COUNT),
          ...Array(WATCHLIST_SLOT_COUNT).fill(""),
        ].slice(0, WATCHLIST_SLOT_COUNT));
      }
    } catch {
      sessionStorage.removeItem(WATCHLIST_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (infoTimerRef.current) {
        clearTimeout(infoTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      if (messageFadeTimerRef.current) {
        clearTimeout(messageFadeTimerRef.current);
      }
    };
  }, []);

  function clearInfoTimers() {
    if (infoTimerRef.current) {
      clearTimeout(infoTimerRef.current);
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
    }
  }

  function clearMessageTimers() {
    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }
    if (messageFadeTimerRef.current) {
      clearTimeout(messageFadeTimerRef.current);
    }
  }

  function showTimedMessage(message, type) {
    clearMessageTimers();
    setIsMessageFading(false);

    if (type === "success") {
      setSuccessMessage(message);
      setErrorMessage("");
    } else {
      setErrorMessage(message);
      setSuccessMessage("");
    }

    messageFadeTimerRef.current = setTimeout(() => {
      setIsMessageFading(true);
    }, 4300);

    messageTimerRef.current = setTimeout(() => {
      setErrorMessage("");
      setSuccessMessage("");
      setIsMessageFading(false);
      messageTimerRef.current = null;
      messageFadeTimerRef.current = null;
    }, 5000);
  }

  function showError(message) {
    showTimedMessage(message, "error");
  }

  function showSuccess(message) {
    showTimedMessage(message, "success");
  }

  function handleInfoClick() {
    clearInfoTimers();
    setIsInfoOpen(true);
    setIsInfoFading(false);

    fadeTimerRef.current = setTimeout(() => {
      setIsInfoFading(true);
    }, 4300);

    infoTimerRef.current = setTimeout(() => {
      setIsInfoOpen(false);
      setIsInfoFading(false);
      infoTimerRef.current = null;
      fadeTimerRef.current = null;
    }, 5000);
  }

  function handleAssetChange(assetIndex, value) {
    const updatedAssets = [...assets];
    updatedAssets[assetIndex] = value.toUpperCase();
    setAssets(updatedAssets);
  }

  async function handleValidateAssets() {
    if (!hasAtLeastOneAsset){
      showError("Enter at least one symbol before validating your watchlist.");
      return;
    }

    if (duplicateAssets.length > 0) {
      showError(`Remove duplicate symbol${duplicateAssets.length === 1 ? "" : "s"}: ${[...new Set(duplicateAssets)].join(", ")}.`);
      return;
    }

    setIsValidating(true)
    setErrorMessage("")
    setSuccessMessage("")

    try{
      const result = await validate_assets(enteredAssets)
      if (!result.ok) {
        showError(result.data?.detail || "Asset validation failed. Please try again.");
        return;
      }
      showSuccess(result.data?.detail || `Validated ${enteredAssets.length} asset${enteredAssets.length === 1 ? "" : "s"}. Redirecting you now.`);
      await new Promise((resolve) => setTimeout(resolve, REDIRECT_DELAY_MS));

      sessionStorage.setItem(
        WATCHLIST_DRAFT_KEY,
        JSON.stringify(assets.map((asset) => asset.trim()))
      );
      sessionStorage.setItem(
        WATCHLIST_VALIDATED_KEY, 
        JSON.stringify(result.data.data)
      )
      window.location.href = "/watchlist-save";
    }catch{
      showError("Unable to reach the server. Please try again.");

    }finally{
      setIsValidating(false)
    }


    
  }


  return (
    <Card className="sentinel-watchlist-card">
      <CardHeader className="sentinel-watchlist-header">
        <div className="sentinel-watchlist-brand">
          <div>
            <p className="sentinel-watchlist-name">SENTINEL</p>
            <p className="sentinel-watchlist-tagline">Market intelligence with AI</p>
          </div>
        </div>
        <div className="sentinel-watchlist-title-row">
          <CardTitle className="sentinel-watchlist-title">Choose Your Watchlist</CardTitle>
          <button
            className="sentinel-watchlist-info-button"
            type="button"
            aria-expanded={isInfoOpen}
            aria-label="Learn more about watchlist setup"
            onClick={handleInfoClick}
          >
            i
          </button>
        </div>
        <CardDescription className="sentinel-watchlist-description">
          Add up to five symbols for your daily market briefings.
        </CardDescription>
        {isInfoOpen && (
          <Alert className={`sentinel-watchlist-info-alert${isInfoFading ? " is-fading" : ""}`}>
            <AlertTitle>Watchlist timing</AlertTitle>
            <AlertDescription>
              You can start with fewer than five. Later, you can add or modify symbols from the dashboard.
              Changes appear in the next daily brief because reports are generated once per day.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="sentinel-watchlist-content">
        {errorMessage && (
          <Alert className={`sentinel-watchlist-alert${isMessageFading ? " is-fading" : ""}`}>
            <AlertTitle>Check your watchlist</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className={`sentinel-watchlist-success-alert${isMessageFading ? " is-fading" : ""}`}>
            <AlertTitle>Watchlist update</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <FieldGroup className="sentinel-watchlist-slots">
          {assets.map((asset, assetIndex) => (
            <div className="sentinel-watchlist-slot" key={assetIndex}>
              <Input
                aria-label={`Watchlist symbol ${assetIndex + 1}`}
                className="sentinel-watchlist-input"
                type="text"
                placeholder="Add Asset"
                value={asset}
                onChange={(event) => handleAssetChange(assetIndex, event.target.value)}
              />
            </div>
          ))}
          {<Button className="sentinel-watchlist-primary"
            onClick={handleValidateAssets} disabled={isValidating}
          >

            {isValidating ? "Validating Assets..." : "Validate Assets"}
          </Button>}

        </FieldGroup>
        <div className={`sentinel-watchlist-signal${hasAtLeastOneAsset && !hasDuplicateAssets ? " is-ready" : ""}${hasDuplicateAssets ? " has-duplicates" : ""}`}>
          {hasDuplicateAssets ? "Remove duplicate symbols" : hasAtLeastOneAsset ? "Watchlist ready to validate" : "Waiting for symbols"}
        </div>
      </CardContent>
    </Card>
  );
}
