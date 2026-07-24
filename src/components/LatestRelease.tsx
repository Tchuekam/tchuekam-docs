// Fetches the latest GitHub release for tchuekam-desktop and renders the
// version, release date, and per-OS download buttons. Used by the home page,
// the Installation page, and the Updates page. Single source of truth: GitHub.

import React, {useEffect, useState} from 'react';

// Hardcoded to prevent build-time corruption of customFields (the deployed
// build was producing "repos/p/releases/latest" instead of the full path).
const GITHUB_REPO = 'Tchuekam/tchuekam-desktop';
const RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
const LATEST_RELEASE_URL = `${RELEASES_URL}/latest`;

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
  'windows':     'Windows',
  'macos-arm64': 'macOS (Apple Silicon)',
  'macos-x64':   'macOS (Intel)',
  'linux':       'Linux',
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

// ---------- Static fallback when no releases exist yet ----------

function StaticDownloadSection() {
  return (
    <div style={{padding: '1.5rem', border: '1px solid rgba(0,242,254,0.15)', borderRadius: 12, background: 'rgba(0,242,254,0.04)'}}>
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
          v1.0.0
        </span>
        <span style={{opacity: 0.6, fontSize: 14}}>
          Latest release
        </span>
      </div>

      <p style={{margin: '0 0 16px', opacity: 0.85, lineHeight: 1.6}}>
        Download TchueKAM Agent for your platform:
      </p>

      <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16}}>
        <a
          href={LATEST_RELEASE_URL}
          className="button button--primary button--lg"
          target="_blank"
          rel="noopener noreferrer"
          style={{textDecoration: 'none'}}
        >
          ⬇ Download from GitHub
        </a>
      </div>

      <table>
        <thead>
          <tr>
            <th>Platform</th>
            <th>File type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Windows</strong> (64-bit)</td>
            <td><code>.exe</code> installer</td>
            <td><a href={LATEST_RELEASE_URL} target="_blank" rel="noopener noreferrer">Download →</a></td>
          </tr>
          <tr>
            <td><strong>macOS</strong> (Apple Silicon)</td>
            <td><code>.dmg</code></td>
            <td><a href={LATEST_RELEASE_URL} target="_blank" rel="noopener noreferrer">Download →</a></td>
          </tr>
          <tr>
            <td><strong>macOS</strong> (Intel)</td>
            <td><code>.dmg</code></td>
            <td><a href={LATEST_RELEASE_URL} target="_blank" rel="noopener noreferrer">Download →</a></td>
          </tr>
          <tr>
            <td><strong>Linux</strong></td>
            <td><code>.AppImage</code></td>
            <td><a href={LATEST_RELEASE_URL} target="_blank" rel="noopener noreferrer">Download →</a></td>
          </tr>
        </tbody>
      </table>

      <p style={{opacity: 0.5, fontSize: 13, marginTop: 12}}>
        All downloads available on the{' '}
        <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">GitHub Releases page</a>.
      </p>
    </div>
  );
}

// ---------- Main component ----------

export default function LatestRelease({showAllPlatforms = false}: {showAllPlatforms?: boolean}) {
  const [release, setRelease] = useState<Release | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'no-releases' | 'error'>('loading');
  const [os, setOS] = useState<OS>('windows');

  useEffect(() => {
    setOS(detectOS());
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      .then(r => {
        if (r.status === 404) {
          // No releases published yet — show static fallback
          setStatus('no-releases');
          return null;
        }
        if (!r.ok) throw new Error(`GitHub API returned ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data) {
          setRelease(data);
          setStatus('loaded');
        }
      })
      .catch(() => setStatus('no-releases')); // Fallback on any error
  }, []);

  function trackDownload(assetName: string, downloadUrl: string, targetOS: OS) {
    try {
      if (typeof window !== 'undefined' && (window as any).posthog) {
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

  // Show static download section when no releases exist or on error
  if (status === 'no-releases' || status === 'error') {
    return <StaticDownloadSection />;
  }

  if (status === 'loading' || !release) {
    return <p style={{opacity: 0.6}}>Loading latest version…</p>;
  }

  const allAssets = release.assets || [];
  const matchAsset = (targetOS: OS) =>
    allAssets.find(a => ASSET_PATTERNS[targetOS].test(a.name));

  const primaryAsset = matchAsset(os);

  // If the release exists but has no matching assets, show static fallback
  if (allAssets.length === 0) {
    return <StaticDownloadSection />;
  }

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
          ⬇ Download for {OS_LABELS[os]}
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
                    <td>{OS_LABELS[targetOS]}</td>
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
