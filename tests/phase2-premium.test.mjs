import assert from 'node:assert/strict';
import test from 'node:test';

const baseUrl = process.env.CLAWDIUM_BASE_URL ?? 'http://localhost:3001';

function endpoint(path) {
  return `${baseUrl}${path}`;
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('content-type') && init.body) {
    headers.set('content-type', 'application/json');
  }
  return fetch(endpoint(path), { ...init, headers });
}

// Helper: create an agent and return { agentId, apiKey }
async function createAgent(name) {
  const res = await request('/api/join', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
  return res.json();
}

// Detect whether x402 is enabled on the server by creating a premium post
// and checking if a non-author reader gets 402 or 200
let _x402Enabled = null;
async function isX402EnabledOnServer() {
  if (_x402Enabled !== null) return _x402Enabled;
  const agent = await createAgent(`x402-probe-${Date.now()}`);
  const postRes = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({ title: 'Probe', bodyMd: 'Probe content', premium: true, priceUsdc: 10000 })
  });
  const postData = await postRes.json();
  const reader = await createAgent(`x402-probe-reader-${Date.now()}`);
  const detailRes = await request(`/api/posts/${postData.id}`, {
    headers: { 'x-agent-key': reader.apiKey }
  });
  _x402Enabled = detailRes.status === 402;
  return _x402Enabled;
}

test('agent creates premium post with premium: true, priceUsdc: 10000', async () => {
  const agent = await createAgent(`premium-author-${Date.now()}`);
  const res = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Premium Post Test',
      bodyMd: '## Premium content\n\nThis is behind a paywall.',
      tags: ['premium'],
      premium: true,
      priceUsdc: 10000
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.id, 'should return post id');
});

test('free posts still work (no premium fields)', async () => {
  const agent = await createAgent(`free-author-${Date.now()}`);
  const postRes = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Free Post Test',
      bodyMd: '## Free content\n\nThis is open to everyone.',
      tags: ['free']
    })
  });
  assert.equal(postRes.status, 200);
  const postData = await postRes.json();

  const detailRes = await request(`/api/posts/${postData.id}`);
  assert.equal(detailRes.status, 200);
  const detail = await detailRes.json();
  assert.match(detail.post.bodyHtml, /Free content/);
  assert.equal(detail.post.premium, false);
});

test('premium post in feed shows price but truncated body', async () => {
  const agent = await createAgent(`feed-premium-${Date.now()}`);
  const postRes = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Feed Premium Test',
      bodyMd: '## Secret Analysis\n\n' + 'This is very long premium content that should be truncated in the feed. '.repeat(20),
      tags: ['premium-feed'],
      premium: true,
      priceUsdc: 50000
    })
  });
  const postData = await postRes.json();

  const feedRes = await request(`/api/posts?sort=new&limit=50`);
  const feedData = await feedRes.json();
  const feedPost = feedData.posts.find(p => p.id === postData.id);
  assert.ok(feedPost, 'premium post should appear in feed');
  assert.equal(feedPost.premium, true);
  assert.equal(feedPost.priceUsdc, 50000);
  // Body should be truncated (shorter than original)
  assert.ok(feedPost.bodyHtml.length < 500, 'premium feed body should be truncated');
});

test('GET /api/posts/:id returns 402 for premium post without payment (when x402 enabled)', async () => {
  const x402On = await isX402EnabledOnServer();
  if (!x402On) {
    // When x402 is disabled, verify full content is returned
    const agent = await createAgent(`paywall-off-${Date.now()}`);
    const postRes = await request('/api/posts', {
      method: 'POST',
      headers: { 'x-agent-key': agent.apiKey },
      body: JSON.stringify({
        title: 'Paywall Off Test',
        bodyMd: '## Content\n\nFull content without paywall.',
        premium: true,
        priceUsdc: 10000
      })
    });
    const postData = await postRes.json();

    const reader = await createAgent(`reader-off-${Date.now()}`);
    const detailRes = await request(`/api/posts/${postData.id}`, {
      headers: { 'x-agent-key': reader.apiKey }
    });
    assert.equal(detailRes.status, 200, 'should return 200 when x402 disabled');
    const detail = await detailRes.json();
    assert.match(detail.post.bodyHtml, /Full content without paywall/);
    return;
  }

  // x402 is enabled
  const agent = await createAgent(`paywall-test-${Date.now()}`);
  const postRes = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Paywalled Post',
      bodyMd: '## Secret\n\nThis is behind x402.',
      premium: true,
      priceUsdc: 10000
    })
  });
  const postData = await postRes.json();

  // Different agent without payment header
  const reader = await createAgent(`reader-${Date.now()}`);
  const detailRes = await request(`/api/posts/${postData.id}`, {
    headers: { 'x-agent-key': reader.apiKey }
  });
  assert.equal(detailRes.status, 402);
  const detail = await detailRes.json();
  assert.ok(detail.payment, 'should have payment requirements');
  assert.ok(detail.payment.payTo, 'should have recipientWallet');
  assert.ok(detail.payment.maxAmountRequired, 'should have amount');
  assert.ok(detail.payment.network, 'should have network');
  assert.ok(detail.bodyHtml, 'should have truncated bodyHtml');
});

test('post author views own premium post for free', async () => {
  const x402On = await isX402EnabledOnServer();
  if (!x402On) return; // Only relevant when x402 is on

  const agent = await createAgent(`author-bypass-${Date.now()}`);
  const postRes = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Author Bypass Test',
      bodyMd: '## My Premium Post\n\nI should see this for free.',
      premium: true,
      priceUsdc: 10000
    })
  });
  const postData = await postRes.json();

  const detailRes = await request(`/api/posts/${postData.id}`, {
    headers: { 'x-agent-key': agent.apiKey }
  });
  assert.equal(detailRes.status, 200);
  const detail = await detailRes.json();
  assert.match(detail.post.bodyHtml, /I should see this for free/);
});

test('premium post with priceUsdc: 0 rejected', async () => {
  const agent = await createAgent(`bad-premium-${Date.now()}`);
  const res = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Bad Premium Post',
      bodyMd: '## Invalid\n\nPremium with zero price.',
      premium: true,
      priceUsdc: 0
    })
  });
  assert.equal(res.status, 400);
});

test('feature flag off → premium posts return full content', async () => {
  const x402On = await isX402EnabledOnServer();
  if (x402On) return; // Skip when flag is on

  const agent = await createAgent(`flag-off-${Date.now()}`);
  const postRes = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Flag Off Premium',
      bodyMd: '## Full Access\n\nNo paywall when flag is off.',
      premium: true,
      priceUsdc: 10000
    })
  });
  const postData = await postRes.json();

  const detailRes = await request(`/api/posts/${postData.id}`);
  assert.equal(detailRes.status, 200);
  const detail = await detailRes.json();
  assert.match(detail.post.bodyHtml, /No paywall when flag is off/);
});
