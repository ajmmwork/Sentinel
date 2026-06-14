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

export function WatchlistSetupForm() {
  const [assets, setAssets] = useState(["","","","",""])
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
  const hasAtLeastOneAsset = assets.some((asset) => asset.trim() !== "");

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

    setIsValidating(true)
    setErrorMessage("")
    setSuccessMessage("")

    const enteredAssets = assets.filter((asset) => asset.trim() !== "");

    try{
      const result = await validate_assets(enteredAssets)
      if (!result.ok) {
        showError(result.data?.detail || "Asset validation failed. Please try again.");
        return;
      }
      showSuccess(result.data?.detail || `Validated ${enteredAssets.length} asset${enteredAssets.length === 1 ? "" : "s"}. Redirecting you now.`);
      await new Promise((resolve) => setTimeout(resolve, REDIRECT_DELAY_MS));
      window.location.href = "/login";
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
          <div className="sentinel-watchlist-slot">
            <Input
              className="sentinel-watchlist-input"
              type="text"
              placeholder="Add Asset"
              value={assets[0]}
              onChange={(event) => handleAssetChange(0, event.target.value)}
            />
          </div>
          <div className="sentinel-watchlist-slot">
            <Input
              className="sentinel-watchlist-input"
              type="text"
              placeholder="Add Asset"
              value={assets[1]}
              onChange={(event) => handleAssetChange(1, event.target.value)}
            />
          </div>
          <div className="sentinel-watchlist-slot">
            <Input
              className="sentinel-watchlist-input"
              type="text"
              placeholder="Add Asset"
              value={assets[2]}
              onChange={(event) => handleAssetChange(2, event.target.value)}
            />
          </div>
          <div className="sentinel-watchlist-slot">
            <Input
              className="sentinel-watchlist-input"
              type="text"
              placeholder="Add Asset"
              value={assets[3]}
              onChange={(event) => handleAssetChange(3, event.target.value)}
            />
          </div>
          <div className="sentinel-watchlist-slot">
            <Input
              className="sentinel-watchlist-input"
              type="text"
              placeholder="Add Asset"
              value={assets[4]}
              onChange={(event) => handleAssetChange(4, event.target.value)}
            />
          </div>
          {<Button className="sentinel-watchlist-primary"
            onClick={handleValidateAssets} disabled={!hasAtLeastOneAsset}
          >

            {isValidating ? "Validating Assets..." : "Validate Assets"}
          </Button>}

        </FieldGroup>
        <div className={`sentinel-watchlist-signal${hasAtLeastOneAsset ? " is-ready" : ""}`}>
          {hasAtLeastOneAsset ? "Watchlist ready to validate" : "Waiting for symbols"}
        </div>
      </CardContent>
    </Card>
  );
}
