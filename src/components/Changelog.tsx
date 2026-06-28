// Fetches the last N releases from GitHub and renders each release's
// version, date, and notes (markdown). Zero manual updates required —
// publishing a GitHub release automatically appears here.

import React, {useEffect, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

type Release = {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
  prerelease: boolean;
  draft: boolean;
};

// Minimal markdown→HTML — keeps the bundle lean. For richer rendering swap
// in `marked` or `react-markdown`.
function renderMarkdown(md: string): string {
  if (!md) return '';
  let html = md;
  // Escape HTML first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Headings
  html = html.replace(/^### (.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.*)$/gm, '<h2>$1</h2>');
  // Bold + italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  // Unordered lists
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.+<\/li>\n?)+/g, m => '<ul>' + m + '</ul>');
  // Paragraph breaks
  html = html.replace(/\n\n/g, '</p><p>');
  return '<p>' + html + '</p>';
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

export default function Changelog({limit = 25}: {limit?: number}) {
  const {siteConfig} = useDocusaurusContext();
  const repo = (siteConfig.customFields?.githubRepo as string) || 'Tchuekam/tchuekam-desktop';
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${repo}/releases?per_page=${limit}`)
      .then(r => {
        if (!r.ok) throw new Error(`GitHub API returned ${r.status}`);
        return r.json();
      })
      .then((data: Release[]) => {
        // Drop drafts; show prereleases with a badge
        setReleases(data.filter(r => !r.draft));
      })
      .catch(e => setError(e.message || String(e)));
  }, [repo, limit]);

  if (error) {
    return (
      <div style={{padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8}}>
        <strong>Couldn't load the changelog.</strong>{' '}
        See all releases on{' '}
        <a href={`https://github.com/${repo}/releases`} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>.
      </div>
    );
  }

  if (!releases) {
    return <p style={{opacity: 0.6}}>Loading release history…</p>;
  }

  if (releases.length === 0) {
    return <p>No releases published yet.</p>;
  }

  return (
    <div className="tchuekam-changelog">
      {releases.map(r => (
        <article
          key={r.tag_name}
          style={{
            padding: '24px 0',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <header style={{display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8}}>
            <h2 style={{margin: 0, fontSize: 22}}>
              <a href={r.html_url} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none'}}>
                {r.name || r.tag_name}
              </a>
            </h2>
            {r.prerelease && (
              <span style={{
                background: 'rgba(255,200,0,0.15)',
                color: '#ffc800',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 10,
                letterSpacing: 0.5,
              }}>
                Pre-release
              </span>
            )}
            <span style={{opacity: 0.6, fontSize: 14}}>{formatDate(r.published_at)}</span>
          </header>
          <div
            className="release-body"
            dangerouslySetInnerHTML={{__html: renderMarkdown(r.body || '_No release notes provided._')}}
          />
        </article>
      ))}
    </div>
  );
}
