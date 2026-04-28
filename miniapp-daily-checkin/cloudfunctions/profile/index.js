const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const collection = db.collection('daily_checkin_profiles');

function validateTask(task) {
  if (!task || typeof task !== 'object') return false;
  if (typeof task.id !== 'number') return false;
  if (typeof task.title !== 'string' || task.title.trim().length === 0) return false;
  if (typeof task.lastCheckinDate !== 'string') return false;
  return true;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (!Array.isArray(payload.tasks)) return false;
  if (!payload.tasks.every(validateTask)) return false;
  if (typeof payload.streak !== 'number' || payload.streak < 0) return false;
  if (typeof payload.lastCheckinDate !== 'string') return false;
  if (!payload.reminder || typeof payload.reminder !== 'object') return false;
  if (typeof payload.reminder.enabled !== 'boolean') return false;
  if (typeof payload.reminder.time !== 'string') return false;
  if (!Array.isArray(payload.checkinHistory)) return false;
  return true;
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, payload } = event || {};

  if (action === 'get') {
    const { data } = await collection.where({ _openid: OPENID }).limit(1).get();
    return { ok: true, profile: data[0] || null };
  }

  if (action === 'save') {
    if (!validatePayload(payload)) {
      return { ok: false, message: 'INVALID_PAYLOAD' };
    }

    const { data } = await collection.where({ _openid: OPENID }).limit(1).get();
    const safePayload = {
      tasks: payload.tasks,
      streak: payload.streak,
      lastCheckinDate: payload.lastCheckinDate,
      reminder: payload.reminder,
      checkinHistory: payload.checkinHistory,
      updatedAt: db.serverDate()
    };

    if (data.length) {
      await collection.doc(data[0]._id).update({ data: safePayload });
      return { ok: true, updated: true };
    }

    await collection.add({
      data: {
        ...safePayload,
        createdAt: db.serverDate()
      }
    });
    return { ok: true, created: true };
  }

  return { ok: false, message: 'UNKNOWN_ACTION' };
};
