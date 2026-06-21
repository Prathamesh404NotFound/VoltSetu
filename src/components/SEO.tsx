import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  schema?: object;
}

// NOTE: Per-spot detail page SEO/Schema is deferred until dedicated /spots/:spotId 
// routes exist in src/App.tsx. For now, all spot discovery happens via 
// modals/map markers on the shared /spots page.

/**
 * Reusable SEO component for per-page metadata.
 * Sets the title, description, and social media tags.
 */
export default function SEO({
  title,
  description,
  canonical,
  ogImage = "https://charge-nest.netlify.app/og-image.png",
  noindex = false,
  schema,
}: SEOProps) {
  const siteUrl = "https://charge-nest.netlify.app";
  const url = canonical ? `${siteUrl}${canonical}` : window.location.href;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
