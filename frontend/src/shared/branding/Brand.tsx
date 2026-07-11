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
  const logo = white ? HFOSLogoWhite : HFOSLogo;

  if (symbolOnly) {
    return (
      <img
        src={HFOSSymbol}
        alt="HFOS"
        className="brand-symbol"
      />
    );
  }

  return (
    <img
      src={logo}
      alt="HFOS"
      className={
        compact
          ? "brand-logo compact"
          : "brand-logo"
      }
    />
  );
}