const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const dbJson = require('../db');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

async function createNotification({ userId, recipientRole = 'customer', title, message, type = 'INFO', bookingId = null }) {
  if (!userId || !title || !message) {
    return null;
  }

  const id = 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

  const notifObj = {
    id,
    userId,
    recipientRole,
    title,
    message,
    type,
    bookingId,
    read: false,
    createdAt: new Date().toISOString()
  };

  if (isMongoConnected()) {
    try {
      const notification = new Notification(notifObj);
      await notification.save();
      return notification.toObject();
    } catch (err) {
      console.error('[NOTIFICATION MONGODB SAVE ERROR]:', err.message);
    }
  }

  await dbJson.saveNotification(notifObj);
  return notifObj;
}

async function getUserNotifications(userId, recipientRole = null) {
  if (!userId) return { notifications: [], unreadCount: 0 };

  if (isMongoConnected()) {
    try {
      const query = { userId };
      if (recipientRole) {
        query.recipientRole = recipientRole;
      }
      const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50).lean();
      const unreadCount = await Notification.countDocuments({ ...query, read: false });
      return { notifications, unreadCount };
    } catch (err) {
      console.error('[NOTIFICATION MONGODB FETCH ERROR]:', err.message);
    }
  }

  const all = await dbJson.getNotifications();
  let userNotifs = all.filter(n => n.userId === userId);
  if (recipientRole) {
    userNotifs = userNotifs.filter(n => n.recipientRole === recipientRole);
  }
  userNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unreadCount = userNotifs.filter(n => !n.read).length;
  return { notifications: userNotifs.slice(0, 50), unreadCount };
}

async function markNotificationAsRead(notificationId, userId) {
  if (isMongoConnected()) {
    try {
      if (notificationId === 'all') {
        await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
        return { success: true };
      }

      const updated = await Notification.findOneAndUpdate(
        { id: notificationId, userId },
        { $set: { read: true } },
        { new: true }
      ).lean();

      return { success: !!updated, notification: updated };
    } catch (err) {
      console.error('[NOTIFICATION MONGODB MARK READ ERROR]:', err.message);
    }
  }

  const all = await dbJson.getNotifications();
  if (notificationId === 'all') {
    for (const n of all) {
      if (n.userId === userId) n.read = true;
    }
    await dbJson.writeJsonFile(dbJson.NOTIFICATIONS_FILE, all);
    return { success: true };
  }

  const target = all.find(n => n.id === notificationId && n.userId === userId);
  if (target) {
    target.read = true;
    await dbJson.writeJsonFile(dbJson.NOTIFICATIONS_FILE, all);
    return { success: true, notification: target };
  }

  return { success: false };
}

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead
};
