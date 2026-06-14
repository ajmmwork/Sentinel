import { Check, ChevronDown, Cpu, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getAvailableModels, getAvailableProviders, save_api_key} from "@/utilities/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { ProviderLogo } from "@/components/ui/provider-logo";
import claudeLogo from "@/assets/provider-logos/claude.svg";
import geminiLogo from "@/assets/provider-logos/gemini.svg";
import openaiLogo from "@/assets/provider-logos/openai.svg";

const REDIRECT_DELAY_MS = 3000;

const PROVIDER_LOGOS = {
  openai: {
    logo: openaiLogo,
    providerId: "openai",
    accent: "#10a37f",
  },
  anthropic: {
    logo: claudeLogo,
    providerId: "anthropic",
    accent: "#d97757",
  },
  gemini: {
    logo: geminiLogo,
    providerId: "google",
    accent: "#4285f4",
  },
}

function getProviderLogoConfig(providerName) {
  return PROVIDER_LOGOS[providerName.toLowerCase()] ?? {
    logo: openaiLogo,
    providerId: "openai",
    accent: "#6366f1",
  }
}

export function ModelSetupForm() {

  const [errorMessage, setErrorMessage] = useState("")
  const [isErrorFading, setIsErrorFading] = useState(false)
  const [providers, setProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [apiKey, setApiKey] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false)
  const [isLoadingProviders, setIsLoadingProviders] = useState(false)
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isSavingApiKey, setIsSavingApiKey] = useState(false)
  const errorTimerRef = useRef(null)
  const fadeTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current)
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current)
      }
    }
  }, [])

  function showError(message) {
    setErrorMessage(message)
    setIsErrorFading(false)

    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current)
    }

    fadeTimerRef.current = setTimeout(() => {
      setIsErrorFading(true)
    }, 4300)

    errorTimerRef.current = setTimeout(() => {
      setErrorMessage("")
      setIsErrorFading(false)
      errorTimerRef.current = null
      fadeTimerRef.current = null
    }, 5000)
  }

  async function handleProviderDropdownClick() {
    setIsProviderMenuOpen((currentValue) => !currentValue);

    if (providers.length > 0) {
      return;
    }

    setIsLoadingProviders(true);

    try {
      const result = await getAvailableProviders();

      if (!result.ok) {
        showError(result.data?.detail || "Provider retrieval failed. Please try again.");
        return;
      }

      if (result.data.providers.length == 0) {
        showError(result.data?.detail || "No available providers at the moment");
        return;
      }


      setProviders(result.data.providers);
    } catch {
      showError("Unable to reach the server. Please try again.");
    } finally {
      setIsLoadingProviders(false);
    }
  }

  function handleProviderSelect(provider) {
    setSelectedProvider(provider)
    setSelectedModel(null)
    setApiKey("")
    setSuccessMessage("")
    setErrorMessage("")
    setIsErrorFading(false)
    setModels([])
    setIsProviderMenuOpen(false)
    setIsModelMenuOpen(false)
  }

  async function handleModelDropdownClick() {
    if (!selectedProvider) {
      showError("Choose a provider before selecting a model.")
      return
    }

    setIsModelMenuOpen((currentValue) => !currentValue)

    if (models.length > 0) {
      return
    }

    setIsLoadingModels(true)

    try {
      const result = await getAvailableModels({"provider" : selectedProvider.provider_id})

      if (!result.ok) {
        showError(result.data?.detail || "Model retrieval failed. Please try again.")
        return
      }

      if (!result.data?.models || result.data.models.length === 0) {
        showError(result.data?.detail || "No available models for this provider.")
        return
      }

      setModels(result.data.models)
    } catch {
      showError("Unable to reach the server. Please try again.")
    } finally {
      setIsLoadingModels(false)
    }
  }

  function handleModelSelect(model) {
    setSelectedModel(model)
    setApiKey("")
    setSuccessMessage("")
    setErrorMessage("")
    setIsErrorFading(false)
    setIsModelMenuOpen(false)
  }

  async function handleApiKeySubmit(event) {
    event.preventDefault()

    if (!apiKey.trim()) {
      showError("Enter your API key before continuing.")
      return
    }
    const payload = {
      provider_id: selectedProvider.provider_id,
      model_id: selectedModel.model_id,
      api_key: apiKey.trim(),
    }

    setIsSavingApiKey(true)
    setSuccessMessage("")

    try {
      const response = await save_api_key(payload)

      if (!response.ok) {
        showError(response.data?.detail || "Unable to save API key. Please try again.")
        return
      }

      setSuccessMessage(response.data?.detail || "Model connection saved.")
      setApiKey("")
      await new Promise((resolve) => setTimeout(resolve, REDIRECT_DELAY_MS))
      window.location.href = "/login"
    } catch {
      showError("Unable to reach the server. Please try again.")
    } finally {
      setIsSavingApiKey(false)
    }
  }

  const selectedProviderLogo = selectedProvider
    ? getProviderLogoConfig(selectedProvider.provider_name)
    : null

  return (
    <Card className="sentinel-model-card">
      <CardHeader>
        <div className="sentinel-model-brand">
          <p className="sentinel-model-name">SENTINEL</p>
          <p className="sentinel-model-tagline">Market intelligence with AI</p>
        </div>
        <CardTitle className="sentinel-model-title">Choose your AI model</CardTitle>
        <CardDescription className="sentinel-model-description">
          Select the provider and model Sentinel should use for your market brief.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="sentinel-model-form">
          {errorMessage && (
            <Alert className={`sentinel-model-alert${isErrorFading ? " is-fading" : ""}`}>
              <AlertTitle>Model Unavailable</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="sentinel-model-success-alert">
              <AlertTitle>Model setup saved</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <FieldGroup className="sentinel-model-grid">
            <Field className="sentinel-model-field">
              <FieldLabel className="sentinel-model-field-label">Provider</FieldLabel>
              <div className="sentinel-model-menu">
                <button
                  className="sentinel-model-select"
                  type="button"
                  aria-expanded={isProviderMenuOpen}
                  onClick={handleProviderDropdownClick}
                >
                  {selectedProvider ? (
                    <ProviderLogo
                      logo={selectedProviderLogo.logo}
                      providerId={selectedProviderLogo.providerId}
                      accent={selectedProviderLogo.accent}
                    />
                  ) : (
                    <span className="sentinel-model-provider-placeholder" aria-hidden="true">
                      <Cpu />
                    </span>
                  )}
                  <span className="sentinel-model-select-copy">
                    <span className="sentinel-model-select-title">
                      {selectedProvider ? selectedProvider.provider_name : "Select provider"}
                    </span>
                    <span className="sentinel-model-select-description">
                      {selectedProvider
                        ? "Provider selected for Sentinel."
                        : "Choose which AI provider Sentinel should use."}
                    </span>
                  </span>
                  <ChevronDown className="sentinel-model-chevron" aria-hidden="true" />
                </button>
                {isProviderMenuOpen && providers.length > 0 && (
                  <div className="sentinel-model-options">
                    {providers.map((provider) => {
                      const logoConfig = getProviderLogoConfig(provider.provider_name)

                      return (
                        <button
                          className="sentinel-model-option"
                          key={provider.provider_id}
                          type="button"
                          onClick={() => handleProviderSelect(provider)}
                        >
                          <ProviderLogo
                            logo={logoConfig.logo}
                            providerId={logoConfig.providerId}
                            accent={logoConfig.accent}
                          />
                          <span className="sentinel-model-option-copy">
                            <span className="sentinel-model-option-title">
                              {provider.provider_name}
                            </span>
                          </span>
                          {selectedProvider?.provider_id === provider.provider_id && (
                            <Check className="sentinel-model-check" aria-hidden="true" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                {isProviderMenuOpen && isLoadingProviders && (
                  <div className="sentinel-model-options">
                    <div className="sentinel-model-loading">Loading providers...</div>
                  </div>
                )}
              </div>
            </Field>

            <Field className="sentinel-model-field">
              <FieldLabel className="sentinel-model-field-label">Model</FieldLabel>
              <div className="sentinel-model-menu">
                <button
                  className="sentinel-model-select"
                  type="button"
                  aria-expanded={isModelMenuOpen}
                  onClick={handleModelDropdownClick}
                >
                  {selectedProviderLogo ? (
                    <ProviderLogo
                      logo={selectedProviderLogo.logo}
                      providerId={selectedProviderLogo.providerId}
                      accent={selectedProviderLogo.accent}
                    />
                  ) : (
                    <span className="sentinel-model-model-mark" aria-hidden="true">AI</span>
                  )}
                  <span className="sentinel-model-select-copy">
                    <span className="sentinel-model-select-title">
                      {selectedModel ? selectedModel.model_name : "Select model"}
                    </span>
                    <span className="sentinel-model-select-description">
                      {selectedModel
                        ? "Model selected for Sentinel."
                        : selectedProvider
                          ? "Choose which model Sentinel should use."
                          : "Model options will appear after a provider is selected."}
                    </span>
                  </span>
                  <ChevronDown className="sentinel-model-chevron" aria-hidden="true" />
                </button>
                {isModelMenuOpen && models.length > 0 && (
                  <div className="sentinel-model-options">
                    {models.map((model) => (
                      <button
                        className="sentinel-model-option"
                        key={model.model_id}
                        type="button"
                        onClick={() => handleModelSelect(model)}
                      >
                        {selectedProviderLogo ? (
                          <ProviderLogo
                            logo={selectedProviderLogo.logo}
                            providerId={selectedProviderLogo.providerId}
                            accent={selectedProviderLogo.accent}
                          />
                        ) : (
                          <span className="sentinel-model-model-mark" aria-hidden="true">AI</span>
                        )}
                        <span className="sentinel-model-option-copy">
                          <span className="sentinel-model-option-title">
                            {model.model_name}
                          </span>
                        </span>
                        {selectedModel?.model_id === model.model_id && (
                          <Check className="sentinel-model-check" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {isModelMenuOpen && isLoadingModels && (
                  <div className="sentinel-model-options">
                    <div className="sentinel-model-loading">Loading models...</div>
                  </div>
                )}
              </div>
            </Field>
          </FieldGroup>

          {selectedProvider?.pricing_url && (
            <a
              className="sentinel-model-pricing-link"
              href={selectedProvider.pricing_url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink aria-hidden="true" />
              Review {selectedProvider.provider_name} pricing before choosing a model
            </a>
          )}

          {selectedModel && (
            <form className="sentinel-model-api-key-form" onSubmit={handleApiKeySubmit}>
              <Field className="sentinel-model-api-key-field">
                <FieldLabel className="sentinel-model-field-label" htmlFor="model-api-key">
                  API key
                </FieldLabel>
                <div className="sentinel-model-api-key-row">
                  <Input
                    className="sentinel-model-api-key-input"
                    id="model-api-key"
                    name="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder={`Enter your ${selectedProvider.provider_name} API key`}
                    autoComplete="off"
                  />
                  <Button
                    className="sentinel-model-api-key-submit"
                    type="submit"
                    disabled={isSavingApiKey}
                  >
                    {isSavingApiKey ? "Saving..." : "Save key"}
                  </Button>
                </div>
              </Field>
              <div className="sentinel-model-signal">
                {successMessage
                  ? "Model connection saved"
                  : apiKey.trim()
                  ? "Model connection ready to save"
                  : "Waiting for your API key"}
              </div>
              <p className="sentinel-model-disclaimer">
                You can change your provider, switch models, or revoke this API key later from
                your dashboard settings.
              </p>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
