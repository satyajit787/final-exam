const assert = require('node:assert/strict');
const { once } = require('node:events');
const test = require('node:test');
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const { startServer } = require('../server');

test('complaint API supports CRUD, filters, search, and validation', async (t) => {
  process.env.PORT = '0';
  const server = await startServer();
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/complaints`;
  const marker = `api-test-${Date.now()}`;
  let complaintId;

  const request = async (path, method = 'GET', body) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  };

  try {
    await t.test('creates and reads complaints', async () => {
      const created = await request('', 'POST', {
        studentName: marker,
        email: `${marker}@example.edu`,
        title: `${marker} network issue`,
        description: 'Temporary API integration test record',
        category: 'IT',
        priority: 'High',
        location: 'Library',
      });

      assert.equal(created.status, 201);
      complaintId = created.body.data._id;
      assert.equal(created.body.data.status, 'Open');
      assert.ok(created.body.data.createdAt);
      assert.ok(created.body.data.updatedAt);

      const filtered = await request('?status=Open&category=IT&priority=High');
      assert.equal(filtered.status, 200);
      assert.ok(filtered.body.data.some((item) => item._id === complaintId));

      const searched = await request(`?search=${encodeURIComponent(marker)}`);
      assert.equal(searched.status, 200);
      assert.ok(searched.body.data.some((item) => item._id === complaintId));

      assert.equal((await request(`/${complaintId}`)).status, 200);
    });

    await t.test('updates complaint fields and status', async () => {
      const updated = await request(`/${complaintId}`, 'PUT', {
        title: `${marker} updated issue`,
      });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.data.title, `${marker} updated issue`);

      assert.equal(
        (await request(`/${complaintId}/status`, 'PATCH', { status: 'Unknown' })).status,
        400
      );

      const status = await request(`/${complaintId}/status`, 'PATCH', {
        status: 'In Progress',
      });
      assert.equal(status.status, 200);
      assert.equal(status.body.data.status, 'In Progress');
    });

    await t.test('handles missing fields, invalid IDs, and deletion', async () => {
      assert.equal((await request('', 'POST', {})).status, 400);
      assert.equal((await request('/not-an-object-id')).status, 400);
      assert.equal((await request(`/${complaintId}`, 'DELETE')).status, 200);
      assert.equal((await request(`/${complaintId}`)).status, 404);
    });
  } finally {
    if (complaintId) await Complaint.findByIdAndDelete(complaintId);
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
});