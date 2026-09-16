import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export const SITE_URL = "https://chargepush.vercel.app";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  schema?: object;
  ogType?: "website" | "article" | "profile";
}

/**
 * ChargePush Production SEO Component
 * Ensures clean canonical origin resolution, Open Graph / Twitter metadata,
 * indexability flags, and structured data injection.
 */
export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  noindex = false,
  schema,
  ogType = "website",
}: SEOProps) {
  const location = useLocation();

  // Resolve canonical URL safely without query string noise
  let canonicalUrl = `${SITE_URL}${location.pathname}`;
  if (canonical) {
    if (canonical.startsWith("http://") || canonical.startsWith("https://")) {
      canonicalUrl = canonical;
    } else {
      canonicalUrl = `${SITE_URL}${canonical.startsWith("/") ? canonical : `/${canonical}`}`;
    }
  }

  // Resolve social share image URL safely
  let resolvedOgImage = DEFAULT_OG_IMAGE;
  if (ogImage) {
    if (ogImage.startsWith("http://") || ogImage.startsWith("https://")) {
      resolvedOgImage = ogImage;
    } else {
      resolvedOgImage = `${SITE_URL}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`;
    }
  }

  return (
    <Helmet>
      {/* Primary Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}
      />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content="ChargePush" />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOgImage} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
