type LogoProps = {
  className?: string;
};

export function QuickBooksLogo({ className = "h-6 w-auto" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 176 32"
      aria-label="QuickBooks"
      role="img"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="4" width="24" height="24" rx="12" fill="#2CA01C" />
      <path
        d="M7.4 16a4.6 4.6 0 0 1 4.6-4.6h4.6v3.4H12a1.2 1.2 0 0 0 0 2.4h4.6v3.4H12A4.6 4.6 0 0 1 7.4 16Zm9.2-4.6h3.4V20.6h-3.4z"
        fill="#fff"
      />
      <path
        d="M36.2 11.4h3.4l-2.7 3.1c1.6.2 2.9.9 3.8 2a5.9 5.9 0 0 1 1.4 4c0 1.5-.3 2.8-1 3.9-.7 1.1-1.6 2-2.8 2.6-1.2.6-2.5.9-4 .9-1.6 0-3-.3-4.2-1-1.2-.7-2.1-1.6-2.8-2.8-.7-1.2-1-2.5-1-4.1 0-1.5.3-2.8 1-4 .7-1.2 1.6-2.1 2.8-2.8l-2.7-3.1H31l2.2 2.4c.4-.1.9-.1 1.3-.1s.8 0 1.2.1l2.5-2.4Zm-1.7 13.5c1 0 1.8-.3 2.4-1 .6-.7.9-1.5.9-2.5 0-1-.3-1.8-.9-2.4-.6-.7-1.4-1-2.4-1s-1.8.3-2.4 1c-.6.6-.9 1.5-.9 2.4 0 1 .3 1.8.9 2.5.6.7 1.4 1 2.4 1Z"
        fill="#2CA01C"
      />
      <text x="49" y="21.6" fill="#FFFFFF" fontSize="14" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif">
        QuickBooks
      </text>
    </svg>
  );
}

export function ZohoInvoiceLogo({ className = "h-6 w-auto" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 214 32"
      aria-label="Zoho Invoice"
      role="img"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(0 5)">
        <rect width="22" height="18" rx="2.5" fill="#E42527" transform="rotate(-7 11 9)" />
        <rect x="18" width="22" height="18" rx="2.5" fill="#089949" transform="rotate(5 29 9)" />
        <rect x="36" width="22" height="18" rx="2.5" fill="#226DB4" transform="rotate(-4 47 9)" />
        <rect x="54" width="22" height="18" rx="2.5" fill="#F9B21D" transform="rotate(6 65 9)" />
        <text x="5.3" y="12.6" fill="#fff" fontSize="10" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif">Z</text>
        <text x="22.8" y="12.6" fill="#fff" fontSize="10" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif">O</text>
        <text x="42.1" y="12.6" fill="#fff" fontSize="10" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif">H</text>
        <text x="60.6" y="12.6" fill="#fff" fontSize="10" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif">O</text>
      </g>
      <text x="84" y="21.6" fill="#FFFFFF" fontSize="14" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif">
        Invoice
      </text>
    </svg>
  );
}
