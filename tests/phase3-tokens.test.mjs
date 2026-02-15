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

test('POST /api/agents/:id/launch-token without auth returns 401', async () => {
  const agent = await createAgent(`token-noauth-${Date.now()}`);
  const res = await request(`/api/agents/${agent.agentId}/launch-token`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Token',
      symbol: 'TST',
      description: 'A test token for testing purposes'
    })
  });
  assert.equal(res.status, 401);
});

test('POST /api/agents/:id/launch-token with bad input returns 400', async () => {
  const agent = await createAgent(`token-badinput-${Date.now()}`);
  const res = await request(`/api/agents/${agent.agentId}/launch-token`, {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      name: 'X', // too short
      symbol: '', // missing
      description: 'short' // too short
    })
  });
  assert.equal(res.status, 400);
});

test('agent1 cannot launch token for agent2', async () => {
  const agent1 = await createAgent(`token-agent1-${Date.now()}`);
  const agent2 = await createAgent(`token-agent2-${Date.now()}`);
  const res = await request(`/api/agents/${agent2.agentId}/launch-token`, {
    method: 'POST',
    headers: { 'x-agent-key': agent1.apiKey },
    body: JSON.stringify({
      name: 'Sneaky Token',
      symbol: 'SNK',
      description: 'Trying to launch for another agent'
    })
  });
  assert.equal(res.status, 403);
});

test('GET /api/agents/:id shows token: null before launch', async () => {
  const agent = await createAgent(`token-null-${Date.now()}`);
  const res = await request(`/api/agents/${agent.agentId}`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.token, null);
});

test('POST /api/agents/:id/claim-fees without auth returns 401', async () => {
  const agent = await createAgent(`fees-noauth-${Date.now()}`);
  const res = await request(`/api/agents/${agent.agentId}/claim-fees`, {
    method: 'POST'
  });
  assert.equal(res.status, 401);
});

test('POST /api/agents/:id/claim-fees when no token exists returns 404', async () => {
  const agent = await createAgent(`fees-notoken-${Date.now()}`);
  const res = await request(`/api/agents/${agent.agentId}/claim-fees`, {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey }
  });
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.ok(data.error.toLowerCase().includes('token'), 'error should mention token');
});

// Tests that require BAGS_API_KEY — skip in CI without keys
test('actual token launch (requires BAGS_API_KEY)', { skip: !process.env.BAGS_API_KEY }, async () => {
  const agent = await createAgent(`token-launch-${Date.now()}`);
  const res = await request(`/api/agents/${agent.agentId}/launch-token`, {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      name: `ClawdiumTest${Date.now()}`,
      symbol: `CT${Date.now().toString().slice(-4)}`,
      description: 'Automated test token for Clawdium integration testing',
      website: 'https://clawdium.blog'
    })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.tokenMint, 'should have tokenMint');
  assert.ok(data.launchSignature, 'should have launchSignature');
  assert.ok(data.bagsUrl, 'should have bagsUrl');

  // Verify duplicate token launch returns 409
  const dupRes = await request(`/api/agents/${agent.agentId}/launch-token`, {
    method: 'POST',
    headers: { 'x-agent-key': agent.apiKey },
    body: JSON.stringify({
      name: 'Dup Token',
      symbol: 'DUP',
      description: 'Trying to launch a second token'
    })
  });
  assert.equal(dupRes.status, 409);

  // Verify token appears in profile
  const profileRes = await request(`/api/agents/${agent.agentId}`);
  const profile = await profileRes.json();
  assert.ok(profile.token, 'profile should have token');
  assert.equal(profile.token.tokenMint, data.tokenMint);
});
