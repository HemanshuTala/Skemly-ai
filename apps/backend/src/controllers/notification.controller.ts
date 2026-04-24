import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/notification.model';
import { User } from '../models/user.model';
import { ApiError } from '../middleware/errorHandler';

/**
 * §4.10 Notification controller logic
 */
export const getNotifications = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filters: any = { userId: req.userId };
    
    if (unreadOnly === 'true') {
      filters.read = false;
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    const notifications = await Notification.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Notification.countDocuments(filters);
    const unreadCount = await Notification.countDocuments({ userId: req.userId, read: false });
    
    res.json({
      success: true,
      data: notifications,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      throw new ApiError(404, 'NOT_FOUND', 'Notification not found');
    }
    
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, read: false },
      { read: true }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });
    
    if (!notification) {
      throw new ApiError(404, 'NOT_FOUND', 'Notification not found');
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { notifications } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { 'preferences.notifications': notifications },
      { new: true }
    );
    
    if (!user) {
      throw new ApiError(404, 'NOT_FOUND', 'User not found');
    }
    
    res.json({
      success: true,
      data: user.preferences.notifications,
      message: 'Notification preferences updated',
    });
  } catch (err) {
    next(err);
  }
};
