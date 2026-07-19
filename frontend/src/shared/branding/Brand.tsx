import "./Brand.css";

import {
  HFOSLogo,
  HFOSLogoWhite,
  HFOSSymbol,
} from "../../assets/branding";

type BrandProps = {
  compact?: boolean;
  white?: boolean;
  symbolOnly?: boolean;
};

export default function Brand({
  compact = false,
  white = false,
  symbolOnly = false,
}: BrandProps) {
  if (symbolOnly) {
    return (
      <img
        src={HFOSSymbol}
        alt="HFOS"
        className="brand-symbol"
      />
    );
  }

  const logoClassName =
    compact
      ? "brand-logo compact"
      : "brand-logo";

  if (white) {
    return (
      <img
        src={HFOSLogoWhite}
        alt="HFOS"
        className={logoClassName}
      />
    );
  }

  return (
    <span className="brand-logo-set">
      <img
        src={HFOSLogo}
        alt="HFOS"
        className={`${logoClassName} brand-logo--light`}
      />

      <img
        src={HFOSLogoWhite}
        alt=""
        aria-hidden="true"
        className={`${logoClassName} brand-logo--dark`}
      />
    </span>
  );
}
