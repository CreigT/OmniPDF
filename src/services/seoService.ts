import { ToolDefinition } from '../types';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: string;
  image?: string;
  tool?: ToolDefinition;
  viewName?: 'home' | 'tool' | 'dashboard' | 'admin' | 'pricing';
}

const DEFAULT_TITLE = 'OmniPDF Pro | All-in-One Online PDF & Image SaaS Platform';
const DEFAULT_DESC =
  'Merge, split, compress, convert, protect, and print PDF and image files directly inside your browser. 100% private, instant client-side processing with zero server uploads.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';

export function updatePageSEO(config: SEOConfig) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://omnipdf.app';
    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESC;
    let keywords = [
      'pdf tools',
      'merge pdf',
      'compress pdf online',
      'split pdf',
      'pdf to image',
      'image to pdf',
      'pdf to word',
      'word to pdf',
      'private pdf editor',
      'client side pdf converter',
      'watermark pdf',
      'protect pdf',
      'free online pdf editor',
      'instant pdf tools',
    ];
    let path = '/';

    if (config.viewName === 'tool' && config.tool) {
      const tool = config.tool;
      title = `${tool.name} Online - Free & Private In-Browser | OmniPDF`;
      description = `${tool.longDesc} Fast, 100% secure client-side processing with instant download. No file size limits on Pro.`;
      keywords = [
        tool.name.toLowerCase(),
        `${tool.name.toLowerCase()} online`,
        `free ${tool.name.toLowerCase()}`,
        `fast ${tool.name.toLowerCase()}`,
        'private pdf processing',
        'no upload pdf tool',
        'browser pdf tool',
        'omnipdf',
      ];
      path = `/?tool=${encodeURIComponent(tool.id)}`;
    } else if (config.viewName === 'pricing') {
      title = 'Pricing Plans & Pro SaaS Subscriptions | OmniPDF';
      description =
        'Explore flexible pricing for OmniPDF. Unlimited PDF & image processing, 500MB batch processing, team workspaces, and enterprise SLA.';
      keywords = ['omnipdf pricing', 'pdf pro subscription', 'unlimited pdf converter', 'pdf saas billing'];
      path = '/?view=pricing';
    } else if (config.viewName === 'dashboard') {
      title = 'User Dashboard & Document Storage Vault | OmniPDF';
      description = 'Manage your saved PDF documents, batch jobs, storage vault, and SaaS subscription tier.';
      path = '/?view=dashboard';
    } else if (config.viewName === 'admin') {
      title = 'Executive Admin Console & Engine Telemetry | OmniPDF';
      description = 'SaaS administrative controls, user management, quota limits, and Stripe revenue analytics.';
      path = '/?view=admin';
    }

    if (config.title) title = config.title;
    if (config.description) description = config.description;
    if (config.keywords) keywords = config.keywords;

    // 1. Update Document Title
    document.title = title;

    // Helper to update or create meta tags
    const setMeta = (selector: string, attr: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('=');
        element.setAttribute(attrName, attrVal.replace(/"/g, ''));
        document.head.appendChild(element);
      }
      element.setAttribute(attr, value);
    };

    // 2. Standard SEO Meta Tags
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="keywords"]', 'content', keywords.join(', '));
    setMeta('meta[name="robots"]', 'content', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    setMeta('meta[name="googlebot"]', 'content', 'index, follow');

    // 3. Open Graph Tags (Facebook, LinkedIn, Discord, Slack)
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', `${origin}${path}`);
    setMeta('meta[property="og:type"]', 'content', config.ogType || 'website');
    setMeta('meta[property="og:site_name"]', 'content', 'OmniPDF Pro');
    setMeta('meta[property="og:image"]', 'content', config.image || DEFAULT_IMAGE);

    // 4. Twitter Card Tags
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', config.image || DEFAULT_IMAGE);

    // 5. Canonical Link Tag
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', `${origin}${path}`);

    // 6. Dynamic JSON-LD Structured Data Schema (Schema.org)
    let schemaScript = document.getElementById('dynamic-seo-schema') as HTMLScriptElement;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'dynamic-seo-schema';
      schemaScript.type = 'application/ld+json';
      document.head.appendChild(schemaScript);
    }

    const schemaData = config.tool
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: `${config.tool.name} - OmniPDF`,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any (Web Browser)',
          description: config.tool.longDesc,
          url: `${origin}/?tool=${config.tool.id}`,
          browserRequirements: 'Requires JavaScript. Requires HTML5.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
          featureList: [
            'Client-Side In-Browser Processing',
            'Zero Server Uploads & Maximum Privacy',
            'Instant High-Speed File Export',
            'No Watermarks on Output',
          ],
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'OmniPDF Pro Suite',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All Modern Web Browsers (Chrome, Edge, Safari, Firefox)',
          url: origin,
          description: DEFAULT_DESC,
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            ratingCount: '12400',
            bestRating: '5',
          },
          offers: [
            {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              name: 'Free Starter Tier',
            },
            {
              '@type': 'Offer',
              price: '9.00',
              priceCurrency: 'USD',
              name: 'OmniPDF Pro Monthly',
              billingDuration: 'P1M',
            },
          ],
        };

    schemaScript.textContent = JSON.stringify(schemaData, null, 2);
  } catch (err) {
    console.warn('SEO tag update error:', err);
  }
}
