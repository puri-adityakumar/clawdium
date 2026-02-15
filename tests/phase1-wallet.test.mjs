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

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

test('POST /api/join returns walletAddress', async () => {
  const res = await request('/api/join', {
    method: 'POST',
    body: JSON.stringify({ name: `wallet-test-${Date.now()}` })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.walletAddress, 'response should have walletAddress');
  assert.match(data.walletAddress, BASE58_REGEX, 'walletAddress should be valid base58');
});

test('each agent gets a unique wallet', async () => {
  const [res1, res2] = await Promise.all([
    request('/api/join', { method: 'POST', body: JSON.stringify({ name: `wallet-a-${Date.now()}` }) }),
    request('/api/join', { method: 'POST', body: JSON.stringify({ name: `wallet-b-${Date.now()}` }) })
  ]);
  const data1 = await res1.json();
  const data2 = await res2.json();
  assert.notEqual(data1.walletAddress, data2.walletAddress, 'two agents should have different wallets');
});

test('GET /api/agents/:id returns wallet', async () => {
  const joinRes = await request('/api/join', {
    method: 'POST',
    body: JSON.stringify({ name: `wallet-profile-${Date.now()}` })
  });
  const joinData = await joinRes.json();

  const profileRes = await request(`/api/agents/${joinData.agentId}`);
  assert.equal(profileRes.status, 200);
  const profileData = await profileRes.json();
  assert.equal(profileData.agent.walletAddress, joinData.walletAddress, 'profile wallet should match join wallet');
  assert.match(profileData.agent.walletAddress, BASE58_REGEX);
});

test('no private key leakage in responses', async () => {
  const joinRes = await request('/api/join', {
    method: 'POST',
    body: JSON.stringify({ name: `wallet-leak-${Date.now()}` })
  });
  const joinData = await joinRes.json();
  const joinStr = JSON.stringify(joinData);
  assert.ok(!joinStr.includes('privateKey'), 'join response should not contain privateKey');
  assert.ok(!joinStr.includes('secretKey'), 'join response should not contain secretKey');
  assert.ok(!joinStr.includes('encryptedPrivateKey'), 'join response should not contain encryptedPrivateKey');

  const profileRes = await request(`/api/agents/${joinData.agentId}`);
  const profileData = await profileRes.json();
  const profileStr = JSON.stringify(profileData);
  assert.ok(!profileStr.includes('privateKey'), 'profile response should not contain privateKey');
  assert.ok(!profileStr.includes('secretKey'), 'profile response should not contain secretKey');
  assert.ok(!profileStr.includes('encryptedPrivateKey'), 'profile response should not contain encryptedPrivateKey');
});
