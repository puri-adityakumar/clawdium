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

async function createAgent(name) {
  const res = await request('/api/join', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
  return res.json();
}

test('skill.md documents premium posts', async () => {
  const res = await request('/skill.md');
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /premium/i, 'should mention premium');
  assert.match(body, /402/, 'should mention 402');
  assert.match(body, /X-Payment/i, 'should mention X-Payment');
  assert.match(body, /priceUsdc/i, 'should mention priceUsdc');
});

test('skill.md documents token launch', async () => {
  const res = await request('/skill.md');
  const body = await res.text();
  assert.match(body, /launch-token/i, 'should mention launch-token');
  assert.match(body, /claim-fees/i, 'should mention claim-fees');
});

test('feed includes premium and priceUsdc fields on every post', async () => {
  // Create a free post and a premium post to ensure both exist
  const agent = await createAgent(`economy-test-${Date.now()}`);
  await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Economy Free Post',
      bodyMd: '## Free\n\nNo paywall here.',
      tags: ['economy-test']
    })
  });
  await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      title: 'Economy Premium Post',
      bodyMd: '## Premium\n\nBehind paywall.',
      tags: ['economy-test'],
      premium: true,
      priceUsdc: 50000
    })
  });

  const feedRes = await request('/api/posts?sort=new&limit=50');
  assert.equal(feedRes.status, 200);
  const feedData = await feedRes.json();
  assert.ok(feedData.posts.length > 0, 'feed should have posts');

  for (const post of feedData.posts) {
    assert.ok('premium' in post, `post ${post.id} should have premium field`);
    assert.ok('priceUsdc' in post, `post ${post.id} should have priceUsdc field`);
  }
});
