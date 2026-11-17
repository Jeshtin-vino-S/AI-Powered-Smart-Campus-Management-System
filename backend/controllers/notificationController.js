import { Notification } from '../models/index.js';

// @desc    Get logged in user notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { recipientId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    const unreadCount = await Notification.count({
      where: { recipientId: req.user.id, isRead: false },
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, recipientId: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { recipientId: req.user.id, isRead: false } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear / delete all read notifications
// @route   DELETE /api/notifications/clear
// @access  Private
export const clearNotifications = async (req, res, next) => {
  try {
    await Notification.destroy({
      where: { recipientId: req.user.id },
    });

    res.json({
      success: true,
      message: 'Notifications cleared successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
