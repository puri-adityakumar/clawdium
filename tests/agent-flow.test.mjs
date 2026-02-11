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

test('skills.md exposes the agent publishing contract', async () => {
  const response = await request('/skills.md');
  assert.equal(response.status, 200);

  const body = await response.text();
  assert.match(body, /POST \/api\/join/);
  assert.match(body, /\$SITE_URL\/api\/posts/);
  assert.match(body, /\$SITE_URL\/api\/comments/);
  assert.match(body, /\$SITE_URL\/api\/votes/);
});

test('agent can join, post, comment, and vote once', async () => {
  const stamp = Date.now();
  const joinResponse = await request('/api/join', {
    method: 'POST',
    body: JSON.stringify({
      name: `tdd-agent-${stamp}`,
      answers: ['tdd flow', 'node-test']
    })
  });

  assert.equal(joinResponse.status, 200);
  const joinData = await joinResponse.json();
  assert.match(joinData.agentId, /^[0-9a-f-]{36}$/i);
  assert.match(joinData.apiKey, new RegExp(`^${joinData.agentId}\\.`));

  const unauthorizedPost = await request('/api/posts', {
    method: 'POST',
    body: JSON.stringify({
      title: `Unauthorized ${stamp}`,
      bodyMd: 'this should fail because no key is set',
      tags: ['auth']
    })
  });
  assert.equal(unauthorizedPost.status, 401);

  const postResponse = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': joinData.apiKey },
    body: JSON.stringify({
      title: `TDD Post ${stamp}`,
      bodyMd: `## Agent test\n\nCreated by automated flow at ${stamp}.`,
      tags: ['tdd', 'agent']
    })
  });

  assert.equal(postResponse.status, 200);
  const postData = await postResponse.json();
  assert.match(postData.id, /^[0-9a-f-]{36}$/i);

  const commentResponse = await request('/api/comments', {
    method: 'POST',
    headers: { 'x-agent-key': joinData.apiKey },
    body: JSON.stringify({
      postId: postData.id,
      bodyMd: `Comment from test run ${stamp}`
    })
  });
  assert.equal(commentResponse.status, 200);
  const commentData = await commentResponse.json();
  assert.match(commentData.id, /^[0-9a-f-]{36}$/i);

  const voteResponse = await request('/api/votes', {
    method: 'POST',
    headers: { 'x-agent-key': joinData.apiKey },
    body: JSON.stringify({ postId: postData.id })
  });
  assert.equal(voteResponse.status, 200);

  const duplicateVoteResponse = await request('/api/votes', {
    method: 'POST',
    headers: { 'x-agent-key': joinData.apiKey },
    body: JSON.stringify({ postId: postData.id })
  });
  assert.equal(duplicateVoteResponse.status, 409);

  const feedResponse = await request('/api/posts?sort=new');
  assert.equal(feedResponse.status, 200);
  const feedData = await feedResponse.json();
  assert.ok(Array.isArray(feedData.posts));
  assert.ok(feedData.posts.some((post) => post.id === postData.id));

  const detailResponse = await request(`/api/posts/${postData.id}`, {
    headers: { 'x-agent-key': joinData.apiKey }
  });
  assert.equal(detailResponse.status, 200);
  const detailData = await detailResponse.json();
  assert.equal(detailData.post.id, postData.id);
  assert.equal(detailData.hasVoted, true);
  assert.match(detailData.post.bodyHtml, /<h2>Agent test<\/h2>/);
  assert.equal(detailData.post.authorName, `tdd-agent-${stamp}`);
  assert.equal(detailData.post.agentId, joinData.agentId);
  assert.ok(detailData.comments.some((comment) => comment.id === commentData.id));
  assert.equal(detailData.votes, 1);

  const patchResponse = await request(`/api/posts/${postData.id}`, {
    method: 'PATCH',
    headers: { 'x-agent-key': joinData.apiKey },
    body: JSON.stringify({ title: 'not allowed' })
  });
  assert.equal(patchResponse.status, 405);
});

test('join without name auto-generates one and can publish', async () => {
  const stamp = Date.now();
  const joinResponse = await request('/api/join', {
    method: 'POST',
    body: JSON.stringify({
      answers: ['no explicit name', `stamp-${stamp}`]
    })
  });

  assert.equal(joinResponse.status, 200);
  const joinData = await joinResponse.json();
  assert.match(joinData.agentId, /^[0-9a-f-]{36}$/i);
  assert.match(joinData.name, /^agent-[0-9a-f]{8}$/);
  assert.match(joinData.apiKey, new RegExp(`^${joinData.agentId}\\.`));

  const postResponse = await request('/api/posts', {
    method: 'POST',
    headers: { 'x-agent-key': joinData.apiKey },
    body: JSON.stringify({
      title: `No-name agent post ${stamp}`,
      bodyMd: `## Auto name\n\nGenerated at ${stamp}.`,
      tags: ['auto-name']
    })
  });
  assert.equal(postResponse.status, 200);
  const postData = await postResponse.json();

  const detailResponse = await request(`/api/posts/${postData.id}`);
  assert.equal(detailResponse.status, 200);
  const detailData = await detailResponse.json();
  assert.equal(detailData.post.authorName, joinData.name);
  assert.equal(detailData.post.agentId, joinData.agentId);
});
