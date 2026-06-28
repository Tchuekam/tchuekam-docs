// @ts-check
// TchueKAM Agent — official documentation site
// Source of truth for releases: github.com/Tchuekam/tchuekam-agent

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'TchueKAM Agent',
  tagline: 'Your native desktop AI assistant — fast, private, and yours.',
  favicon: 'img/favicon.ico',

  url: 'https://docs.tchuekam.com',
  baseUrl: '/',

  organizationName: 'Tchuekam',
  projectName: 'tchuekam-docs',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Global app config available to all components via useDocusaurusContext()
  customFields: {
    githubRepo: 'Tchuekam/tchuekam-agent',
    websiteUrl: 'https://tchuekam.com',
    contactEmail: 'support@tchuekam.com',
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: '/',
          editUrl: 'https://github.com/Tchuekam/tchuekam-docs/edit/main/',
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/tchuekam-social-card.png',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      metadata: [
        {name: 'keywords', content: 'tchuekam, ai agent, desktop ai, download, documentation'},
        {name: 'description', content: 'Official documentation for TchueKAM Agent — install, configure, and master your native desktop AI assistant.'},
      ],
      navbar: {
        title: 'TchueKAM',
        logo: {
          alt: 'TchueKAM',
          src: 'img/logo.svg',
          srcDark: 'img/logo.svg',
        },
        items: [
          {to: '/getting-started', label: 'Getting Started', position: 'left'},
          {to: '/features', label: 'Features', position: 'left'},
          {to: '/changelog', label: 'Changelog', position: 'left'},
          {to: '/faq', label: 'FAQ', position: 'left'},
          {
            href: 'https://tchuekam.com',
            label: 'Website',
            position: 'right',
          },
          {
            type: 'html',
            position: 'right',
            value: '<a class="navbar__item navbar__link button button--primary button--sm" href="/installation">Download</a>',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Product',
            items: [
              {label: 'Features', to: '/features'},
              {label: 'AI Capabilities', to: '/ai-capabilities'},
              {label: 'Installation', to: '/installation'},
              {label: 'Updates', to: '/updates'},
            ],
          },
          {
            title: 'Support',
            items: [
              {label: 'Getting Started', to: '/getting-started'},
              {label: 'FAQ', to: '/faq'},
              {label: 'Troubleshooting', to: '/troubleshooting'},
              {label: 'Contact', to: '/contact'},
            ],
          },
          {
            title: 'Legal',
            items: [
              {label: 'Privacy Policy', to: '/privacy'},
              {label: 'Terms of Service', to: '/terms'},
            ],
          },
          {
            title: 'Community',
            items: [
              {label: 'Community Hub', to: '/community'},
              {label: 'Website', href: 'https://tchuekam.com'},
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} TchueKAM. All rights reserved.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'powershell', 'json', 'yaml', 'diff'],
      },
      // Local search — see plugin section below. For Algolia DocSearch later,
      // swap this for `algolia: { appId, apiKey, indexName }`.
    }),

  // Local full-text search (no external service needed, works on GitHub Pages)
  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: '/',
      },
    ],
  ],
};

export default config;
