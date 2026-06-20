import type { HealthCheckResponse } from '@repo/shared';

async function getHealthStatus(): Promise<HealthCheckResponse | null> {
  try {
    const res = await fetch(
      `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1'}/health`,
      { cache: 'no-store' },
    );
    return res.json() as Promise<HealthCheckResponse>;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealthStatus();

  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '4rem 1rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Monorepo App
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Next.js frontend + Express API backend
      </p>

      <div
        style={{
          padding: '1.5rem',
          border: '1px solid #333',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          API Health
        </h2>
        {health ? (
          <div>
            <p>
              Status: <strong style={{ color: '#22c55e' }}>{health.status}</strong>
            </p>
            <p>Uptime: {health.uptime}s</p>
            <p>Version: {health.version}</p>
          </div>
        ) : (
          <p style={{ color: '#ef4444' }}>
            API is not reachable. Start it with: pnpm dev
          </p>
        )}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <a
          href="/test"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Open Test Dashboard
        </a>
      </div>
    </main>
  );
}
