function ProviderLogo({ logo, providerId, accent }) {
  return (
    <span
      className="sentinel-model-provider-badge"
      style={{ "--provider-accent": accent }}
      aria-hidden="true"
    >
      <img
        className={`sentinel-model-provider-logo sentinel-model-provider-logo-${providerId}`}
        src={logo}
        alt=""
      />
    </span>
  );
}

export { ProviderLogo };
