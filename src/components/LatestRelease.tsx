// Fetches the latest GitHub release for tchuekam-agent and renders the
// version, release date, and per-OS download buttons. Used by the home page,
// the Installation page, and the Updates page. Single source of truth: GitHub.

import React, {useEffect, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type Asset = {
  name: string;
  browser_download_url: string;
  size: number;
  download_count: number;
};

type Release = {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
  assets: Asset[];
};

type OS = 'windows' | 'macos-arm64' | 'macos-x64' | 'linux';

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent || '';
  const plat = (navigator.platform || '').toLowerCase();
  if (/win/.test(plat) || /Windows/i.test(ua)) return 'windows';
  if (/mac/.test(plat) || /Mac OS/i.test(ua)) {
    if (/arm|aarch64|Apple M/i.test(ua)) return 'macos-arm64';
    return 'macos-x64';
  }
  if (/linux/.test(plat) || /Linux/i.test(ua)) return 'linux';
  return 'windows';
}

const ASSET_PATTERNS: Record<OS, RegExp> = {
  'windows':     /win.*\.exe$/i,
  'macos-arm64': /mac.*arm64.*\.(dmg|zip)$/i,
  'macos-x64':   /mac.*(x64|x86_64|intel).*\.(dmg|zip)$/i,
  'linux':       /linux.*\.AppImage$/i,
};

const OS_LABELS: Record<OS, string> = {
  'windows':     'Download for Windows',
  'macos-arm64': 'Download for macOS (Apple Silicon)',
  'macos-x64':   'Download for macOS (Intel)',
  'linux':       'Download for Linux',
};

function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch {
    return iso;
  }
}

export default function LatestRelease({showAllPlatforms = false}: {showAllPlatforms?: boolean}) {
  const {siteConfig} = useDocusaurusContext();
  const repo = (siteConfig.customFields?.githubRepo as string) || 'Tchuekam/tchuekam-desktop';
  const [release, setRelease] = useState<Release | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [os, setOS] = useState<OS>('windows');

  useEffect(() => {
    setOS(detectOS());
    fetch(`https://api.github.com/repos/${repo}/releases/latest`)
      .then(r => {
        if (!r.ok) throw new Error(`GitHub API returned ${r.status}`);
        return r.json();
      })
      .then(setRelease)
      .catch(e => setError(e.message || String(e)));
  }, [repo]);

  function trackDownload(assetName: string, downloadUrl: string, targetOS: OS) {
    try {
      // PostHog is loaded on the parent website. If embedded via iframe or
      // available here, fire the event. Safe no-op otherwise.
      // @ts-ignore
      if (typeof window !== 'undefined' && (window as any).posthog) {
        // @ts-ignore
        (window as any).posthog.capture('download_started', {
          os: targetOS,
          asset: assetName,
          source: 'docs_site',
          version: release?.tag_name || 'latest',
          download_url: downloadUrl,
        });
      }
    } catch {}
  }

  if (error) {
    return (
      <div style={{padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8}}>
        <strong>Couldn't load release info.</strong> You can still download directly from{' '}
        <a href={`https://github.com/${repo}/releases/latest`} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>.
      </div>
    );
  }

  if (!release) {
    return <p style={{opacity: 0.6}}>Loading latest version…</p>;
  }

  const allAssets = release.assets || [];
  const matchAsset = (targetOS: OS) =>
    allAssets.find(a => ASSET_PATTERNS[targetOS].test(a.name));

  const primaryAsset = matchAsset(os);

  return (
    <div className="latest-release">
      <div style={{display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 16}}>
        <span style={{
          background: 'rgba(0,242,254,0.12)',
          color: '#00F2FE',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.5,
        }}>
          {release.tag_name}
        </span>
        <span style={{opacity: 0.6, fontSize: 14}}>
          Released {formatDate(release.published_at)}
        </span>
      </div>

      {primaryAsset ? (
        <a
          href={primaryAsset.browser_download_url}
          className="button button--primary button--lg"
          onClick={() => trackDownload(primaryAsset.name, primaryAsset.browser_download_url, os)}
          style={{textDecoration: 'none'}}
        >
          {OS_LABELS[os]}
          <span style={{opacity: 0.7, fontSize: 13, marginLeft: 8}}>
            ({formatBytes(primaryAsset.size)})
          </span>
        </a>
      ) : (
        <p>
          <em>No build available for your platform yet. </em>
          <a href={release.html_url} target="_blank" rel="noopener noreferrer">
            See all downloads on GitHub →
          </a>
        </p>
      )}

      {showAllPlatforms && (
        <div style={{marginTop: 24}}>
          <h3 style={{fontSize: 15, marginBottom: 12}}>All platforms</h3>
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>File</th>
                <th>Size</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(['windows', 'macos-arm64', 'macos-x64', 'linux'] as OS[]).map(targetOS => {
                const asset = matchAsset(targetOS);
                return (
                  <tr key={targetOS}>
                    <td>{OS_LABELS[targetOS].replace('Download for ', '')}</td>
                    <td><code>{asset ? asset.name : '—'}</code></td>
                    <td>{asset ? formatBytes(asset.size) : '—'}</td>
                    <td>
                      {asset ? (
                        <a
                          href={asset.browser_download_url}
                          onClick={() => trackDownload(asset.name, asset.browser_download_url, targetOS)}
                        >
                          Download
                        </a>
                      ) : (
                        <span style={{opacity: 0.4}}>n/a</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
